import type { AuditEntityType } from '../../../enums/audit-entity-type.enum';
import type { WorkflowTransitionAction } from '../../../enums/workflow-transition-action.enum';

export type AuditLogRecord = {
  actingAsUserId: string | null;
  action: WorkflowTransitionAction;
  actorUserId: string;
  createdAt: Date;
  entityId: string;
  entityType: AuditEntityType;
  fromState: Record<string, unknown> | null;
  id: string;
  metadata: Record<string, unknown>;
  productId: string | null;
  toState: Record<string, unknown> | null;
};
