import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { WorkflowTransitionRequestDto } from '../dto/workflow-transition-request.dto';
import { GateThreeReviewResponseDto } from '../dto/gate-three-review-response.dto';
import { GateTwoReviewResponseDto } from '../dto/gate-two-review-response.dto';
import { GateWorkflowResponseDto } from '../dto/gate-workflow-response.dto';
import { GateThreeReviewsService } from '../services/gate-three-reviews.service';
import { GateTwoReviewsService } from '../services/gate-two-reviews.service';
import { GateWorkflowService } from '../services/gate-workflow.service';

@Controller('products/:productId/gates')
@UseGuards(PoliciesGuard)
export class GateWorkflowController {
  constructor(
    private readonly gateWorkflowService: GateWorkflowService,
    private readonly gateTwoReviewsService: GateTwoReviewsService,
    private readonly gateThreeReviewsService: GateThreeReviewsService,
  ) {}

  @Post('gate-1/submit')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.SUBMIT)
  async submitGateOne(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'SUBMIT',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-1/approve')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.APPROVE)
  async approveGateOne(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'APPROVE',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-1/reject')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.REJECT)
  async rejectGateOne(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'REJECT',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-1/kill')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.KILL)
  async killGateOne(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'KILL',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-2/submit')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.SUBMIT)
  async submitGateTwo(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'SUBMIT',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-2/approve')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.APPROVE)
  async approveGateTwo(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'APPROVE',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-2/reject')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.REJECT)
  async rejectGateTwo(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'REJECT',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-2/kill')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.KILL)
  async killGateTwo(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'KILL',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-3/submit')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.SUBMIT)
  async submitGateThree(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'SUBMIT',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-3/approve')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.APPROVE)
  async approveGateThree(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'APPROVE',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-3/reject')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.REJECT)
  async rejectGateThree(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'REJECT',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-3/kill')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.KILL)
  async killGateThree(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'KILL',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-4/submit')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.SUBMIT)
  async submitGateFour(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'SUBMIT',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-4/approve')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.APPROVE)
  async approveGateFour(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'APPROVE',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-4/reject')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.REJECT)
  async rejectGateFour(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'REJECT',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-4/kill')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.KILL)
  async killGateFour(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'KILL',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-5/submit')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.SUBMIT)
  async submitGateFive(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'SUBMIT',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-5/approve')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.APPROVE)
  async approveGateFive(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'APPROVE',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-5/reject')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.REJECT)
  async rejectGateFive(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'REJECT',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-5/kill')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.KILL)
  async killGateFive(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'KILL',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-6/submit')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.SUBMIT)
  async submitGateSix(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'SUBMIT',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-6/approve')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.APPROVE)
  async approveGateSix(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'APPROVE',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-6/reject')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.REJECT)
  async rejectGateSix(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'REJECT',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-6/kill')
  @Authorize(PolicyResource.GATE_WORKFLOW, StageAction.KILL)
  async killGateSix(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateWorkflowResponseDto> {
    const result = await this.gateWorkflowService.transition(
      productId,
      'KILL',
      request.user!,
      input,
    );
    return GateWorkflowResponseDto.fromRecords(result);
  }

  @Post('gate-2/reviews/qa')
  @Authorize(PolicyResource.GATE_TWO_REVIEWS, StageAction.REVIEW)
  async reviewGateTwoQa(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateTwoReviewResponseDto> {
    const result = await this.gateTwoReviewsService.recordReview(
      productId,
      'QA',
      request.user!,
      input,
    );
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
    const result = await this.gateTwoReviewsService.recordReview(
      productId,
      'GM',
      request.user!,
      input,
    );
    return GateTwoReviewResponseDto.fromRecords(result);
  }

  @Post('gate-3/reviews/finance')
  @Authorize(PolicyResource.GATE_THREE_REVIEWS, StageAction.CONFIRM)
  async confirmGateThreeFinance(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateThreeReviewResponseDto> {
    const result = await this.gateThreeReviewsService.recordReview(
      productId,
      'FINANCE',
      request.user!,
      input,
    );
    return GateThreeReviewResponseDto.fromRecords(result);
  }

  @Post('gate-3/reviews/marketing')
  @Authorize(PolicyResource.GATE_THREE_REVIEWS, StageAction.REVIEW)
  async reviewGateThreeMarketing(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateThreeReviewResponseDto> {
    const result = await this.gateThreeReviewsService.recordReview(
      productId,
      'MARKETING',
      request.user!,
      input,
    );
    return GateThreeReviewResponseDto.fromRecords(result);
  }

  @Post('gate-3/reviews/gm')
  @Authorize(PolicyResource.GATE_THREE_REVIEWS, StageAction.APPROVE)
  async approveGateThreeGm(
    @Param('productId') productId: string,
    @Body() input: WorkflowTransitionRequestDto,
    @Req() request: Request,
  ): Promise<GateThreeReviewResponseDto> {
    const result = await this.gateThreeReviewsService.recordReview(
      productId,
      'GM',
      request.user!,
      input,
    );
    return GateThreeReviewResponseDto.fromRecords(result);
  }
}
