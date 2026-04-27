import type { RevampEolDecision } from '../../../enums/revamp-eol-decision.enum';
import type { RevampEolRecommendationOutcome } from '../../../enums/revamp-eol-recommendation-outcome.enum';

export type RevampEolRecommendationRecord = {
  cooDecision: RevampEolDecision | null;
  cooDecisionAt: Date | null;
  cooDecisionByUserId: string | null;
  cooDecisionComment: string | null;
  createdAt: Date;
  eolOption: string | null;
  gmCommercialInput: string | null;
  gmInputAt: Date | null;
  gmInputByUserId: string | null;
  holdOption: string | null;
  id: string;
  productId: string;
  recommendationOutcome: RevampEolRecommendationOutcome;
  recommendationSummary: string;
  revampOption: string | null;
  rootCauseAnalysis: string;
  triggerReasons: string[];
  updatedAt: Date;
};
