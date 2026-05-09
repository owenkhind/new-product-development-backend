import type {
  AuditDashboard,
  AuditDashboardEvent,
  AuditDashboardEventType,
  AuditDashboardMetric,
  AuditDashboardSeverity,
} from '../types/audit-log-record.type';

export class AuditDashboardEventResponseDto {
  actor!: string;
  actorRole!: string;
  details!: string;
  eventType!: AuditDashboardEventType;
  id!: string;
  productName!: string;
  reason?: string;
  severity!: AuditDashboardSeverity;
  timestamp!: string;
  traceId!: string;

  static fromRecord(
    record: AuditDashboardEvent,
  ): AuditDashboardEventResponseDto {
    return {
      actor: record.actor,
      actorRole: record.actorRole,
      details: record.details,
      eventType: record.eventType,
      id: record.id,
      productName: record.productName,
      reason: record.reason,
      severity: record.severity,
      timestamp: record.timestamp,
      traceId: record.traceId,
    };
  }
}

export class AuditDashboardMetricResponseDto {
  label!: string;
  tone!: string;
  value!: number;

  static fromRecord(
    record: AuditDashboardMetric,
  ): AuditDashboardMetricResponseDto {
    return {
      label: record.label,
      tone: record.tone,
      value: record.value,
    };
  }
}

export class AuditDashboardResponseDto {
  events!: AuditDashboardEventResponseDto[];
  latestOverride?: AuditDashboardEventResponseDto;
  metrics!: AuditDashboardMetricResponseDto[];

  static fromRecord(record: AuditDashboard): AuditDashboardResponseDto {
    return {
      events: record.events.map((event) =>
        AuditDashboardEventResponseDto.fromRecord(event),
      ),
      latestOverride: record.latestOverride
        ? AuditDashboardEventResponseDto.fromRecord(record.latestOverride)
        : undefined,
      metrics: record.metrics.map((metric) =>
        AuditDashboardMetricResponseDto.fromRecord(metric),
      ),
    };
  }
}
