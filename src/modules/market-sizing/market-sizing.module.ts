import { Module, forwardRef } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { ProductsModule } from '../products/products.module';
import { MarketSizingController } from './controllers/market-sizing.controller';
import { MarketSizingRepository } from './repositories/market-sizing.repository';
import { MarketSizingService } from './services/market-sizing.service';

@Module({
  imports: [ProductsModule, forwardRef(() => AuthorizationModule)],
  controllers: [MarketSizingController],
  providers: [MarketSizingRepository, MarketSizingService],
  exports: [MarketSizingRepository, MarketSizingService],
})
export class MarketSizingModule {}
