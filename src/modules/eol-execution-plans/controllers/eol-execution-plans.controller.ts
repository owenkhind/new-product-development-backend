import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { CreateEolExecutionPlanDto } from '../dto/create-eol-execution-plan.dto';
import { EolExecutionPlanResponseDto } from '../dto/eol-execution-plan-response.dto';
import { UpdateEolExecutionPlanDto } from '../dto/update-eol-execution-plan.dto';
import { EolExecutionPlansService } from '../services/eol-execution-plans.service';

@Controller('products/:productId/eol-execution-plan')
@UseGuards(PoliciesGuard)
export class EolExecutionPlansController {
  constructor(private readonly eolExecutionPlansService: EolExecutionPlansService) {}

  @Post()
  @Authorize(PolicyResource.EOL_EXECUTION_PLANS, StageAction.EDIT)
  async create(
    @Param('productId') productId: string,
    @Body() input: CreateEolExecutionPlanDto,
  ): Promise<EolExecutionPlanResponseDto> {
    const record = await this.eolExecutionPlansService.create(productId, input);
    return EolExecutionPlanResponseDto.fromRecord(record);
  }

  @Get()
  @Authorize(PolicyResource.EOL_EXECUTION_PLANS, StageAction.VIEW)
  async findOne(@Param('productId') productId: string): Promise<EolExecutionPlanResponseDto> {
    const record = await this.eolExecutionPlansService.findOne(productId);
    return EolExecutionPlanResponseDto.fromRecord(record);
  }

  @Patch()
  @Authorize(PolicyResource.EOL_EXECUTION_PLANS, StageAction.EDIT)
  async update(
    @Param('productId') productId: string,
    @Body() input: UpdateEolExecutionPlanDto,
  ): Promise<EolExecutionPlanResponseDto> {
    const record = await this.eolExecutionPlansService.update(productId, input);
    return EolExecutionPlanResponseDto.fromRecord(record);
  }
}
