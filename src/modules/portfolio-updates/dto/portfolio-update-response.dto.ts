import type { PortfolioReviewStatus } from '../../../enums/portfolio-review-status.enum';
import type { PortfolioUpdateRowRecord, PortfolioUpdateRecord } from '../types/portfolio-update-record.type';

export class PortfolioUpdateResponseDto {
  cooReviewStatus!: PortfolioReviewStatus;
  createdAt!: string;
  id!: string;
  reviewQuarter!: string;
  rows!: PortfolioUpdateRowRecord[];
  summary!: string;
  updatedAt!: string;

  static fromRecord(record: PortfolioUpdateRecord): PortfolioUpdateResponseDto {
    return {
      cooReviewStatus: record.cooReviewStatus,
      createdAt: record.createdAt.toISOString(),
      id: record.id,
      reviewQuarter: record.reviewQuarter,
      rows: record.rows,
      summary: record.summary,
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
