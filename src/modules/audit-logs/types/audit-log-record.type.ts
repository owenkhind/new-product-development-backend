import type { AuditEntityType } from '../../../enums/audit-entity-type.enum';
import type { AuditAction } from '../../../enums/audit-action.enum';

export type AuditLogRecord = {
  actingAsUserId: string | null;
  action: AuditAction;
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

export type AuditDashboardEventType =
  | 'ADMIN_OVERRIDE'
  | 'APPROVAL_DECISION'
  | 'ASSIGNMENT_CHANGE'
  | 'STAGE_TRANSITION'
  | 'TEMPLATE_SUBMISSION'
  | 'WORKFLOW_BLOCKER';

export type AuditDashboardSeverity = 'INFO' | 'NOTICE' | 'WARNING';

export type AuditDashboardEvent = {
  actor: string;
  actorRole: string;
  details: string;
  eventType: AuditDashboardEventType;
  id: string;
  productName: string;
  reason?: string;
  severity: AuditDashboardSeverity;
  timestamp: string;
  traceId: string;
};

export type AuditDashboardMetric = {
  label: string;
  tone: 'amber' | 'blue' | 'green' | 'red';
  value: number;
};

export type AuditDashboard = {
  events: AuditDashboardEvent[];
  latestOverride?: AuditDashboardEvent;
  metrics: AuditDashboardMetric[];
};

export type AuditDashboardRecord = AuditLogRecord & {
  actorName: string | null;
  actorRole: string | null;
  productName: string | null;
};
