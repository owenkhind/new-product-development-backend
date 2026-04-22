import type { AuditLogResponseDto } from './audit-log-response.dto';

export type ListAuditLogsResponseDto = {
  data: AuditLogResponseDto[];
  meta: {
    limit: number;
    page: number;
    total: number;
  };
};
