import { Module } from '@nestjs/common';

import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { BusinessCasesModule } from '../business-cases/business-cases.module';
import { CompetitorMatricesModule } from '../competitor-matrices/competitor-matrices.module';
import { GateDecisionsModule } from '../gate-decisions/gate-decisions.module';
import { MarketSizingModule } from '../market-sizing/market-sizing.module';
import { OpportunityBriefsModule } from '../opportunity-briefs/opportunity-briefs.module';
import { ProductsModule } from '../products/products.module';
import { SupplierEvaluationsModule } from '../supplier-evaluations/supplier-evaluations.module';
import { GateWorkflowController } from './controllers/gate-workflow.controller';
import { ProductWorkflowController } from './controllers/product-workflow.controller';
import { GateTwoReviewsRepository } from './repositories/gate-two-reviews.repository';
import { GateTwoReviewsService } from './services/gate-two-reviews.service';
import { GateWorkflowService } from './services/gate-workflow.service';
import { ProductWorkflowService } from './services/product-workflow.service';
import { StageOneCompletionService } from './services/stage-one-completion.service';
import { StageTwoCompletionService } from './services/stage-two-completion.service';

@Module({
  imports: [
    ProductsModule,
    GateDecisionsModule,
    AuditLogsModule,
    AuthorizationModule,
    OpportunityBriefsModule,
    MarketSizingModule,
    CompetitorMatricesModule,
    SupplierEvaluationsModule,
    BusinessCasesModule,
  ],
  controllers: [ProductWorkflowController, GateWorkflowController],
  providers: [
    ProductWorkflowService,
    GateWorkflowService,
    GateTwoReviewsService,
    GateTwoReviewsRepository,
    StageOneCompletionService,
    StageTwoCompletionService,
  ],
  exports: [ProductWorkflowService, GateWorkflowService, GateTwoReviewsService],
})
export class WorkflowModule {}
