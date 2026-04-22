import { Module, forwardRef } from '@nestjs/common';

import { PoliciesGuard } from '../../guards/policies.guard';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { AuthorizationPolicyService } from './services/authorization-policy.service';

@Module({
  imports: [forwardRef(() => UsersModule), forwardRef(() => ProductsModule)],
  providers: [AuthorizationPolicyService, PoliciesGuard],
  exports: [AuthorizationPolicyService, PoliciesGuard],
})
export class AuthorizationModule {}
