import type { ProductScorecardClass } from '../../../enums/product-scorecard-class.enum';

export type ProductScorecardRecord = {
  classification: ProductScorecardClass;
  classificationReason: string;
  complaintCount: number;
  createdAt: Date;
  grossProfitPercent: string;
  id: string;
  isEscalationRequired: boolean;
  margin: string;
  marketFeedbackSummary: string;
  notes: string | null;
  productId: string;
  revenue: string;
  reviewDate: string;
  sellThroughPercent: string;
  updatedAt: Date;
};
