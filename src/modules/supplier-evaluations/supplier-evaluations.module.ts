import { Module, forwardRef } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { ProductsModule } from '../products/products.module';
import { SupplierEvaluationsController } from './controllers/supplier-evaluations.controller';
import { SupplierEvaluationsRepository } from './repositories/supplier-evaluations.repository';
import { SupplierEvaluationsService } from './services/supplier-evaluations.service';

@Module({
  imports: [ProductsModule, forwardRef(() => AuthorizationModule)],
  controllers: [SupplierEvaluationsController],
  providers: [SupplierEvaluationsRepository, SupplierEvaluationsService],
  exports: [SupplierEvaluationsRepository, SupplierEvaluationsService],
})
export class SupplierEvaluationsModule {}
