import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';

import { UserRole } from '../../src/enums/user-role.enum';
import { AuthSessionService } from '../../src/modules/auth/services/auth-session.service';
import { AuthService } from '../../src/modules/auth/services/auth.service';

const activeUser = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  email: 'admin@khind.com',
  fullName: 'Admin User',
  id: 'user-admin',
  isActive: true,
  lastLoginAt: null,
  role: UserRole.ADMIN,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('Temporary auth services', () => {
  it('creates and verifies signed session cookies', () => {
    const sessionService = createSessionService();
    const payload = sessionService.createSession({
      provider: 'EMAIL_PASSWORD',
      remember: true,
      userId: activeUser.id,
    });
    const responseHeaders = new Map<string, string>();

    sessionService.writeSessionCookie(
      {
        setHeader: (name: string, value: string) =>
          responseHeaders.set(name, value),
      } as never,
      payload,
    );

    const cookie = responseHeaders.get('Set-Cookie');
    const resolvedPayload = sessionService.getSessionFromCookieHeader(cookie);

    assert.equal(resolvedPayload?.userId, activeUser.id);
    assert.equal(resolvedPayload?.provider, 'EMAIL_PASSWORD');
    assert.equal(resolvedPayload?.expiresAt, null);
  });

  it('logs in active users with the configured temporary password', async () => {
    const authService = createAuthService({
      findByEmail: async () => activeUser,
      findById: async () => activeUser,
    });

    const result = await authService.loginWithTemporaryPassword({
      email: 'ADMIN@KHIND.COM',
      password: 'Password123',
      remember: false,
    });

    assert.equal(result.user.id, activeUser.id);
    assert.equal(result.payload.provider, 'EMAIL_PASSWORD');
    assert.ok(result.payload.expiresAt);
  });

  it('rejects inactive users and wrong temporary passwords', async () => {
    const authService = createAuthService({
      findByEmail: async () => ({
        ...activeUser,
        isActive: false,
      }),
      findById: async () => null,
    });

    await assert.rejects(
      authService.loginWithTemporaryPassword({
        email: activeUser.email,
        password: 'Password123',
        remember: true,
      }),
      UnauthorizedException,
    );

    const wrongPasswordService = createAuthService({
      findByEmail: async () => activeUser,
      findById: async () => activeUser,
    });

    await assert.rejects(
      wrongPasswordService.loginWithTemporaryPassword({
        email: activeUser.email,
        password: 'WrongPassword',
        remember: true,
      }),
      UnauthorizedException,
    );
  });
});

function createAuthService(usersRepository: {
  findByEmail: (email: string) => Promise<typeof activeUser | null>;
  findById: (id: string) => Promise<typeof activeUser | null>;
}): AuthService {
  const configService = new ConfigService({
    AUTH_SESSION_SECRET: 'test-session-secret-with-at-least-32-chars',
    NODE_ENV: 'test',
    TEMP_AUTH_PASSWORD: 'Password123',
  });

  return new AuthService(
    configService,
    usersRepository as never,
    new AuthSessionService(configService),
  );
}

function createSessionService(): AuthSessionService {
  return new AuthSessionService(
    new ConfigService({
      AUTH_SESSION_SECRET: 'test-session-secret-with-at-least-32-chars',
      NODE_ENV: 'test',
    }),
  );
}
