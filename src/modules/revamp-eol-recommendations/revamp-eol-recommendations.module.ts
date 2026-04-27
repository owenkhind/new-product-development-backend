import { forwardRef, Module } from '@nestjs/common';

import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { AuthorizationModule } from '../authorization/authorization.module';
import { ProductsModule } from '../products/products.module';
import { RevampEolRecommendationsController } from './controllers/revamp-eol-recommendations.controller';
import { RevampEolRecommendationsRepository } from './repositories/revamp-eol-recommendations.repository';
import { RevampEolRecommendationsService } from './services/revamp-eol-recommendations.service';

@Module({
  controllers: [RevampEolRecommendationsController],
  exports: [RevampEolRecommendationsRepository, RevampEolRecommendationsService],
  imports: [AuditLogsModule, ProductsModule, forwardRef(() => AuthorizationModule)],
  providers: [RevampEolRecommendationsRepository, RevampEolRecommendationsService],
})
export class RevampEolRecommendationsModule {}
