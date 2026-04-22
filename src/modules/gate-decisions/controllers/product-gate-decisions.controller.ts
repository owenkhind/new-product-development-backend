import { Controller, Get, Param, UseGuards } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import type { ListGateDecisionsResponseDto } from '../dto/list-gate-decisions-response.dto';
import { GateDecisionResponseDto } from '../dto/gate-decision-response.dto';
import { GateDecisionsService } from '../services/gate-decisions.service';

@Controller('products/:productId/gate-decisions')
@UseGuards(PoliciesGuard)
export class ProductGateDecisionsController {
  constructor(private readonly gateDecisionsService: GateDecisionsService) {}

  @Get()
  @Authorize(PolicyResource.GATE_DECISIONS, StageAction.VIEW)
  async findAll(@Param('productId') productId: string): Promise<ListGateDecisionsResponseDto> {
    const gateDecisions = await this.gateDecisionsService.findByProductId(productId);

    return {
      data: gateDecisions.map((gateDecision) => GateDecisionResponseDto.fromRecord(gateDecision)),
    };
  }
}
