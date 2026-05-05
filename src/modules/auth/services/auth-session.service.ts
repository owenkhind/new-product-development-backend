import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Response } from 'express';

export const AUTH_SESSION_COOKIE = 'npd_session';

type AuthProvider = 'EMAIL_PASSWORD' | 'MICROSOFT_SSO';

export type AuthSessionPayload = {
  expiresAt: string | null;
  provider: AuthProvider;
  userId: string;
};

@Injectable()
export class AuthSessionService {
  constructor(private readonly configService: ConfigService) {}

  createSession(input: {
    provider: AuthProvider;
    remember: boolean;
    userId: string;
  }): AuthSessionPayload {
    return {
      expiresAt: input.remember ? null : this.getSessionExpiry().toISOString(),
      provider: input.provider,
      userId: input.userId,
    };
  }

  writeSessionCookie(response: Response, payload: AuthSessionPayload): void {
    response.setHeader(
      'Set-Cookie',
      this.serializeCookie(AUTH_SESSION_COOKIE, this.signPayload(payload), {
        expires: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
        httpOnly: true,
        maxAge: payload.expiresAt ? undefined : 60 * 60 * 24 * 14,
        sameSite: 'lax',
        secure: this.configService.get<string>('NODE_ENV') === 'production',
      }),
    );
  }

  clearSessionCookie(response: Response): void {
    response.setHeader(
      'Set-Cookie',
      this.serializeCookie(AUTH_SESSION_COOKIE, '', {
        expires: new Date(0),
        httpOnly: true,
        maxAge: 0,
        sameSite: 'lax',
        secure: this.configService.get<string>('NODE_ENV') === 'production',
      }),
    );
  }

  getSessionFromCookieHeader(
    cookieHeader: string | string[] | undefined,
  ): AuthSessionPayload | null {
    const token = this.readCookie(cookieHeader, AUTH_SESSION_COOKIE);

    if (!token) {
      return null;
    }

    const payload = this.verifyToken(token);

    if (!payload) {
      return null;
    }

    if (
      payload.expiresAt &&
      new Date(payload.expiresAt).getTime() <= Date.now()
    ) {
      return null;
    }

    return payload;
  }

  private signPayload(payload: AuthSessionPayload): string {
    const encodedPayload = Buffer.from(
      JSON.stringify(payload),
      'utf8',
    ).toString('base64url');
    const signature = this.sign(encodedPayload);

    return `${encodedPayload}.${signature}`;
  }

  private verifyToken(token: string): AuthSessionPayload | null {
    const [encodedPayload, signature] = token.split('.');

    if (
      !encodedPayload ||
      !signature ||
      !this.isValidSignature(encodedPayload, signature)
    ) {
      return null;
    }

    try {
      const payload = JSON.parse(
        Buffer.from(encodedPayload, 'base64url').toString('utf8'),
      ) as AuthSessionPayload;

      if (!payload.userId || !payload.provider || !('expiresAt' in payload)) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  private isValidSignature(encodedPayload: string, signature: string): boolean {
    const expectedSignature = this.sign(encodedPayload);
    const actual = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);

    return (
      actual.length === expected.length && timingSafeEqual(actual, expected)
    );
  }

  private sign(encodedPayload: string): string {
    return createHmac('sha256', this.getSessionSecret())
      .update(encodedPayload)
      .digest('base64url');
  }

  private getSessionSecret(): string {
    const configuredSecret = this.configService.get<string>(
      'AUTH_SESSION_SECRET',
    );

    if (configuredSecret) {
      return configuredSecret;
    }

    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new UnauthorizedException({
        code: 'AUTH_SESSION_NOT_CONFIGURED',
        message: 'Authentication session secret is not configured.',
      });
    }

    return 'development-session-secret-change-before-production';
  }

  private readCookie(
    cookieHeader: string | string[] | undefined,
    name: string,
  ): string | null {
    const header = Array.isArray(cookieHeader)
      ? cookieHeader.join('; ')
      : cookieHeader;

    if (!header) {
      return null;
    }

    const cookies = header.split(';').map((cookie) => cookie.trim());
    const cookie = cookies.find((item) => item.startsWith(`${name}=`));

    return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
  }

  private serializeCookie(
    name: string,
    value: string,
    options: {
      expires?: Date;
      httpOnly: boolean;
      maxAge?: number;
      sameSite: 'lax' | 'strict';
      secure: boolean;
    },
  ): string {
    const parts = [
      `${name}=${encodeURIComponent(value)}`,
      'Path=/',
      `SameSite=${options.sameSite}`,
    ];

    if (options.httpOnly) {
      parts.push('HttpOnly');
    }

    if (options.secure) {
      parts.push('Secure');
    }

    if (options.expires) {
      parts.push(`Expires=${options.expires.toUTCString()}`);
    }

    if (options.maxAge !== undefined) {
      parts.push(`Max-Age=${options.maxAge}`);
    }

    return parts.join('; ');
  }

  private getSessionExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8);

    return expiresAt;
  }
}
