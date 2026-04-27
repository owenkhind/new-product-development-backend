import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { ClearancePlanResponseDto } from '../dto/clearance-plan-response.dto';
import { CreateClearancePlanDto } from '../dto/create-clearance-plan.dto';
import { UpdateClearancePlanDto } from '../dto/update-clearance-plan.dto';
import { ClearancePlansService } from '../services/clearance-plans.service';

@Controller('products/:productId/clearance-plan')
@UseGuards(PoliciesGuard)
export class ClearancePlansController {
  constructor(private readonly clearancePlansService: ClearancePlansService) {}

  @Post()
  @Authorize(PolicyResource.CLEARANCE_PLANS, StageAction.EDIT)
  async create(
    @Param('productId') productId: string,
    @Body() input: CreateClearancePlanDto,
  ): Promise<ClearancePlanResponseDto> {
    const record = await this.clearancePlansService.create(productId, input);
    return ClearancePlanResponseDto.fromRecord(record);
  }

  @Get()
  @Authorize(PolicyResource.CLEARANCE_PLANS, StageAction.VIEW)
  async findOne(@Param('productId') productId: string): Promise<ClearancePlanResponseDto> {
    const record = await this.clearancePlansService.findOne(productId);
    return ClearancePlanResponseDto.fromRecord(record);
  }

  @Patch()
  @Authorize(PolicyResource.CLEARANCE_PLANS, StageAction.EDIT)
  async update(
    @Param('productId') productId: string,
    @Body() input: UpdateClearancePlanDto,
  ): Promise<ClearancePlanResponseDto> {
    const record = await this.clearancePlansService.update(productId, input);
    return ClearancePlanResponseDto.fromRecord(record);
  }
}
