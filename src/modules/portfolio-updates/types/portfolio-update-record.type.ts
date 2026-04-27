import type { PortfolioReviewStatus } from '../../../enums/portfolio-review-status.enum';
import type { ProductScorecardClass } from '../../../enums/product-scorecard-class.enum';

export type PortfolioUpdateRowRecord = {
  actionRecommendation: string;
  classification: ProductScorecardClass;
  notes: string | null;
  productId: string;
  scorecardId: string | null;
};

export type PortfolioUpdateRecord = {
  cooReviewStatus: PortfolioReviewStatus;
  createdAt: Date;
  id: string;
  reviewQuarter: string;
  rows: PortfolioUpdateRowRecord[];
  summary: string;
  updatedAt: Date;
};
