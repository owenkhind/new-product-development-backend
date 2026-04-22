import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductsRepository } from '../../products/repositories/products.repository';
import type { CreateOpportunityBriefDto } from '../dto/create-opportunity-brief.dto';
import type { UpdateOpportunityBriefDto } from '../dto/update-opportunity-brief.dto';
import { OpportunityBriefsRepository } from '../repositories/opportunity-briefs.repository';
import type { OpportunityBriefRecord } from '../types/opportunity-brief-record.type';

@Injectable()
export class OpportunityBriefsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly opportunityBriefsRepository: OpportunityBriefsRepository,
  ) {}

  async create(productId: string, input: CreateOpportunityBriefDto): Promise<OpportunityBriefRecord> {
    await this.assertProductStageIsEditable(productId);

    const existingRecord = await this.opportunityBriefsRepository.findByProductId(productId);

    if (existingRecord) {
      throw new ConflictException({
        code: 'OPPORTUNITY_BRIEF_ALREADY_EXISTS',
        message: `An opportunity brief already exists for product ${productId}.`,
      });
    }

    return this.opportunityBriefsRepository.create({
      ...this.mapInput(productId, input),
      id: randomUUID(),
    });
  }

  async findOne(productId: string): Promise<OpportunityBriefRecord> {
    const record = await this.opportunityBriefsRepository.findByProductId(productId);

    if (!record) {
      throw new NotFoundException({
        code: 'OPPORTUNITY_BRIEF_NOT_FOUND',
        message: `Opportunity brief for product ${productId} was not found.`,
      });
    }

    return record;
  }

  async update(productId: string, input: UpdateOpportunityBriefDto): Promise<OpportunityBriefRecord> {
    await this.assertProductStageIsEditable(productId);

    const existingRecord = await this.opportunityBriefsRepository.findByProductId(productId);

    if (!existingRecord) {
      throw new NotFoundException({
        code: 'OPPORTUNITY_BRIEF_NOT_FOUND',
        message: `Opportunity brief for product ${productId} was not found.`,
      });
    }

    const mergedRecord = {
      ...existingRecord,
      ...this.mapUpdateInput(input),
    };
    const normalizedRecord: OpportunityBriefRecord = {
      ...mergedRecord,
      artTotalScore: this.calculateArtTotalScore(mergedRecord),
      uniqueSellingPoints: mergedRecord.uniqueSellingPoints ?? [],
    };

    const updatedRecord = await this.opportunityBriefsRepository.update(productId, {
      ...this.mapRecordToUpdateInput(normalizedRecord),
    });

    if (!updatedRecord) {
      throw new NotFoundException({
        code: 'OPPORTUNITY_BRIEF_NOT_FOUND',
        message: `Opportunity brief for product ${productId} was not found.`,
      });
    }

    return updatedRecord;
  }

  private async assertProductStageIsEditable(productId: string): Promise<void> {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${productId} was not found.`,
      });
    }

    if (product.currentStage !== ProductStage.STAGE_1) {
      throw new ConflictException({
        code: 'STAGE_ONE_TEMPLATE_LOCKED',
        message: `Stage 1 templates can only be edited while product ${productId} is in Stage 1.`,
      });
    }
  }

  private mapInput(
    productId: string,
    input: CreateOpportunityBriefDto | OpportunityBriefRecord,
  ) {
    return {
      affordableCostScore: input.affordableCostScore,
      affordablePriceScore: input.affordablePriceScore,
      affordableValueScore: input.affordableValueScore,
      artTotalScore: this.calculateArtTotalScore(input),
      complianceNotes: input.complianceNotes ?? null,
      opportunitySource: input.opportunitySource,
      problemStatement: input.problemStatement,
      productId,
      reliableComplianceScore: input.reliableComplianceScore,
      reliableDurabilityScore: input.reliableDurabilityScore,
      reliableServiceScore: input.reliableServiceScore,
      requiredDocumentsComplete: input.requiredDocumentsComplete,
      targetCustomer: input.targetCustomer,
      targetMarket: input.targetMarket,
      trendyCategoryScore: input.trendyCategoryScore,
      trendyColourScore: input.trendyColourScore,
      trendyDesignScore: input.trendyDesignScore,
      uniqueSellingPoints: [...new Set(input.uniqueSellingPoints)],
    };
  }

  private mapUpdateInput(input: UpdateOpportunityBriefDto): Partial<OpportunityBriefRecord> {
    const output: Partial<OpportunityBriefRecord> = {};

    if (input.affordableCostScore !== undefined) {
      output.affordableCostScore = input.affordableCostScore;
    }

    if (input.affordablePriceScore !== undefined) {
      output.affordablePriceScore = input.affordablePriceScore;
    }

    if (input.affordableValueScore !== undefined) {
      output.affordableValueScore = input.affordableValueScore;
    }

    if (input.complianceNotes !== undefined) {
      output.complianceNotes = input.complianceNotes;
    }

    if (input.opportunitySource !== undefined) {
      output.opportunitySource = input.opportunitySource;
    }

    if (input.problemStatement !== undefined) {
      output.problemStatement = input.problemStatement;
    }

    if (input.reliableComplianceScore !== undefined) {
      output.reliableComplianceScore = input.reliableComplianceScore;
    }

    if (input.reliableDurabilityScore !== undefined) {
      output.reliableDurabilityScore = input.reliableDurabilityScore;
    }

    if (input.reliableServiceScore !== undefined) {
      output.reliableServiceScore = input.reliableServiceScore;
    }

    if (input.requiredDocumentsComplete !== undefined) {
      output.requiredDocumentsComplete = input.requiredDocumentsComplete;
    }

    if (input.targetCustomer !== undefined) {
      output.targetCustomer = input.targetCustomer;
    }

    if (input.targetMarket !== undefined) {
      output.targetMarket = input.targetMarket;
    }

    if (input.trendyCategoryScore !== undefined) {
      output.trendyCategoryScore = input.trendyCategoryScore;
    }

    if (input.trendyColourScore !== undefined) {
      output.trendyColourScore = input.trendyColourScore;
    }

    if (input.trendyDesignScore !== undefined) {
      output.trendyDesignScore = input.trendyDesignScore;
    }

    if (input.uniqueSellingPoints !== undefined) {
      output.uniqueSellingPoints = [...new Set(input.uniqueSellingPoints)];
    }

    return output;
  }

  private mapRecordToUpdateInput(record: OpportunityBriefRecord) {
    return {
      affordableCostScore: record.affordableCostScore,
      affordablePriceScore: record.affordablePriceScore,
      affordableValueScore: record.affordableValueScore,
      artTotalScore: record.artTotalScore,
      complianceNotes: record.complianceNotes,
      opportunitySource: record.opportunitySource,
      problemStatement: record.problemStatement,
      reliableComplianceScore: record.reliableComplianceScore,
      reliableDurabilityScore: record.reliableDurabilityScore,
      reliableServiceScore: record.reliableServiceScore,
      requiredDocumentsComplete: record.requiredDocumentsComplete,
      targetCustomer: record.targetCustomer,
      targetMarket: record.targetMarket,
      trendyCategoryScore: record.trendyCategoryScore,
      trendyColourScore: record.trendyColourScore,
      trendyDesignScore: record.trendyDesignScore,
      uniqueSellingPoints: record.uniqueSellingPoints,
    };
  }

  private calculateArtTotalScore(input: {
    affordableCostScore: number;
    affordablePriceScore: number;
    affordableValueScore: number;
    reliableComplianceScore: number;
    reliableDurabilityScore: number;
    reliableServiceScore: number;
    trendyCategoryScore: number;
    trendyColourScore: number;
    trendyDesignScore: number;
  }): number {
    return (
      input.affordablePriceScore +
      input.affordableCostScore +
      input.affordableValueScore +
      input.reliableDurabilityScore +
      input.reliableServiceScore +
      input.reliableComplianceScore +
      input.trendyDesignScore +
      input.trendyColourScore +
      input.trendyCategoryScore
    );
  }
}
