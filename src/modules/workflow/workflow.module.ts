import { Module } from '@nestjs/common';

import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { GateDecisionsModule } from '../gate-decisions/gate-decisions.module';
import { ProductsModule } from '../products/products.module';
import { ProductWorkflowController } from './controllers/product-workflow.controller';
import { ProductWorkflowService } from './services/product-workflow.service';

@Module({
  imports: [ProductsModule, GateDecisionsModule, AuditLogsModule, AuthorizationModule],
  controllers: [ProductWorkflowController],
  providers: [ProductWorkflowService],
  exports: [ProductWorkflowService],
})
export class WorkflowModule {}
