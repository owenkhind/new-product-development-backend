import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { FeedbackSeverity } from '../../../enums/feedback-severity.enum';
import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductsRepository } from '../../products/repositories/products.repository';
import type {
  CreateWeeklyFeedbackItemDto,
  CreateWeeklyFeedbackLogDto,
} from '../dto/create-weekly-feedback-log.dto';
import type { UpdateWeeklyFeedbackLogDto } from '../dto/update-weekly-feedback-log.dto';
import { WeeklyFeedbackLogsRepository } from '../repositories/weekly-feedback-logs.repository';
import type { WeeklyFeedbackItemRecord, WeeklyFeedbackLogRecord } from '../types/weekly-feedback-log-record.type';

@Injectable()
export class WeeklyFeedbackLogsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly weeklyFeedbackLogsRepository: WeeklyFeedbackLogsRepository,
  ) {}

  async create(productId: string, input: CreateWeeklyFeedbackLogDto): Promise<WeeklyFeedbackLogRecord> {
    await this.assertStageFourEditable(productId);

    return this.weeklyFeedbackLogsRepository.create({
      id: randomUUID(),
      items: this.mapItems(input.items),
      productId,
      summary: input.summary,
      weekStartDate: input.weekStartDate,
    });
  }

  async list(productId: string): Promise<WeeklyFeedbackLogRecord[]> {
    await this.assertProductExists(productId);
    return this.weeklyFeedbackLogsRepository.listByProductId(productId);
  }

  async findOne(productId: string, logId: string): Promise<WeeklyFeedbackLogRecord> {
    const record = await this.weeklyFeedbackLogsRepository.findById(productId, logId);

    if (!record) {
      throw new NotFoundException({
        code: 'WEEKLY_FEEDBACK_LOG_NOT_FOUND',
        message: `Weekly feedback log ${logId} for product ${productId} was not found.`,
      });
    }

    return record;
  }

  async update(
    productId: string,
    logId: string,
    input: UpdateWeeklyFeedbackLogDto,
  ): Promise<WeeklyFeedbackLogRecord> {
    await this.assertStageFourEditable(productId);

    const existingRecord = await this.weeklyFeedbackLogsRepository.findById(productId, logId);

    if (!existingRecord) {
      throw new NotFoundException({
        code: 'WEEKLY_FEEDBACK_LOG_NOT_FOUND',
        message: `Weekly feedback log ${logId} for product ${productId} was not found.`,
      });
    }

    const updatedRecord = await this.weeklyFeedbackLogsRepository.update(productId, logId, {
      items: input.items ? this.mapItems(input.items) : undefined,
      summary: input.summary,
      weekStartDate: input.weekStartDate,
    });

    if (!updatedRecord) {
      throw new NotFoundException({
        code: 'WEEKLY_FEEDBACK_LOG_NOT_FOUND',
        message: `Weekly feedback log ${logId} for product ${productId} was not found.`,
      });
    }

    return updatedRecord;
  }

  static getUnresolvedCriticalItems(record: WeeklyFeedbackLogRecord): WeeklyFeedbackItemRecord[] {
    return record.items.filter(
      (item) => item.severity === FeedbackSeverity.CRITICAL && !item.isResolved,
    );
  }

  private async assertProductExists(productId: string): Promise<void> {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${productId} was not found.`,
      });
    }
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
      throw new BadRequestException({
        code: 'STAGE_FOUR_TEMPLATE_LOCKED',
        message: `Stage 4 logs can only be edited while product ${productId} is in Stage 4.`,
      });
    }
  }

  private mapItems(items: CreateWeeklyFeedbackItemDto[]): WeeklyFeedbackItemRecord[] {
    return items.map((item) => ({
      actionOwner: item.actionOwner ?? null,
      feedback: item.feedback,
      id: randomUUID(),
      isResolved: item.isResolved,
      notes: item.notes ?? null,
      severity: item.severity,
      source: item.source,
    }));
  }
}
