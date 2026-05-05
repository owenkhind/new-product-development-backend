import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { AuthSessionModule } from './auth-session.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';

@Module({
  imports: [AuthSessionModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
