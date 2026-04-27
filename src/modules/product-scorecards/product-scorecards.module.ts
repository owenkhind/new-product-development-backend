import { forwardRef, Module } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { ProductsModule } from '../products/products.module';
import { ProductScorecardsController } from './controllers/product-scorecards.controller';
import { ProductScorecardsRepository } from './repositories/product-scorecards.repository';
import { ProductScorecardsService } from './services/product-scorecards.service';

@Module({
  controllers: [ProductScorecardsController],
  exports: [ProductScorecardsRepository, ProductScorecardsService],
  imports: [ProductsModule, forwardRef(() => AuthorizationModule)],
  providers: [ProductScorecardsRepository, ProductScorecardsService],
})
export class ProductScorecardsModule {}
