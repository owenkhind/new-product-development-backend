import { forwardRef, Module } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { ProductsModule } from '../products/products.module';
import { RevampEolRecommendationsModule } from '../revamp-eol-recommendations/revamp-eol-recommendations.module';
import { EolExecutionPlansController } from './controllers/eol-execution-plans.controller';
import { EolExecutionPlansRepository } from './repositories/eol-execution-plans.repository';
import { EolExecutionPlansService } from './services/eol-execution-plans.service';

@Module({
  controllers: [EolExecutionPlansController],
  exports: [EolExecutionPlansRepository, EolExecutionPlansService],
  imports: [ProductsModule, RevampEolRecommendationsModule, forwardRef(() => AuthorizationModule)],
  providers: [EolExecutionPlansRepository, EolExecutionPlansService],
})
export class EolExecutionPlansModule {}
