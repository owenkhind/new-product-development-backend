import { Module, forwardRef } from '@nestjs/common';

import { AuthorizationModule } from '../authorization/authorization.module';
import { ProductsModule } from '../products/products.module';
import { OpportunityBriefsController } from './controllers/opportunity-briefs.controller';
import { OpportunityBriefsRepository } from './repositories/opportunity-briefs.repository';
import { OpportunityBriefsService } from './services/opportunity-briefs.service';

@Module({
  imports: [ProductsModule, forwardRef(() => AuthorizationModule)],
  controllers: [OpportunityBriefsController],
  providers: [OpportunityBriefsRepository, OpportunityBriefsService],
  exports: [OpportunityBriefsRepository, OpportunityBriefsService],
})
export class OpportunityBriefsModule {}
