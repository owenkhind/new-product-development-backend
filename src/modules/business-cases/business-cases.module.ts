import { Module, forwardRef } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { ProductsModule } from '../products/products.module';
import { BusinessCasesController } from './controllers/business-cases.controller';
import { BusinessCasesRepository } from './repositories/business-cases.repository';
import { BusinessCasesService } from './services/business-cases.service';

@Module({
  imports: [ProductsModule, forwardRef(() => AuthorizationModule)],
  controllers: [BusinessCasesController],
  providers: [BusinessCasesRepository, BusinessCasesService],
  exports: [BusinessCasesRepository, BusinessCasesService],
})
export class BusinessCasesModule {}
