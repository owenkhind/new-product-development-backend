import { Module, forwardRef } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { ProductsModule } from '../products/products.module';
import { ChannelPricingController } from './controllers/channel-pricing.controller';
import { ChannelPricingRepository } from './repositories/channel-pricing.repository';
import { ChannelPricingService } from './services/channel-pricing.service';

@Module({
  imports: [ProductsModule, forwardRef(() => AuthorizationModule)],
  controllers: [ChannelPricingController],
  providers: [ChannelPricingRepository, ChannelPricingService],
  exports: [ChannelPricingRepository, ChannelPricingService],
})
export class ChannelPricingModule {}
