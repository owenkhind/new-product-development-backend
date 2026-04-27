import { forwardRef, Module } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { ProductsModule } from '../products/products.module';
import { RevampEolRecommendationsModule } from '../revamp-eol-recommendations/revamp-eol-recommendations.module';
import { ClearancePlansController } from './controllers/clearance-plans.controller';
import { ClearancePlansRepository } from './repositories/clearance-plans.repository';
import { ClearancePlansService } from './services/clearance-plans.service';

@Module({
  controllers: [ClearancePlansController],
  exports: [ClearancePlansRepository, ClearancePlansService],
  imports: [ProductsModule, RevampEolRecommendationsModule, forwardRef(() => AuthorizationModule)],
  providers: [ClearancePlansRepository, ClearancePlansService],
})
export class ClearancePlansModule {}
