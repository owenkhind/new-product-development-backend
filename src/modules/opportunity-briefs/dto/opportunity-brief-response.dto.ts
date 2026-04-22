import type { OpportunityBriefRecord } from '../types/opportunity-brief-record.type';

export class OpportunityBriefResponseDto {
  affordableCostScore!: number;
  affordablePriceScore!: number;
  affordableValueScore!: number;
  artTotalScore!: number;
  complianceNotes!: string | null;
  createdAt!: Date;
  id!: string;
  opportunitySource!: string;
  problemStatement!: string;
  productId!: string;
  reliableComplianceScore!: number;
  reliableDurabilityScore!: number;
  reliableServiceScore!: number;
  requiredDocumentsComplete!: boolean;
  targetCustomer!: string;
  targetMarket!: string;
  trendyCategoryScore!: number;
  trendyColourScore!: number;
  trendyDesignScore!: number;
  uniqueSellingPoints!: string[];
  updatedAt!: Date;

  static fromRecord(record: OpportunityBriefRecord): OpportunityBriefResponseDto {
    return {
      affordableCostScore: record.affordableCostScore,
      affordablePriceScore: record.affordablePriceScore,
      affordableValueScore: record.affordableValueScore,
      artTotalScore: record.artTotalScore,
      complianceNotes: record.complianceNotes,
      createdAt: record.createdAt,
      id: record.id,
      opportunitySource: record.opportunitySource,
      problemStatement: record.problemStatement,
      productId: record.productId,
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
      updatedAt: record.updatedAt,
    };
  }
}
