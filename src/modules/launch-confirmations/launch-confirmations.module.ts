import { Module, forwardRef } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { ProductsModule } from '../products/products.module';
import { LaunchConfirmationsController } from './controllers/launch-confirmations.controller';
import { LaunchConfirmationsRepository } from './repositories/launch-confirmations.repository';
import { LaunchConfirmationsService } from './services/launch-confirmations.service';

@Module({
  imports: [ProductsModule, forwardRef(() => AuthorizationModule)],
  controllers: [LaunchConfirmationsController],
  providers: [LaunchConfirmationsRepository, LaunchConfirmationsService],
  exports: [LaunchConfirmationsRepository, LaunchConfirmationsService],
})
export class LaunchConfirmationsModule {}
