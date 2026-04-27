import type { GateThreeReviewRecord } from '../types/gate-three-review-record.type';
import type { AuditLogRecord } from '../../audit-logs/types/audit-log-record.type';

export class GateThreeReviewResponseDto {
  auditLog!: AuditLogRecord;
  review!: GateThreeReviewRecord;

  static fromRecords(input: {
    auditLog: AuditLogRecord;
    review: GateThreeReviewRecord;
  }): GateThreeReviewResponseDto {
    return {
      auditLog: input.auditLog,
      review: input.review,
    };
  }
}
