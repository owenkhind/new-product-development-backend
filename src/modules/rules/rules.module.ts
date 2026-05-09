import { Module } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { RulesController } from './controllers/rules.controller';
import { RulesService } from './services/rules.service';

@Module({
  imports: [AuthorizationModule],
  controllers: [RulesController],
  providers: [RulesService],
  exports: [RulesService],
})
export class RulesModule {}
