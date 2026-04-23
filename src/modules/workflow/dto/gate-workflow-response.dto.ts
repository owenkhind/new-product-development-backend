import { AuditLogResponseDto } from '../../audit-logs/dto/audit-log-response.dto';
import { GateDecisionResponseDto } from '../../gate-decisions/dto/gate-decision-response.dto';
import { ProductResponseDto } from '../../products/dto/product-response.dto';
import type { AuditLogRecord } from '../../audit-logs/types/audit-log-record.type';
import type { GateDecisionRecord } from '../../gate-decisions/types/gate-decision-record.type';
import type { ProductRecord } from '../../products/types/product-record.type';

export class GateWorkflowResponseDto {
  auditLog!: AuditLogResponseDto;
  gateDecision!: GateDecisionResponseDto;
  product!: ProductResponseDto;

  static fromRecords(input: {
    auditLog: AuditLogRecord;
    gateDecision: GateDecisionRecord;
    product: ProductRecord;
  }): GateWorkflowResponseDto {
    return {
      auditLog: AuditLogResponseDto.fromRecord(input.auditLog),
      gateDecision: GateDecisionResponseDto.fromRecord(input.gateDecision),
      product: ProductResponseDto.fromRecord(input.product),
    };
  }
}
