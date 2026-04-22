import { Module } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { ProductGateDecisionsController } from './controllers/product-gate-decisions.controller';
import { GateDecisionsRepository } from './repositories/gate-decisions.repository';
import { GateDecisionsService } from './services/gate-decisions.service';

@Module({
  imports: [AuthorizationModule],
  controllers: [ProductGateDecisionsController],
  providers: [GateDecisionsRepository, GateDecisionsService],
  exports: [GateDecisionsRepository, GateDecisionsService],
})
export class GateDecisionsModule {}
