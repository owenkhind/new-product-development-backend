import { Module, forwardRef } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { ProductsModule } from '../products/products.module';
import { SellInReportsController } from './controllers/sell-in-reports.controller';
import { SellInReportsRepository } from './repositories/sell-in-reports.repository';
import { SellInReportsService } from './services/sell-in-reports.service';

@Module({
  imports: [ProductsModule, forwardRef(() => AuthorizationModule)],
  controllers: [SellInReportsController],
  providers: [SellInReportsRepository, SellInReportsService],
  exports: [SellInReportsRepository, SellInReportsService],
})
export class SellInReportsModule {}
