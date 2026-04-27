import type { RevampEolDecision } from '../../../enums/revamp-eol-decision.enum';
import type { RevampEolRecommendationOutcome } from '../../../enums/revamp-eol-recommendation-outcome.enum';
import type { RevampEolRecommendationRecord } from '../types/revamp-eol-recommendation-record.type';

export class RevampEolRecommendationResponseDto {
  cooDecision!: RevampEolDecision | null;
  cooDecisionAt!: string | null;
  cooDecisionByUserId!: string | null;
  cooDecisionComment!: string | null;
  createdAt!: string;
  eolOption!: string | null;
  gmCommercialInput!: string | null;
  gmInputAt!: string | null;
  gmInputByUserId!: string | null;
  holdOption!: string | null;
  id!: string;
  productId!: string;
  recommendationOutcome!: RevampEolRecommendationOutcome;
  recommendationSummary!: string;
  revampOption!: string | null;
  rootCauseAnalysis!: string;
  triggerReasons!: string[];
  updatedAt!: string;

  static fromRecord(record: RevampEolRecommendationRecord): RevampEolRecommendationResponseDto {
    return {
      cooDecision: record.cooDecision,
      cooDecisionAt: record.cooDecisionAt?.toISOString() ?? null,
      cooDecisionByUserId: record.cooDecisionByUserId,
      cooDecisionComment: record.cooDecisionComment,
      createdAt: record.createdAt.toISOString(),
      eolOption: record.eolOption,
      gmCommercialInput: record.gmCommercialInput,
      gmInputAt: record.gmInputAt?.toISOString() ?? null,
      gmInputByUserId: record.gmInputByUserId,
      holdOption: record.holdOption,
      id: record.id,
      productId: record.productId,
      recommendationOutcome: record.recommendationOutcome,
      recommendationSummary: record.recommendationSummary,
      revampOption: record.revampOption,
      rootCauseAnalysis: record.rootCauseAnalysis,
      triggerReasons: record.triggerReasons,
      updatedAt: record.updatedAt.toISOString(),
    };
  }
}
