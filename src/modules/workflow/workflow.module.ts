import { Module } from '@nestjs/common';

import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { CompetitorMatricesModule } from '../competitor-matrices/competitor-matrices.module';
import { GateDecisionsModule } from '../gate-decisions/gate-decisions.module';
import { MarketSizingModule } from '../market-sizing/market-sizing.module';
import { OpportunityBriefsModule } from '../opportunity-briefs/opportunity-briefs.module';
import { ProductsModule } from '../products/products.module';
import { ProductWorkflowController } from './controllers/product-workflow.controller';
import { ProductWorkflowService } from './services/product-workflow.service';
import { StageOneCompletionService } from './services/stage-one-completion.service';

@Module({
  imports: [
    ProductsModule,
    GateDecisionsModule,
    AuditLogsModule,
    AuthorizationModule,
    OpportunityBriefsModule,
    MarketSizingModule,
    CompetitorMatricesModule,
  ],
  controllers: [ProductWorkflowController],
  providers: [ProductWorkflowService, StageOneCompletionService],
  exports: [ProductWorkflowService],
})
export class WorkflowModule {}
