import { Injectable } from '@nestjs/common';

import type { ListAuditLogsQueryDto } from '../dto/list-audit-logs-query.dto';
import { AuditLogsRepository } from '../repositories/audit-logs.repository';
import type { AuditLogRecord } from '../types/audit-log-record.type';

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
}
