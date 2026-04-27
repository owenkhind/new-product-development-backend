import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { RevampEolRecommendationsRepository } from '../../revamp-eol-recommendations/repositories/revamp-eol-recommendations.repository';
import type { CreateEolExecutionPlanDto, CreateEolMilestoneDto, CreateEolStockPositionDto } from '../dto/create-eol-execution-plan.dto';
import type { UpdateEolExecutionPlanDto } from '../dto/update-eol-execution-plan.dto';
import { EolExecutionPlansRepository } from '../repositories/eol-execution-plans.repository';
import type { EolExecutionPlanRecord, EolMilestoneRecord, EolStockPositionRecord } from '../types/eol-execution-plan-record.type';

@Injectable()
export class EolExecutionPlansService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly revampEolRecommendationsRepository: RevampEolRecommendationsRepository,
    private readonly eolExecutionPlansRepository: EolExecutionPlansRepository,
  ) {}

  async create(productId: string, input: CreateEolExecutionPlanDto): Promise<EolExecutionPlanRecord> {
    await this.assertStageSixEditable(productId);
    await this.assertApprovedEolRecommendation(productId);

    const existingRecord = await this.eolExecutionPlansRepository.findByProductId(productId);

    if (existingRecord) {
      throw new ConflictException({
        code: 'EOL_EXECUTION_PLAN_ALREADY_EXISTS',
        message: `EOL execution plan already exists for product ${productId}.`,
      });
    }

    return this.eolExecutionPlansRepository.create({
      id: randomUUID(),
      kdHandoffNotes: input.kdHandoffNotes,
      milestones: this.mapMilestones(input.milestones),
      productId,
      serviceContinuityPlan: input.serviceContinuityPlan,
      sparePartsPlan: input.sparePartsPlan,
      stockPositions: this.mapStockPositions(input.stockPositions),
      summary: input.summary,
    });
  }

  async findOne(productId: string): Promise<EolExecutionPlanRecord> {
    const record = await this.eolExecutionPlansRepository.findByProductId(productId);

    if (!record) {
      throw new NotFoundException({
        code: 'EOL_EXECUTION_PLAN_NOT_FOUND',
        message: `EOL execution plan for product ${productId} was not found.`,
      });
    }

    return record;
  }

  async update(productId: string, input: UpdateEolExecutionPlanDto): Promise<EolExecutionPlanRecord> {
    await this.assertStageSixEditable(productId);

    const existingRecord = await this.eolExecutionPlansRepository.findByProductId(productId);

    if (!existingRecord) {
      throw new NotFoundException({
        code: 'EOL_EXECUTION_PLAN_NOT_FOUND',
        message: `EOL execution plan for product ${productId} was not found.`,
      });
    }

    const updatedRecord = await this.eolExecutionPlansRepository.update(productId, {
      kdHandoffNotes: input.kdHandoffNotes,
      milestones: input.milestones ? this.mapMilestones(input.milestones) : undefined,
      serviceContinuityPlan: input.serviceContinuityPlan,
      sparePartsPlan: input.sparePartsPlan,
      stockPositions: input.stockPositions ? this.mapStockPositions(input.stockPositions) : undefined,
      summary: input.summary,
    });

    if (!updatedRecord) {
      throw new NotFoundException({
        code: 'EOL_EXECUTION_PLAN_NOT_FOUND',
        message: `EOL execution plan for product ${productId} was not found.`,
      });
    }

    return updatedRecord;
  }

  private async assertStageSixEditable(productId: string): Promise<void> {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${productId} was not found.`,
      });
    }

    if (product.currentStage !== ProductStage.STAGE_6) {
      throw new BadRequestException({
        code: 'STAGE_SIX_TEMPLATE_LOCKED',
        message: `Stage 6 EOL execution can only be edited while product ${productId} is in Stage 6.`,
      });
    }
  }

  private async assertApprovedEolRecommendation(productId: string): Promise<void> {
    const recommendation = await this.revampEolRecommendationsRepository.findApprovedEolByProductId(productId);

    if (!recommendation) {
      throw new ConflictException({
        code: 'APPROVED_EOL_RECOMMENDATION_REQUIRED',
        message: 'An approved Stage 5 EOL recommendation is required before Stage 6 execution can start.',
      });
    }
  }

  private mapStockPositions(rows: CreateEolStockPositionDto[]): EolStockPositionRecord[] {
    return rows.map((row) => ({
      channelType: row.channelType,
      estimatedStockValue: row.estimatedStockValue,
      id: randomUUID(),
      notes: row.notes ?? null,
      onHandUnits: row.onHandUnits,
      reservedUnits: row.reservedUnits,
    }));
  }

  private mapMilestones(rows: CreateEolMilestoneDto[]): EolMilestoneRecord[] {
    return rows.map((row) => ({
      dueDate: row.dueDate,
      id: randomUUID(),
      milestoneName: row.milestoneName,
      notes: row.notes ?? null,
      ownerRole: row.ownerRole,
      status: row.status,
    }));
  }
}
