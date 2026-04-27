import { Module, forwardRef } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { ProductsModule } from '../products/products.module';
import { Day30ReviewsController } from './controllers/day-30-reviews.controller';
import { Day30ReviewsRepository } from './repositories/day-30-reviews.repository';
import { Day30ReviewsService } from './services/day-30-reviews.service';

@Module({
  imports: [ProductsModule, forwardRef(() => AuthorizationModule)],
  controllers: [Day30ReviewsController],
  providers: [Day30ReviewsRepository, Day30ReviewsService],
  exports: [Day30ReviewsRepository, Day30ReviewsService],
})
export class Day30ReviewsModule {}
