import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { DatabaseModule } from './database/database.module';
import { envValidationSchema } from './config/env.validation';
import { RequestIdMiddleware } from './middleware/request-id.middleware';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { CompetitorMatricesModule } from './modules/competitor-matrices/competitor-matrices.module';
import { GateDecisionsModule } from './modules/gate-decisions/gate-decisions.module';
import { HealthModule } from './modules/health/health.module';
import { MarketSizingModule } from './modules/market-sizing/market-sizing.module';
import { OpportunityBriefsModule } from './modules/opportunity-briefs/opportunity-briefs.module';
import { ProductsModule } from './modules/products/products.module';
import { UsersModule } from './modules/users/users.module';
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
    CompetitorMatricesModule,
    GateDecisionsModule,
    HealthModule,
    MarketSizingModule,
    OpportunityBriefsModule,
    ProductsModule,
    UsersModule,
    WorkflowModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
