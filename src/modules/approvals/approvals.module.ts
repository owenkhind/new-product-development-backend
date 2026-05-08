import { Module } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { ApprovalsController } from './controllers/approvals.controller';
import { ApprovalQueueRepository } from './repositories/approval-queue.repository';
import { ApprovalQueueService } from './services/approval-queue.service';

@Module({
  imports: [AuthorizationModule],
  controllers: [ApprovalsController],
  providers: [ApprovalQueueRepository, ApprovalQueueService],
  exports: [ApprovalQueueService],
})
export class ApprovalsModule {}
