import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { CreateGtmPlanDto } from '../dto/create-gtm-plan.dto';
import { GtmPlanResponseDto } from '../dto/gtm-plan-response.dto';
import { UpdateGtmPlanDto } from '../dto/update-gtm-plan.dto';
import { GtmPlansService } from '../services/gtm-plans.service';

@Controller('products/:productId/gtm-plan')
@UseGuards(PoliciesGuard)
export class GtmPlansController {
  constructor(private readonly gtmPlansService: GtmPlansService) {}

  @Post()
  @Authorize(PolicyResource.PRODUCTS, StageAction.EDIT)
  async create(
    @Param('productId') productId: string,
    @Body() input: CreateGtmPlanDto,
  ): Promise<GtmPlanResponseDto> {
    const record = await this.gtmPlansService.create(productId, input);
    return GtmPlanResponseDto.fromRecord(record);
  }

  @Get()
  @Authorize(PolicyResource.PRODUCTS, StageAction.VIEW)
  async findOne(@Param('productId') productId: string): Promise<GtmPlanResponseDto> {
    const record = await this.gtmPlansService.findOne(productId);
    return GtmPlanResponseDto.fromRecord(record);
  }

  @Patch()
  @Authorize(PolicyResource.PRODUCTS, StageAction.EDIT)
  async update(
    @Param('productId') productId: string,
    @Body() input: UpdateGtmPlanDto,
  ): Promise<GtmPlanResponseDto> {
    const record = await this.gtmPlansService.update(productId, input);
    return GtmPlanResponseDto.fromRecord(record);
  }
}
