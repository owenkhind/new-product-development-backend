import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { WorkflowTransitionAction } from '../../../enums/workflow-transition-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { WorkflowTransitionRequestDto } from '../dto/workflow-transition-request.dto';
import { WorkflowTransitionResponseDto } from '../dto/workflow-transition-response.dto';
import { ProductWorkflowService } from '../services/product-workflow.service';

@Controller('products/:id/workflow')
@UseGuards(PoliciesGuard)
export class ProductWorkflowController {
  constructor(private readonly productWorkflowService: ProductWorkflowService) {}

  @Post('submit')
  @Authorize(PolicyResource.WORKFLOW, StageAction.SUBMIT)
  async submit(
    @Param('id') id: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<WorkflowTransitionResponseDto> {
    const result = await this.productWorkflowService.transition(
      id,
      WorkflowTransitionAction.SUBMIT,
      request.user!,
      input,
    );

    return WorkflowTransitionResponseDto.fromRecords(result);
  }

  @Post('approve')
  @Authorize(PolicyResource.WORKFLOW, StageAction.APPROVE)
  async approve(
    @Param('id') id: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<WorkflowTransitionResponseDto> {
    const result = await this.productWorkflowService.transition(
      id,
      WorkflowTransitionAction.APPROVE,
      request.user!,
      input,
    );

    return WorkflowTransitionResponseDto.fromRecords(result);
  }

  @Post('reject')
  @Authorize(PolicyResource.WORKFLOW, StageAction.REJECT)
  async reject(
    @Param('id') id: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<WorkflowTransitionResponseDto> {
    const result = await this.productWorkflowService.transition(
      id,
      WorkflowTransitionAction.REJECT,
      request.user!,
      input,
    );

    return WorkflowTransitionResponseDto.fromRecords(result);
  }

  @Post('reopen')
  @Authorize(PolicyResource.WORKFLOW, StageAction.REOPEN)
  async reopen(
    @Param('id') id: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<WorkflowTransitionResponseDto> {
    const result = await this.productWorkflowService.transition(
      id,
      WorkflowTransitionAction.REOPEN,
      request.user!,
      input,
    );

    return WorkflowTransitionResponseDto.fromRecords(result);
  }

  @Post('block')
  @Authorize(PolicyResource.WORKFLOW, StageAction.BLOCK)
  async block(
    @Param('id') id: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<WorkflowTransitionResponseDto> {
    const result = await this.productWorkflowService.transition(
      id,
      WorkflowTransitionAction.BLOCK,
      request.user!,
      input,
    );

    return WorkflowTransitionResponseDto.fromRecords(result);
  }

  @Post('archive')
  @Authorize(PolicyResource.WORKFLOW, StageAction.ARCHIVE)
  async archive(
    @Param('id') id: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<WorkflowTransitionResponseDto> {
    const result = await this.productWorkflowService.transition(
      id,
      WorkflowTransitionAction.ARCHIVE,
      request.user!,
      input,
    );

    return WorkflowTransitionResponseDto.fromRecords(result);
  }
}
