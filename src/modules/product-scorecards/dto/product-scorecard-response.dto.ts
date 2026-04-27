import type { ProductScorecardClass } from '../../../enums/product-scorecard-class.enum';
import type { ProductScorecardRecord } from '../types/product-scorecard-record.type';

export class ProductScorecardResponseDto {
  classification!: ProductScorecardClass;
  classificationReason!: string;
  complaintCount!: number;
  createdAt!: string;
  grossProfitPercent!: string;
  id!: string;
  isEscalationRequired!: boolean;
  margin!: string;
  marketFeedbackSummary!: string;
  notes!: string | null;
  productId!: string;
  revenue!: string;
  reviewDate!: string;
  sellThroughPercent!: string;
  updatedAt!: string;

  static fromRecord(record: ProductScorecardRecord): ProductScorecardResponseDto {
    return {
      classification: record.classification,
      classificationReason: record.classificationReason,
      complaintCount: record.complaintCount,
      createdAt: record.createdAt.toISOString(),
      grossProfitPercent: record.grossProfitPercent,
      id: record.id,
      isEscalationRequired: record.isEscalationRequired,
      margin: record.margin,
      marketFeedbackSummary: record.marketFeedbackSummary,
      notes: record.notes,
      productId: record.productId,
      revenue: record.revenue,
      reviewDate: record.reviewDate,
      sellThroughPercent: record.sellThroughPercent,
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
