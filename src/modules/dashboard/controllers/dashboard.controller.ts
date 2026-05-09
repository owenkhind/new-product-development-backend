import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { DashboardResponseDto } from '../dto/dashboard-response.dto';
import { DashboardService } from '../services/dashboard.service';

@Controller('dashboard')
@UseGuards(PoliciesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Authorize(PolicyResource.PRODUCTS, StageAction.VIEW)
  async getDashboard(@Req() request: Request): Promise<DashboardResponseDto> {
    return DashboardResponseDto.fromRecord(
      await this.dashboardService.getDashboard(request.user!),
    );
  }
}
