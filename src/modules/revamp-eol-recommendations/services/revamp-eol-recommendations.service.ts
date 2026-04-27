import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { DatabaseService } from '../../../database/database.service';
import { AuditAction } from '../../../enums/audit-action.enum';
import { AuditEntityType } from '../../../enums/audit-entity-type.enum';
import { ProductStage } from '../../../enums/product-stage.enum';
import { RevampEolDecision } from '../../../enums/revamp-eol-decision.enum';
import { RevampEolRecommendationOutcome } from '../../../enums/revamp-eol-recommendation-outcome.enum';
import type { AuthenticatedUser } from '../../../types/authenticated-user.type';
import { AuditLogsRepository } from '../../audit-logs/repositories/audit-logs.repository';
import { ProductsRepository } from '../../products/repositories/products.repository';
import type { CreateRevampEolRecommendationDto } from '../dto/create-revamp-eol-recommendation.dto';
import type { RecordCooDecisionDto } from '../dto/record-coo-decision.dto';
import type { RecordGmCommercialInputDto } from '../dto/record-gm-commercial-input.dto';
import type { UpdateRevampEolRecommendationDto } from '../dto/update-revamp-eol-recommendation.dto';
import { RevampEolRecommendationsRepository } from '../repositories/revamp-eol-recommendations.repository';
import type { RevampEolRecommendationRecord } from '../types/revamp-eol-recommendation-record.type';

@Injectable()
export class RevampEolRecommendationsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly productsRepository: ProductsRepository,
    private readonly auditLogsRepository: AuditLogsRepository,
    private readonly revampEolRecommendationsRepository: RevampEolRecommendationsRepository,
  ) {}

  async create(
    productId: string,
    input: CreateRevampEolRecommendationDto,
  ): Promise<RevampEolRecommendationRecord> {
    await this.assertStageFiveEditable(productId);
    this.assertOutcomeOptionPresent(input);

    const existingRecord = await this.revampEolRecommendationsRepository.findByProductId(productId);

    if (existingRecord) {
      throw new ConflictException({
        code: 'REVAMP_EOL_RECOMMENDATION_ALREADY_EXISTS',
        message: `A revamp/EOL recommendation already exists for product ${productId}.`,
      });
    }

    return this.revampEolRecommendationsRepository.create({
      cooDecision: null,
      cooDecisionAt: null,
      cooDecisionByUserId: null,
      cooDecisionComment: null,
      eolOption: input.eolOption ?? null,
      gmCommercialInput: null,
      gmInputAt: null,
      gmInputByUserId: null,
      holdOption: input.holdOption ?? null,
      id: randomUUID(),
      productId,
      recommendationOutcome: input.recommendationOutcome,
      recommendationSummary: input.recommendationSummary,
      revampOption: input.revampOption ?? null,
      rootCauseAnalysis: input.rootCauseAnalysis,
      triggerReasons: input.triggerReasons,
    });
  }

  async findOne(productId: string): Promise<RevampEolRecommendationRecord> {
    const record = await this.revampEolRecommendationsRepository.findByProductId(productId);

    if (!record) {
      throw new NotFoundException({
        code: 'REVAMP_EOL_RECOMMENDATION_NOT_FOUND',
        message: `Revamp/EOL recommendation for product ${productId} was not found.`,
      });
    }

    return record;
  }

  async update(
    productId: string,
    input: UpdateRevampEolRecommendationDto,
  ): Promise<RevampEolRecommendationRecord> {
    await this.assertStageFiveEditable(productId);

    const existingRecord = await this.findOne(productId);

    if (existingRecord.cooDecision) {
      throw new ConflictException({
        code: 'REVAMP_EOL_RECOMMENDATION_DECIDED',
        message: 'A recommendation cannot be edited after the COO decision is recorded.',
      });
    }

    this.assertOutcomeOptionPresent({
      eolOption: input.eolOption ?? existingRecord.eolOption ?? undefined,
      holdOption: input.holdOption ?? existingRecord.holdOption ?? undefined,
      recommendationOutcome: input.recommendationOutcome ?? existingRecord.recommendationOutcome,
      recommendationSummary: input.recommendationSummary ?? existingRecord.recommendationSummary,
      revampOption: input.revampOption ?? existingRecord.revampOption ?? undefined,
      rootCauseAnalysis: input.rootCauseAnalysis ?? existingRecord.rootCauseAnalysis,
      triggerReasons: input.triggerReasons ?? existingRecord.triggerReasons,
    });

    const updatedRecord = await this.revampEolRecommendationsRepository.update(productId, {
      eolOption: input.eolOption,
      holdOption: input.holdOption,
      recommendationOutcome: input.recommendationOutcome,
      recommendationSummary: input.recommendationSummary,
      revampOption: input.revampOption,
      rootCauseAnalysis: input.rootCauseAnalysis,
      triggerReasons: input.triggerReasons,
    });

    if (!updatedRecord) {
      throw new NotFoundException({
        code: 'REVAMP_EOL_RECOMMENDATION_NOT_FOUND',
        message: `Revamp/EOL recommendation for product ${productId} was not found.`,
      });
    }

    return updatedRecord;
  }

  async recordGmCommercialInput(
    productId: string,
    actor: AuthenticatedUser,
    input: RecordGmCommercialInputDto,
  ): Promise<RevampEolRecommendationRecord> {
    await this.assertStageFiveEditable(productId);
    const existingRecord = await this.findOne(productId);
    this.assertAdminOverrideReason(actor, input.overrideReason);

    const client = await this.databaseService.getClient();

    try {
      await client.query('BEGIN');

      const updatedRecord = await this.revampEolRecommendationsRepository.update(
        productId,
        {
          gmCommercialInput: input.commercialInput,
          gmInputAt: new Date(),
          gmInputByUserId: actor.id,
        },
        client,
      );

      if (!updatedRecord) {
        throw new NotFoundException({
          code: 'REVAMP_EOL_RECOMMENDATION_NOT_FOUND',
          message: `Revamp/EOL recommendation for product ${productId} was not found.`,
        });
      }

      await this.auditLogsRepository.create(
        {
          actingAsUserId: actor.actingAsUserId ?? null,
          action: AuditAction.GM_COMMERCIAL_INPUT_RECORDED,
          actorUserId: actor.id,
          entityId: productId,
          entityType: AuditEntityType.PRODUCT,
          fromState: existingRecord,
          id: randomUUID(),
          metadata: {
            overrideReason: input.overrideReason ?? null,
            stage: ProductStage.STAGE_5,
          },
          productId,
          toState: updatedRecord,
        },
        client,
      );

      await client.query('COMMIT');
      return updatedRecord;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async recordCooDecision(
    productId: string,
    actor: AuthenticatedUser,
    input: RecordCooDecisionDto,
  ): Promise<RevampEolRecommendationRecord> {
    await this.assertStageFiveEditable(productId);
    const existingRecord = await this.findOne(productId);
    this.assertAdminOverrideReason(actor, input.overrideReason);

    if (!existingRecord.gmInputAt) {
      throw new ConflictException({
        code: 'GM_COMMERCIAL_INPUT_REQUIRED',
        message: 'GM commercial input is required before the COO decision.',
      });
    }

    if (existingRecord.cooDecision) {
      throw new ConflictException({
        code: 'COO_DECISION_ALREADY_RECORDED',
        message: 'The COO decision has already been recorded for this recommendation.',
      });
    }

    const client = await this.databaseService.getClient();

    try {
      await client.query('BEGIN');

      const updatedRecord = await this.revampEolRecommendationsRepository.update(
        productId,
        {
          cooDecision: input.decision,
          cooDecisionAt: new Date(),
          cooDecisionByUserId: actor.id,
          cooDecisionComment: input.comment ?? null,
        },
        client,
      );

      if (!updatedRecord) {
        throw new NotFoundException({
          code: 'REVAMP_EOL_RECOMMENDATION_NOT_FOUND',
          message: `Revamp/EOL recommendation for product ${productId} was not found.`,
        });
      }

      await this.auditLogsRepository.create(
        {
          actingAsUserId: actor.actingAsUserId ?? null,
          action: AuditAction.COO_RECOMMENDATION_DECIDED,
          actorUserId: actor.id,
          entityId: productId,
          entityType: AuditEntityType.PRODUCT,
          fromState: existingRecord,
          id: randomUUID(),
          metadata: {
            decision: input.decision,
            isApprovedEol: this.isApprovedEolDecision(updatedRecord),
            overrideReason: input.overrideReason ?? null,
            stage: ProductStage.STAGE_5,
          },
          productId,
          toState: updatedRecord,
        },
        client,
      );

      await client.query('COMMIT');
      return updatedRecord;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private isApprovedEolDecision(record: RevampEolRecommendationRecord): boolean {
    return (
      record.recommendationOutcome === RevampEolRecommendationOutcome.EOL &&
      record.cooDecision === RevampEolDecision.APPROVED
    );
  }

  private assertOutcomeOptionPresent(input: CreateRevampEolRecommendationDto): void {
    const optionByOutcome = {
      [RevampEolRecommendationOutcome.REVAMP]: input.revampOption,
      [RevampEolRecommendationOutcome.EOL]: input.eolOption,
      [RevampEolRecommendationOutcome.HOLD]: input.holdOption,
    };

    if (!optionByOutcome[input.recommendationOutcome]) {
      throw new BadRequestException({
        code: 'REVAMP_EOL_OUTCOME_OPTION_REQUIRED',
        message: `Recommendation outcome ${input.recommendationOutcome} requires its matching option details.`,
      });
    }
  }

  private assertAdminOverrideReason(actor: AuthenticatedUser, overrideReason?: string): void {
    if (actor.isAdminSupportOverride && !overrideReason) {
      throw new BadRequestException({
        code: 'ADMIN_OVERRIDE_REASON_REQUIRED',
        message: 'Admin support overrides must include an overrideReason.',
      });
    }
  }

  private async assertStageFiveEditable(productId: string): Promise<void> {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${productId} was not found.`,
      });
    }

    if (product.currentStage !== ProductStage.STAGE_5) {
      throw new BadRequestException({
        code: 'STAGE_FIVE_TEMPLATE_LOCKED',
        message: `Stage 5 recommendations can only be edited while product ${productId} is in Stage 5.`,
      });
    }
  }
}
