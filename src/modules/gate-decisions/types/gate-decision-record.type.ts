import type { ProductStage } from '../../../enums/product-stage.enum';
import type { WorkflowTransitionAction } from '../../../enums/workflow-transition-action.enum';

export type GateDecisionRecord = {
  actingAsUserId: string | null;
  actorUserId: string;
  comment: string | null;
  createdAt: Date;
  gateStage: ProductStage;
  id: string;
  isAdminSupportAction: boolean;
  outcome: WorkflowTransitionAction;
  overrideReason: string | null;
  productId: string;
};
