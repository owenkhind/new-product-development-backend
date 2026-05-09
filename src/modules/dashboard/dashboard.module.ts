import { Module } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { DashboardController } from './controllers/dashboard.controller';
import { DashboardRepository } from './repositories/dashboard.repository';
import { DashboardService } from './services/dashboard.service';

@Module({
  imports: [AuthorizationModule],
  controllers: [DashboardController],
  providers: [DashboardRepository, DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
