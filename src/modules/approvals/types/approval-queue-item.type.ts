import type { ProductStage } from '../../../enums/product-stage.enum';
import type { ProductStatus } from '../../../enums/product-status.enum';
import type { UserRole } from '../../../enums/user-role.enum';

export type ApprovalQueueStatus =
  | 'APPROVED'
  | 'OVERDUE'
  | 'PENDING'
  | 'REJECTED';
export type ApprovalQueueUrgency = 'DUE_TODAY' | 'OVERDUE' | 'UPCOMING';

export type ApprovalQueueItem = {
  assignedApprover: string;
  assignedRole: UserRole;
  blockers: string[];
  category: string;
  dueDate: string;
  gateLabel: string;
  id: string;
  lastActivity: string;
  owner: string;
  priorDecisionSummary: string;
  productId: string;
  productName: string;
  productStage: ProductStage;
  productStatus: ProductStatus;
  readinessScore: number;
  requestedBy: string;
  stageLabel: string;
  status: ApprovalQueueStatus;
  urgency: ApprovalQueueUrgency;
};

export type ApprovalQueueSummary = {
  assignedApprovals: number;
  averageReadiness: number;
  overdueDecisions: number;
  supportOverridesOpen: number;
};

export type ApprovalQueueResult = {
  items: ApprovalQueueItem[];
  summary: ApprovalQueueSummary;
};
