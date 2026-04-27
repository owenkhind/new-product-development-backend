import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { ProductScorecardClass } from '../../../enums/product-scorecard-class.enum';
import { ProductStage } from '../../../enums/product-stage.enum';
import type { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ProductsRepository } from '../../products/repositories/products.repository';
import type { CreateProductScorecardDto } from '../dto/create-product-scorecard.dto';
import type { UpdateProductScorecardDto } from '../dto/update-product-scorecard.dto';
import { ProductScorecardsRepository } from '../repositories/product-scorecards.repository';
import type { ProductScorecardRecord } from '../types/product-scorecard-record.type';

type ScorecardMetrics = {
  complaintCount: number;
  grossProfitPercent: string;
  sellThroughPercent: string;
};

@Injectable()
export class ProductScorecardsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly productScorecardsRepository: ProductScorecardsRepository,
  ) {}

  async create(productId: string, input: CreateProductScorecardDto): Promise<ProductScorecardRecord> {
    await this.assertStageFiveEditable(productId);

    const classificationResult = ProductScorecardsService.classify(input);
    const existingScorecards = await this.productScorecardsRepository.listLatestByProductId(productId, 1);

    return this.productScorecardsRepository.create({
      classification: classificationResult.classification,
      classificationReason: classificationResult.reason,
      complaintCount: input.complaintCount,
      grossProfitPercent: input.grossProfitPercent,
      id: randomUUID(),
      isEscalationRequired: this.requiresEscalation(classificationResult.classification, existingScorecards),
      margin: input.margin,
      marketFeedbackSummary: input.marketFeedbackSummary,
      notes: input.notes ?? null,
      productId,
      revenue: input.revenue,
      reviewDate: input.reviewDate,
      sellThroughPercent: input.sellThroughPercent,
    });
  }

  async list(
    productId: string,
    query: PaginationQueryDto,
  ): Promise<{ rows: ProductScorecardRecord[]; total: number }> {
    await this.assertProductExists(productId);
    return this.productScorecardsRepository.listByProductId({
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
      productId,
    });
  }

  async findOne(productId: string, scorecardId: string): Promise<ProductScorecardRecord> {
    const record = await this.productScorecardsRepository.findById(productId, scorecardId);

    if (!record) {
      throw new NotFoundException({
        code: 'PRODUCT_SCORECARD_NOT_FOUND',
        message: `Product scorecard ${scorecardId} for product ${productId} was not found.`,
      });
    }

    return record;
  }

  async update(
    productId: string,
    scorecardId: string,
    input: UpdateProductScorecardDto,
  ): Promise<ProductScorecardRecord> {
    await this.assertStageFiveEditable(productId);

    const existingRecord = await this.productScorecardsRepository.findById(productId, scorecardId);

    if (!existingRecord) {
      throw new NotFoundException({
        code: 'PRODUCT_SCORECARD_NOT_FOUND',
        message: `Product scorecard ${scorecardId} for product ${productId} was not found.`,
      });
    }

    const mergedInput = {
      complaintCount: input.complaintCount ?? existingRecord.complaintCount,
      grossProfitPercent: input.grossProfitPercent ?? existingRecord.grossProfitPercent,
      sellThroughPercent: input.sellThroughPercent ?? existingRecord.sellThroughPercent,
    };
    const classificationResult = ProductScorecardsService.classify(mergedInput);
    const existingScorecards = await this.productScorecardsRepository.listLatestByProductId(productId, 2);

    const updatedRecord = await this.productScorecardsRepository.update(productId, scorecardId, {
      classification: classificationResult.classification,
      classificationReason: classificationResult.reason,
      complaintCount: input.complaintCount,
      grossProfitPercent: input.grossProfitPercent,
      isEscalationRequired: this.requiresEscalation(
        classificationResult.classification,
        existingScorecards.filter((scorecard) => scorecard.id !== scorecardId),
      ),
      margin: input.margin,
      marketFeedbackSummary: input.marketFeedbackSummary,
      notes: input.notes,
      revenue: input.revenue,
      reviewDate: input.reviewDate,
      sellThroughPercent: input.sellThroughPercent,
    });

    if (!updatedRecord) {
      throw new NotFoundException({
        code: 'PRODUCT_SCORECARD_NOT_FOUND',
        message: `Product scorecard ${scorecardId} for product ${productId} was not found.`,
      });
    }

    return updatedRecord;
  }

  static classify(metrics: ScorecardMetrics): { classification: ProductScorecardClass; reason: string } {
    const sellThroughPercent = Number(metrics.sellThroughPercent);
    const grossProfitPercent = Number(metrics.grossProfitPercent);

    if (sellThroughPercent >= 80 && grossProfitPercent >= 25 && metrics.complaintCount <= 5) {
      return {
        classification: ProductScorecardClass.A,
        reason: 'Sell-through is at least 80%, GP is at least 25%, and complaints are low.',
      };
    }

    if (sellThroughPercent < 60 || grossProfitPercent < 18 || metrics.complaintCount >= 20) {
      return {
        classification: ProductScorecardClass.C,
        reason: 'Sell-through is below 60%, GP is below 18%, or complaints are at least 20.',
      };
    }

    return {
      classification: ProductScorecardClass.B,
      reason: 'Performance is between A-class and C-class thresholds.',
    };
  }

  private requiresEscalation(
    classification: ProductScorecardClass,
    existingScorecards: ProductScorecardRecord[],
  ): boolean {
    if (classification !== ProductScorecardClass.C) {
      return false;
    }

    const latestScorecard = existingScorecards[0];
    return latestScorecard?.classification === ProductScorecardClass.C;
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
        message: `Stage 5 scorecards can only be edited while product ${productId} is in Stage 5.`,
      });
    }
  }
}
