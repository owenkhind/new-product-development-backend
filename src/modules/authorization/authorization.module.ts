import { Module, forwardRef } from '@nestjs/common';

import { PoliciesGuard } from '../../guards/policies.guard';
import { AuthSessionModule } from '../auth/auth-session.module';
import { ProductsModule } from '../products/products.module';
import { UsersModule } from '../users/users.module';
import { AuthorizationPolicyService } from './services/authorization-policy.service';

@Module({
  imports: [
    AuthSessionModule,
    forwardRef(() => UsersModule),
    forwardRef(() => ProductsModule),
  ],
  providers: [AuthorizationPolicyService, PoliciesGuard],
  exports: [AuthorizationPolicyService, PoliciesGuard],
})
export class AuthorizationModule {}
