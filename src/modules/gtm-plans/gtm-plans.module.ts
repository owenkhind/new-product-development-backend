import { Module, forwardRef } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { ProductsModule } from '../products/products.module';
import { GtmPlansController } from './controllers/gtm-plans.controller';
import { GtmPlansRepository } from './repositories/gtm-plans.repository';
import { GtmPlansService } from './services/gtm-plans.service';

@Module({
  imports: [ProductsModule, forwardRef(() => AuthorizationModule)],
  controllers: [GtmPlansController],
  providers: [GtmPlansRepository, GtmPlansService],
  exports: [GtmPlansRepository, GtmPlansService],
})
export class GtmPlansModule {}
