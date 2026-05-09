import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { AuditDashboardResponseDto } from '../dto/audit-dashboard-response.dto';
import { ListAuditLogsQueryDto } from '../dto/list-audit-logs-query.dto';
import { AuditLogsService } from '../services/audit-logs.service';

@Controller('audit-logs')
@UseGuards(PoliciesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @Authorize(PolicyResource.AUDIT_LOGS, StageAction.VIEW)
  async getDashboard(
    @Query() query: ListAuditLogsQueryDto,
    @Req() request: Request,
  ): Promise<AuditDashboardResponseDto> {
    return AuditDashboardResponseDto.fromRecord(
      await this.auditLogsService.getDashboard(query, request.user!),
    );
  }
}
