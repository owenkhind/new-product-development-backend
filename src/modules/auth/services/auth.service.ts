import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';

import { UsersRepository } from '../../users/repositories/users.repository';
import type { UserRecord } from '../../users/types/user-record.type';
import type { LoginDto } from '../dto/login.dto';
import {
  AuthSessionService,
  type AuthSessionPayload,
} from './auth-session.service';

type LoginResult = {
  payload: AuthSessionPayload;
  user: UserRecord;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
    private readonly authSessionService: AuthSessionService,
  ) {}

  async loginWithTemporaryPassword(input: LoginDto): Promise<LoginResult> {
    const user = await this.usersRepository.findByEmail(
      input.email.trim().toLowerCase(),
    );

    if (
      !user ||
      !user.isActive ||
      !this.matchesTemporaryPassword(input.password)
    ) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email or password is incorrect.',
      });
    }

    return {
      payload: this.authSessionService.createSession({
        provider: 'EMAIL_PASSWORD',
        remember: input.remember,
        userId: user.id,
      }),
      user,
    };
  }

  async resolveSession(
    payload: AuthSessionPayload | null,
  ): Promise<LoginResult | null> {
    if (!payload) {
      return null;
    }

    const user = await this.usersRepository.findById(payload.userId);

    if (!user || !user.isActive) {
      return null;
    }

    return {
      payload,
      user,
    };
  }

  private matchesTemporaryPassword(password: string): boolean {
    const expectedPassword = this.getTemporaryPassword();
    const actual = Buffer.from(password);
    const expected = Buffer.from(expectedPassword);

    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }

  private getTemporaryPassword(): string {
    const configuredPassword =
      this.configService.get<string>('TEMP_AUTH_PASSWORD');

    if (configuredPassword) {
      return configuredPassword;
    }

    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new UnauthorizedException({
        code: 'TEMP_AUTH_NOT_CONFIGURED',
        message: 'Temporary email/password authentication is not configured.',
      });
    }

    return 'Password123';
  }
}
