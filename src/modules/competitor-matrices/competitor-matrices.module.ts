import { Module, forwardRef } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { ProductsModule } from '../products/products.module';
import { CompetitorMatricesController } from './controllers/competitor-matrices.controller';
import { CompetitorMatricesRepository } from './repositories/competitor-matrices.repository';
import { CompetitorMatricesService } from './services/competitor-matrices.service';

@Module({
  imports: [ProductsModule, forwardRef(() => AuthorizationModule)],
  controllers: [CompetitorMatricesController],
  providers: [CompetitorMatricesRepository, CompetitorMatricesService],
  exports: [CompetitorMatricesRepository, CompetitorMatricesService],
})
export class CompetitorMatricesModule {}
