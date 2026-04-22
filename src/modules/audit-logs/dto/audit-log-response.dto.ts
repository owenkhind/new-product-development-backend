import type { AuditLogRecord } from '../types/audit-log-record.type';

export class AuditLogResponseDto {
  actingAsUserId!: string | null;
  action!: string;
  actorUserId!: string;
  createdAt!: Date;
  entityId!: string;
  entityType!: string;
  fromState!: Record<string, unknown> | null;
  id!: string;
  metadata!: Record<string, unknown>;
  productId!: string | null;
  toState!: Record<string, unknown> | null;

  static fromRecord(record: AuditLogRecord): AuditLogResponseDto {
    return {
      actingAsUserId: record.actingAsUserId,
      action: record.action,
      actorUserId: record.actorUserId,
      createdAt: record.createdAt,
      entityId: record.entityId,
      entityType: record.entityType,
      fromState: record.fromState,
      id: record.id,
      metadata: record.metadata,
      productId: record.productId,
      toState: record.toState,
    };
  }
}
