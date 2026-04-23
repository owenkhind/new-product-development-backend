import type { ProductStage } from '../../../enums/product-stage.enum';
import type { GateDecisionOutcome } from '../../../enums/gate-decision-outcome.enum';

export type GateDecisionRecord = {
  actingAsUserId: string | null;
  actorUserId: string;
  comment: string | null;
  createdAt: Date;
  gateStage: ProductStage;
  id: string;
  isAdminSupportAction: boolean;
  outcome: GateDecisionOutcome;
  overrideReason: string | null;
  productId: string;
};
