import { Controller, Get, UseGuards } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { RulesDashboardResponseDto } from '../dto/rules-dashboard-response.dto';
import { RulesService } from '../services/rules.service';

@Controller('rules')
@UseGuards(PoliciesGuard)
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  @Authorize(PolicyResource.RULES, StageAction.VIEW)
  getDashboard(): RulesDashboardResponseDto {
    return RulesDashboardResponseDto.fromRecord(
      this.rulesService.getDashboard(),
    );
  }
}
