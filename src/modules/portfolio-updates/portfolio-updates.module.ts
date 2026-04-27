import { forwardRef, Module } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { PortfolioUpdatesController } from './controllers/portfolio-updates.controller';
import { PortfolioUpdatesRepository } from './repositories/portfolio-updates.repository';
import { PortfolioUpdatesService } from './services/portfolio-updates.service';

@Module({
  controllers: [PortfolioUpdatesController],
  exports: [PortfolioUpdatesRepository, PortfolioUpdatesService],
  imports: [forwardRef(() => AuthorizationModule)],
  providers: [PortfolioUpdatesRepository, PortfolioUpdatesService],
})
export class PortfolioUpdatesModule {}
