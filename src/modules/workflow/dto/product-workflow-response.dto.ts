import { AuditLogResponseDto } from '../../audit-logs/dto/audit-log-response.dto';
import { ProductResponseDto } from '../../products/dto/product-response.dto';
import type { AuditLogRecord } from '../../audit-logs/types/audit-log-record.type';
import type { ProductRecord } from '../../products/types/product-record.type';

export class ProductWorkflowResponseDto {
  auditLog!: AuditLogResponseDto;
  product!: ProductResponseDto;

  static fromRecords(input: {
    auditLog: AuditLogRecord;
    product: ProductRecord;
  }): ProductWorkflowResponseDto {
    return {
      auditLog: AuditLogResponseDto.fromRecord(input.auditLog),
      product: ProductResponseDto.fromRecord(input.product),
    };
  }
}
