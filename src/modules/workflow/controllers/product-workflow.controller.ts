import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { WorkflowTransitionAction } from '../../../enums/workflow-transition-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { WorkflowTransitionRequestDto } from '../dto/workflow-transition-request.dto';
import { ProductWorkflowResponseDto } from '../dto/product-workflow-response.dto';
import { ProductWorkflowService } from '../services/product-workflow.service';

@Controller('products/:id/workflow')
@UseGuards(PoliciesGuard)
export class ProductWorkflowController {
  constructor(private readonly productWorkflowService: ProductWorkflowService) {}

  @Post('reopen')
  @Authorize(PolicyResource.WORKFLOW, StageAction.REOPEN)
  async reopen(
    @Param('id') id: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<ProductWorkflowResponseDto> {
    const result = await this.productWorkflowService.transition(
      id,
      WorkflowTransitionAction.REOPEN,
      request.user!,
      input,
    );

    return ProductWorkflowResponseDto.fromRecords(result);
  }

  @Post('block')
  @Authorize(PolicyResource.WORKFLOW, StageAction.BLOCK)
  async block(
    @Param('id') id: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<ProductWorkflowResponseDto> {
    const result = await this.productWorkflowService.transition(
      id,
      WorkflowTransitionAction.BLOCK,
      request.user!,
      input,
    );

    return ProductWorkflowResponseDto.fromRecords(result);
  }

  @Post('archive')
  @Authorize(PolicyResource.WORKFLOW, StageAction.ARCHIVE)
  async archive(
    @Param('id') id: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<ProductWorkflowResponseDto> {
    const result = await this.productWorkflowService.transition(
      id,
      WorkflowTransitionAction.ARCHIVE,
      request.user!,
      input,
    );

    return ProductWorkflowResponseDto.fromRecords(result);
  }
}
