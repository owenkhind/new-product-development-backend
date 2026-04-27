import { Module, forwardRef } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { ProductsModule } from '../products/products.module';
import { ChannelListingPlansController } from './controllers/channel-listing-plans.controller';
import { ChannelListingPlansRepository } from './repositories/channel-listing-plans.repository';
import { ChannelListingPlansService } from './services/channel-listing-plans.service';

@Module({
  imports: [ProductsModule, forwardRef(() => AuthorizationModule)],
  controllers: [ChannelListingPlansController],
  providers: [ChannelListingPlansRepository, ChannelListingPlansService],
  exports: [ChannelListingPlansRepository, ChannelListingPlansService],
})
export class ChannelListingPlansModule {}
