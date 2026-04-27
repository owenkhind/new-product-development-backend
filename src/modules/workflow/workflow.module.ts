import { Module } from '@nestjs/common';

import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { BusinessCasesModule } from '../business-cases/business-cases.module';
import { ChannelListingPlansModule } from '../channel-listing-plans/channel-listing-plans.module';
import { ChannelPricingModule } from '../channel-pricing/channel-pricing.module';
import { CompetitorMatricesModule } from '../competitor-matrices/competitor-matrices.module';
import { GateDecisionsModule } from '../gate-decisions/gate-decisions.module';
import { GtmPlansModule } from '../gtm-plans/gtm-plans.module';
import { MarketSizingModule } from '../market-sizing/market-sizing.module';
import { OpportunityBriefsModule } from '../opportunity-briefs/opportunity-briefs.module';
import { ProductsModule } from '../products/products.module';
import { SupplierEvaluationsModule } from '../supplier-evaluations/supplier-evaluations.module';
import { GateWorkflowController } from './controllers/gate-workflow.controller';
import { ProductWorkflowController } from './controllers/product-workflow.controller';
import { GateThreeReviewsRepository } from './repositories/gate-three-reviews.repository';
import { GateTwoReviewsRepository } from './repositories/gate-two-reviews.repository';
import { GateThreeReviewsService } from './services/gate-three-reviews.service';
import { GateTwoReviewsService } from './services/gate-two-reviews.service';
import { GateWorkflowService } from './services/gate-workflow.service';
import { ProductWorkflowService } from './services/product-workflow.service';
import { StageOneCompletionService } from './services/stage-one-completion.service';
import { StageThreeCompletionService } from './services/stage-three-completion.service';
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
    ChannelListingPlansModule,
    ChannelPricingModule,
    GtmPlansModule,
  ],
  controllers: [ProductWorkflowController, GateWorkflowController],
  providers: [
    ProductWorkflowService,
    GateWorkflowService,
    GateTwoReviewsService,
    GateThreeReviewsService,
    GateTwoReviewsRepository,
    GateThreeReviewsRepository,
    StageOneCompletionService,
    StageTwoCompletionService,
    StageThreeCompletionService,
  ],
  exports: [
    ProductWorkflowService,
    GateWorkflowService,
    GateTwoReviewsService,
    GateThreeReviewsService,
  ],
})
export class WorkflowModule {}
