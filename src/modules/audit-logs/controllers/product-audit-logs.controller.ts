import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { AuditLogResponseDto } from '../dto/audit-log-response.dto';
import { ListAuditLogsQueryDto } from '../dto/list-audit-logs-query.dto';
import type { ListAuditLogsResponseDto } from '../dto/list-audit-logs-response.dto';
import { AuditLogsService } from '../services/audit-logs.service';

@Controller('products/:productId/audit-logs')
@UseGuards(PoliciesGuard)
export class ProductAuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Authorize(PolicyResource.AUDIT_LOGS, StageAction.VIEW)
  async findAll(
    @Param('productId') productId: string,
    @Query() query: ListAuditLogsQueryDto,
  ): Promise<ListAuditLogsResponseDto> {
    const result = await this.auditLogsService.findByProductId(productId, query);

    return {
      data: result.rows.map((auditLog) => AuditLogResponseDto.fromRecord(auditLog)),
      meta: {
        limit: Math.min(query.limit, 100),
        page: query.page,
        total: result.total,
      },
    };
  }
}
