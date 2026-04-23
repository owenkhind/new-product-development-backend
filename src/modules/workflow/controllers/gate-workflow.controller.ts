import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { WorkflowTransitionRequestDto } from '../dto/workflow-transition-request.dto';
import { GateTwoReviewResponseDto } from '../dto/gate-two-review-response.dto';
import { GateWorkflowResponseDto } from '../dto/gate-workflow-response.dto';
import { GateTwoReviewsService } from '../services/gate-two-reviews.service';
import { GateWorkflowService } from '../services/gate-workflow.service';

@Controller('products/:productId/gates')
@UseGuards(PoliciesGuard)
export class GateWorkflowController {
  constructor(
    private readonly gateWorkflowService: GateWorkflowService,
    private readonly gateTwoReviewsService: GateTwoReviewsService,
  ) {}

  @Post('gate-1/submit')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.SUBMIT)
  async submitGateOne(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(productId, 'SUBMIT', request.user!, input);
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-1/approve')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.APPROVE)
  async approveGateOne(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(productId, 'APPROVE', request.user!, input);
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-1/reject')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.REJECT)
  async rejectGateOne(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(productId, 'REJECT', request.user!, input);
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-1/kill')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.KILL)
  async killGateOne(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(productId, 'KILL', request.user!, input);
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-2/submit')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.SUBMIT)
  async submitGateTwo(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(productId, 'SUBMIT', request.user!, input);
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-2/approve')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.APPROVE)
  async approveGateTwo(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(productId, 'APPROVE', request.user!, input);
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-2/reject')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.REJECT)
  async rejectGateTwo(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(productId, 'REJECT', request.user!, input);
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-2/kill')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.KILL)
  async killGateTwo(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(productId, 'KILL', request.user!, input);
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-2/reviews/qa')
  @Authorize(PolicyResource.GATE_TWO_REVIEWS, StageAction.REVIEW)
  async reviewGateTwoQa(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateTwoReviewResponseDto> {
    const result = await this.gateTwoReviewsService.recordReview(productId, 'QA', request.user!, input);
    return GateTwoReviewResponseDto.fromRecords(result);
  }

  @Post('gate-2/reviews/finance')
  @Authorize(PolicyResource.GATE_TWO_REVIEWS, StageAction.CONFIRM)
  async confirmGateTwoFinance(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateTwoReviewResponseDto> {
    const result = await this.gateTwoReviewsService.recordReview(
      productId,
      'FINANCE',
      request.user!,
      input,
    );
    return GateTwoReviewResponseDto.fromRecords(result);
  }

  @Post('gate-2/reviews/gm')
  @Authorize(PolicyResource.GATE_TWO_REVIEWS, StageAction.APPROVE)
  async approveGateTwoGm(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateTwoReviewResponseDto> {
    const result = await this.gateTwoReviewsService.recordReview(productId, 'GM', request.user!, input);
    return GateTwoReviewResponseDto.fromRecords(result);
  }
}
