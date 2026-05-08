import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { Authorize } from '../../../guards/authorize.decorator';
import { PoliciesGuard } from '../../../guards/policies.guard';
import { ApprovalQueueResponseDto } from '../dto/approval-queue-response.dto';
import { ApprovalQueueService } from '../services/approval-queue.service';

@Controller('approvals')
@UseGuards(PoliciesGuard)
export class ApprovalsController {
  constructor(private readonly approvalQueueService: ApprovalQueueService) {}

  @Get()
  @Authorize(PolicyResource.APPROVALS, StageAction.VIEW)
  async getQueue(@Req() request: Request): Promise<ApprovalQueueResponseDto> {
    const queue = await this.approvalQueueService.getQueue(request.user!);

    return ApprovalQueueResponseDto.fromRecord(queue);
  }
}
