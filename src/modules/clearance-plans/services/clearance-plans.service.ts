import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { RevampEolRecommendationsRepository } from '../../revamp-eol-recommendations/repositories/revamp-eol-recommendations.repository';
import type {
  CreateClearanceAllocationDto,
  CreateClearancePlanDto,
  CreateClearancePricingDto,
  CreateClearanceWeeklyTrackerDto,
} from '../dto/create-clearance-plan.dto';
import type { UpdateClearancePlanDto } from '../dto/update-clearance-plan.dto';
import { ClearancePlansRepository } from '../repositories/clearance-plans.repository';
import type {
  ClearanceAllocationRecord,
  ClearancePlanRecord,
  ClearancePricingRecord,
  ClearanceWeeklyTrackerRecord,
} from '../types/clearance-plan-record.type';

@Injectable()
export class ClearancePlansService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly revampEolRecommendationsRepository: RevampEolRecommendationsRepository,
    private readonly clearancePlansRepository: ClearancePlansRepository,
  ) {}

  async create(productId: string, input: CreateClearancePlanDto): Promise<ClearancePlanRecord> {
    await this.assertStageSixEditable(productId);
    await this.assertApprovedEolRecommendation(productId);
    this.assertPricingRowsAllowed(input.pricingRows);

    const existingRecord = await this.clearancePlansRepository.findByProductId(productId);

    if (existingRecord) {
      throw new ConflictException({
        code: 'CLEARANCE_PLAN_ALREADY_EXISTS',
        message: `Clearance plan already exists for product ${productId}.`,
      });
    }

    return this.clearancePlansRepository.create({
      allocations: this.mapAllocations(input.allocations),
      executionInstructions: input.executionInstructions,
      id: randomUUID(),
      pricingRows: this.mapPricingRows(input.pricingRows),
      productId,
      summary: input.summary,
      weeklyTrackers: this.mapWeeklyTrackers(input.weeklyTrackers),
    });
  }

  async findOne(productId: string): Promise<ClearancePlanRecord> {
    const record = await this.clearancePlansRepository.findByProductId(productId);

    if (!record) {
      throw new NotFoundException({
        code: 'CLEARANCE_PLAN_NOT_FOUND',
        message: `Clearance plan for product ${productId} was not found.`,
      });
    }

    return record;
  }

  async update(productId: string, input: UpdateClearancePlanDto): Promise<ClearancePlanRecord> {
    await this.assertStageSixEditable(productId);

    const existingRecord = await this.clearancePlansRepository.findByProductId(productId);

    if (!existingRecord) {
      throw new NotFoundException({
        code: 'CLEARANCE_PLAN_NOT_FOUND',
        message: `Clearance plan for product ${productId} was not found.`,
      });
    }

    if (input.pricingRows) {
      this.assertPricingRowsAllowed(input.pricingRows);
    }

    const updatedRecord = await this.clearancePlansRepository.update(productId, {
      allocations: input.allocations ? this.mapAllocations(input.allocations) : undefined,
      executionInstructions: input.executionInstructions,
      pricingRows: input.pricingRows ? this.mapPricingRows(input.pricingRows) : undefined,
      summary: input.summary,
      weeklyTrackers: input.weeklyTrackers ? this.mapWeeklyTrackers(input.weeklyTrackers) : undefined,
    });

    if (!updatedRecord) {
      throw new NotFoundException({
        code: 'CLEARANCE_PLAN_NOT_FOUND',
        message: `Clearance plan for product ${productId} was not found.`,
      });
    }

    return updatedRecord;
  }

  private assertPricingRowsAllowed(rows: CreateClearancePricingDto[]): void {
    const invalidRow = rows.find((row) => {
      const originalRsp = Number(row.originalRsp);
      const clearanceRsp = Number(row.clearanceRsp);
      const floorPrice = Number(row.floorPrice);

      return originalRsp <= 0 || clearanceRsp <= 0 || floorPrice < 0;
    });

    if (invalidRow) {
      throw new BadRequestException({
        code: 'CLEARANCE_PRICING_INVALID',
        message: 'Original RSP and clearance RSP must be positive, and floor price cannot be negative.',
      });
    }

    const belowFloorWithoutApproval = rows.find(
      (row) => Number(row.clearanceRsp) < Number(row.floorPrice) && !row.markdownApproved,
    );

    if (belowFloorWithoutApproval) {
      throw new ConflictException({
        code: 'MARKDOWN_APPROVAL_REQUIRED',
        message: 'Clearance prices below floor require markdown approval.',
      });
    }
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
        message: `Stage 6 clearance can only be edited while product ${productId} is in Stage 6.`,
      });
    }
  }

  private async assertApprovedEolRecommendation(productId: string): Promise<void> {
    const recommendation = await this.revampEolRecommendationsRepository.findApprovedEolByProductId(productId);

    if (!recommendation) {
      throw new ConflictException({
        code: 'APPROVED_EOL_RECOMMENDATION_REQUIRED',
        message: 'An approved Stage 5 EOL recommendation is required before clearance can start.',
      });
    }
  }

  private mapPricingRows(rows: CreateClearancePricingDto[]): ClearancePricingRecord[] {
    return rows.map((row) => ({
      channelType: row.channelType,
      clearanceRsp: row.clearanceRsp,
      floorPrice: row.floorPrice,
      id: randomUUID(),
      markdownApproved: row.markdownApproved,
      notes: row.notes ?? null,
      originalRsp: row.originalRsp,
    }));
  }

  private mapAllocations(rows: CreateClearanceAllocationDto[]): ClearanceAllocationRecord[] {
    return rows.map((row) => ({
      allocatedUnits: row.allocatedUnits,
      channelType: row.channelType,
      id: randomUUID(),
      notes: row.notes ?? null,
    }));
  }

  private mapWeeklyTrackers(rows: CreateClearanceWeeklyTrackerDto[]): ClearanceWeeklyTrackerRecord[] {
    return rows.map((row) => ({
      id: randomUUID(),
      notes: row.notes ?? null,
      status: row.status,
      unitsCleared: row.unitsCleared,
      weekStartDate: row.weekStartDate,
    }));
  }
}
