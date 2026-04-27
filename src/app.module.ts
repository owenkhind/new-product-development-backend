import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database/database.module';
import { envValidationSchema } from './config/env.validation';
import { RequestIdMiddleware } from './middleware/request-id.middleware';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { BusinessCasesModule } from './modules/business-cases/business-cases.module';
import { ChannelListingPlansModule } from './modules/channel-listing-plans/channel-listing-plans.module';
import { ChannelPricingModule } from './modules/channel-pricing/channel-pricing.module';
import { ClearancePlansModule } from './modules/clearance-plans/clearance-plans.module';
import { CompetitorMatricesModule } from './modules/competitor-matrices/competitor-matrices.module';
import { Day30ReviewsModule } from './modules/day-30-reviews/day-30-reviews.module';
import { EolExecutionPlansModule } from './modules/eol-execution-plans/eol-execution-plans.module';
import { GateDecisionsModule } from './modules/gate-decisions/gate-decisions.module';
import { GtmPlansModule } from './modules/gtm-plans/gtm-plans.module';
import { HealthModule } from './modules/health/health.module';
import { LaunchConfirmationsModule } from './modules/launch-confirmations/launch-confirmations.module';
import { MarketSizingModule } from './modules/market-sizing/market-sizing.module';
import { OpportunityBriefsModule } from './modules/opportunity-briefs/opportunity-briefs.module';
import { PortfolioUpdatesModule } from './modules/portfolio-updates/portfolio-updates.module';
import { ProductScorecardsModule } from './modules/product-scorecards/product-scorecards.module';
import { ProductsModule } from './modules/products/products.module';
import { RevampEolRecommendationsModule } from './modules/revamp-eol-recommendations/revamp-eol-recommendations.module';
import { SupplierEvaluationsModule } from './modules/supplier-evaluations/supplier-evaluations.module';
import { UsersModule } from './modules/users/users.module';
import { SellInReportsModule } from './modules/sell-in-reports/sell-in-reports.module';
import { WeeklyFeedbackLogsModule } from './modules/weekly-feedback-logs/weekly-feedback-logs.module';
import { WorkflowModule } from './modules/workflow/workflow.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      validationSchema: envValidationSchema,
    }),
    DatabaseModule,
    AuditLogsModule,
    BusinessCasesModule,
    ChannelListingPlansModule,
    ChannelPricingModule,
    ClearancePlansModule,
    CompetitorMatricesModule,
    Day30ReviewsModule,
    EolExecutionPlansModule,
    GateDecisionsModule,
    GtmPlansModule,
    HealthModule,
    LaunchConfirmationsModule,
    MarketSizingModule,
    OpportunityBriefsModule,
    PortfolioUpdatesModule,
    ProductScorecardsModule,
    ProductsModule,
    RevampEolRecommendationsModule,
    SellInReportsModule,
    SupplierEvaluationsModule,
    UsersModule,
    WeeklyFeedbackLogsModule,
    WorkflowModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
