import { Injectable } from '@nestjs/common';

import { AuditAction } from '../../../enums/audit-action.enum';
import type { AuthenticatedUser } from '../../../types/authenticated-user.type';
import type { ListAuditLogsQueryDto } from '../dto/list-audit-logs-query.dto';
import { AuditLogsRepository } from '../repositories/audit-logs.repository';
import type {
  AuditDashboard,
  AuditDashboardEvent,
  AuditDashboardEventType,
  AuditDashboardRecord,
  AuditDashboardSeverity,
  AuditLogRecord,
} from '../types/audit-log-record.type';

@Injectable()
export class AuditLogsService {
  constructor(private readonly auditLogsRepository: AuditLogsRepository) {}

  async findByProductId(
    productId: string,
    query: ListAuditLogsQueryDto,
  ): Promise<{ rows: AuditLogRecord[]; total: number }> {
    const limit = Math.min(query.limit, 100);
    const offset = (query.page - 1) * limit;

    return this.auditLogsRepository.listByProductId({
      limit,
      offset,
      productId,
    });
  }

  async getDashboard(
    query: ListAuditLogsQueryDto,
    actor: AuthenticatedUser,
  ): Promise<AuditDashboard> {
    const limit = Math.min(query.limit, 100);
    const offset = (query.page - 1) * limit;
    const result = await this.auditLogsRepository.listDashboard({
      actorId: actor.id,
      actorRole: actor.role,
      limit,
      offset,
    });
    const events = result.rows.map((record) => this.mapDashboardEvent(record));
    const latestOverride = events.find(
      (event) => event.eventType === 'ADMIN_OVERRIDE',
    );

    return {
      events,
      latestOverride,
      metrics: [
        { label: 'Audit events', tone: 'blue', value: result.total },
        {
          label: 'Approval decisions',
          tone: 'green',
          value: events.filter(
            (event) => event.eventType === 'APPROVAL_DECISION',
          ).length,
        },
        {
          label: 'Admin overrides',
          tone: 'red',
          value: events.filter((event) => event.eventType === 'ADMIN_OVERRIDE')
            .length,
        },
        {
          label: 'Workflow blockers',
          tone: 'amber',
          value: events.filter(
            (event) => event.eventType === 'WORKFLOW_BLOCKER',
          ).length,
        },
      ],
    };
  }

  private mapDashboardEvent(record: AuditDashboardRecord): AuditDashboardEvent {
    return {
      actor: record.actorName ?? record.actorUserId,
      actorRole: record.actorRole ?? 'Backend user',
      details: this.buildDetails(record),
      eventType: this.getEventType(record),
      id: record.id,
      productName: record.productName ?? record.productId ?? 'System event',
      reason: this.getReason(record),
      severity: this.getSeverity(record),
      timestamp: record.createdAt.toISOString(),
      traceId: record.entityId,
    };
  }

  private buildDetails(record: AuditDashboardRecord): string {
    const action = this.formatEnumValue(record.action);
    const entity = this.formatEnumValue(record.entityType);
    const comment = this.getMetadataText(record.metadata, 'comment');

    return comment
      ? `${action} on ${entity}: ${comment}`
      : `${action} on ${entity}`;
  }

  private getEventType(record: AuditDashboardRecord): AuditDashboardEventType {
    if (record.actingAsUserId || this.getReason(record)) {
      return 'ADMIN_OVERRIDE';
    }

    if (record.action === AuditAction.BLOCK) {
      return 'WORKFLOW_BLOCKER';
    }

    if (
      [
        AuditAction.APPROVE,
        AuditAction.REJECT,
        AuditAction.KILL,
        AuditAction.QA_REVIEW_COMPLETED,
        AuditAction.FINANCE_CONFIRMED,
        AuditAction.GM_APPROVED,
        AuditAction.MARKETING_REVIEW_COMPLETED,
        AuditAction.GM_COMMERCIAL_INPUT_RECORDED,
        AuditAction.COO_RECOMMENDATION_DECIDED,
      ].includes(record.action)
    ) {
      return 'APPROVAL_DECISION';
    }

    return 'STAGE_TRANSITION';
  }

  private getSeverity(record: AuditDashboardRecord): AuditDashboardSeverity {
    if (
      record.actingAsUserId ||
      this.getReason(record) ||
      [AuditAction.BLOCK, AuditAction.REJECT, AuditAction.KILL].includes(
        record.action,
      )
    ) {
      return 'WARNING';
    }

    if ([AuditAction.APPROVE, AuditAction.SUBMIT].includes(record.action)) {
      return 'NOTICE';
    }

    return 'INFO';
  }

  private getReason(record: AuditDashboardRecord): string | undefined {
    return this.getMetadataText(record.metadata, 'overrideReason');
  }

  private getMetadataText(
    metadata: Record<string, unknown>,
    key: string,
  ): string | undefined {
    const value = metadata[key];

    return typeof value === 'string' && value.trim() ? value : undefined;
  }

  private formatEnumValue(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
