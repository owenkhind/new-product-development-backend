import { AuditLogResponseDto } from '../../audit-logs/dto/audit-log-response.dto';
import type { AuditLogRecord } from '../../audit-logs/types/audit-log-record.type';
import type { GateTwoReviewRecord } from '../types/gate-two-review-record.type';

class GateTwoReviewStateDto {
  createdAt!: Date;
  financeComment!: string | null;
  financeConfirmedAt!: Date | null;
  financeConfirmedByUserId!: string | null;
  gmApprovedAt!: Date | null;
  gmApprovedByUserId!: string | null;
  gmComment!: string | null;
  productId!: string;
  qaComment!: string | null;
  qaReviewCompletedAt!: Date | null;
  qaReviewedByUserId!: string | null;
  updatedAt!: Date;

  static fromRecord(record: GateTwoReviewRecord): GateTwoReviewStateDto {
    return {
      createdAt: record.createdAt,
      financeComment: record.financeComment,
      financeConfirmedAt: record.financeConfirmedAt,
      financeConfirmedByUserId: record.financeConfirmedByUserId,
      gmApprovedAt: record.gmApprovedAt,
      gmApprovedByUserId: record.gmApprovedByUserId,
      gmComment: record.gmComment,
      productId: record.productId,
      qaComment: record.qaComment,
      qaReviewCompletedAt: record.qaReviewCompletedAt,
      qaReviewedByUserId: record.qaReviewedByUserId,
      updatedAt: record.updatedAt,
    };
  }
}

export class GateTwoReviewResponseDto {
  auditLog!: AuditLogResponseDto;
  review!: GateTwoReviewStateDto;

  static fromRecords(input: {
    auditLog: AuditLogRecord;
    review: GateTwoReviewRecord;
  }): GateTwoReviewResponseDto {
    return {
      auditLog: AuditLogResponseDto.fromRecord(input.auditLog),
      review: GateTwoReviewStateDto.fromRecord(input.review),
    };
  }
}
