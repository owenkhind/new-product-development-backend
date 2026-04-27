import { Module, forwardRef } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { ProductsModule } from '../products/products.module';
import { WeeklyFeedbackLogsController } from './controllers/weekly-feedback-logs.controller';
import { WeeklyFeedbackLogsRepository } from './repositories/weekly-feedback-logs.repository';
import { WeeklyFeedbackLogsService } from './services/weekly-feedback-logs.service';

@Module({
  imports: [ProductsModule, forwardRef(() => AuthorizationModule)],
  controllers: [WeeklyFeedbackLogsController],
  providers: [WeeklyFeedbackLogsRepository, WeeklyFeedbackLogsService],
  exports: [WeeklyFeedbackLogsRepository, WeeklyFeedbackLogsService],
})
export class WeeklyFeedbackLogsModule {}
