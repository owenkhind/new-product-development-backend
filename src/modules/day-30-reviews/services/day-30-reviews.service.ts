import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { Day30PerformanceFlag } from '../../../enums/day-30-performance-flag.enum';
import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductsRepository } from '../../products/repositories/products.repository';
import { CHANNEL_GP_FLOORS } from '../../channel-pricing/services/channel-pricing.service';
import type { CreateDay30ReviewChannelGpDto, CreateDay30ReviewDto } from '../dto/create-day-30-review.dto';
import type { UpdateDay30ReviewDto } from '../dto/update-day-30-review.dto';
import { Day30ReviewsRepository } from '../repositories/day-30-reviews.repository';
import type { Day30ReviewChannelGpRecord, Day30ReviewRecord } from '../types/day-30-review-record.type';

@Injectable()
export class Day30ReviewsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly day30ReviewsRepository: Day30ReviewsRepository,
  ) {}

  async create(productId: string, input: CreateDay30ReviewDto): Promise<Day30ReviewRecord> {
    await this.assertStageFourEditable(productId);

    const existingRecord = await this.day30ReviewsRepository.findByProductId(productId);

    if (existingRecord) {
      throw new ConflictException({
        code: 'DAY_30_REVIEW_ALREADY_EXISTS',
        message: `Day 30 review already exists for product ${productId}.`,
      });
    }

    const channelGp = this.mapChannelGp(input.channelGp);

    return this.day30ReviewsRepository.create({
      actionPlan: input.actionPlan,
      actualRevenue: input.actualRevenue,
      actualSellThroughUnits: input.actualSellThroughUnits,
      channelGp,
      flags: this.calculateFlags({
        actualRevenue: input.actualRevenue,
        actualSellThroughUnits: input.actualSellThroughUnits,
        channelGp,
        targetRevenue: input.targetRevenue,
        targetSellThroughUnits: input.targetSellThroughUnits,
      }),
      id: randomUUID(),
      productId,
      reviewSummary: input.reviewSummary,
      targetRevenue: input.targetRevenue,
      targetSellThroughUnits: input.targetSellThroughUnits,
      verdict: input.verdict,
    });
  }

  async findOne(productId: string): Promise<Day30ReviewRecord> {
    const record = await this.day30ReviewsRepository.findByProductId(productId);

    if (!record) {
      throw new NotFoundException({
        code: 'DAY_30_REVIEW_NOT_FOUND',
        message: `Day 30 review for product ${productId} was not found.`,
      });
    }

    return record;
  }

  async update(productId: string, input: UpdateDay30ReviewDto): Promise<Day30ReviewRecord> {
    await this.assertStageFourEditable(productId);

    const existingRecord = await this.day30ReviewsRepository.findByProductId(productId);

    if (!existingRecord) {
      throw new NotFoundException({
        code: 'DAY_30_REVIEW_NOT_FOUND',
        message: `Day 30 review for product ${productId} was not found.`,
      });
    }

    const channelGp = input.channelGp ? this.mapChannelGp(input.channelGp) : existingRecord.channelGp;
    const targetSellThroughUnits =
      input.targetSellThroughUnits ?? existingRecord.targetSellThroughUnits;
    const actualSellThroughUnits =
      input.actualSellThroughUnits ?? existingRecord.actualSellThroughUnits;
    const targetRevenue = input.targetRevenue ?? existingRecord.targetRevenue;
    const actualRevenue = input.actualRevenue ?? existingRecord.actualRevenue;

    const updatedRecord = await this.day30ReviewsRepository.update(productId, {
      actionPlan: input.actionPlan,
      actualRevenue,
      actualSellThroughUnits,
      channelGp,
      flags: this.calculateFlags({
        actualRevenue,
        actualSellThroughUnits,
        channelGp,
        targetRevenue,
        targetSellThroughUnits,
      }),
      reviewSummary: input.reviewSummary,
      targetRevenue,
      targetSellThroughUnits,
      verdict: input.verdict,
    });

    if (!updatedRecord) {
      throw new NotFoundException({
        code: 'DAY_30_REVIEW_NOT_FOUND',
        message: `Day 30 review for product ${productId} was not found.`,
      });
    }

    return updatedRecord;
  }

  private async assertStageFourEditable(productId: string): Promise<void> {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${productId} was not found.`,
      });
    }

    if (product.currentStage !== ProductStage.STAGE_4) {
      throw new ConflictException({
        code: 'STAGE_FOUR_TEMPLATE_LOCKED',
        message: `Stage 4 templates can only be edited while product ${productId} is in Stage 4.`,
      });
    }
  }

  private calculateFlags(input: {
    actualRevenue: string;
    actualSellThroughUnits: number;
    channelGp: Day30ReviewChannelGpRecord[];
    targetRevenue: string;
    targetSellThroughUnits: number;
  }): Day30PerformanceFlag[] {
    const flags = new Set<Day30PerformanceFlag>();
    const unitRatio =
      input.targetSellThroughUnits === 0
        ? 1
        : input.actualSellThroughUnits / input.targetSellThroughUnits;
    const revenueRatio = Number(input.targetRevenue) === 0 ? 1 : Number(input.actualRevenue) / Number(input.targetRevenue);
    const belowTarget = unitRatio < 1 || revenueRatio < 1;
    const significantlyBelow = unitRatio < 0.7 || revenueRatio < 0.7;
    const gpIssue = input.channelGp.some(
      (row) => Number(row.actualGpPercent) < CHANNEL_GP_FLOORS[row.channelType],
    );

    if (!belowTarget && !gpIssue) {
      flags.add(Day30PerformanceFlag.ON_TRACK);
    }

    if (belowTarget) {
      flags.add(Day30PerformanceFlag.BELOW_TARGET);
    }

    if (significantlyBelow) {
      flags.add(Day30PerformanceFlag.SIGNIFICANTLY_BELOW);
    }

    if (gpIssue) {
      flags.add(Day30PerformanceFlag.GP_ISSUE);
      flags.add(Day30PerformanceFlag.HALT_PO_REQUIRED);
    }

    return [...flags];
  }

  private mapChannelGp(rows: CreateDay30ReviewChannelGpDto[]): Day30ReviewChannelGpRecord[] {
    return rows.map((row) => ({
      actualGpPercent: row.actualGpPercent,
      channelType: row.channelType,
      id: randomUUID(),
      notes: row.notes ?? null,
    }));
  }
}
