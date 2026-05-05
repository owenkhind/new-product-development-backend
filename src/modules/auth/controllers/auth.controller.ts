import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotImplementedException,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthSessionResponseDto } from '../dto/auth-session-response.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from '../services/auth.service';
import { AuthSessionService } from '../services/auth-session.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authSessionService: AuthSessionService,
  ) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponseDto> {
    const result = await this.authService.loginWithTemporaryPassword(loginDto);

    this.authSessionService.writeSessionCookie(response, result.payload);

    return AuthSessionResponseDto.fromRecord({
      expiresAt: result.payload.expiresAt
        ? new Date(result.payload.expiresAt)
        : null,
      provider: result.payload.provider,
      user: result.user,
    });
  }

  @Get('session')
  async session(
    @Req() request: Request,
  ): Promise<AuthSessionResponseDto | null> {
    const payload = this.authSessionService.getSessionFromCookieHeader(
      request.headers.cookie,
    );
    const result = await this.authService.resolveSession(payload);

    if (!result) {
      return null;
    }

    return AuthSessionResponseDto.fromRecord({
      expiresAt: result.payload.expiresAt
        ? new Date(result.payload.expiresAt)
        : null,
      provider: result.payload.provider,
      user: result.user,
    });
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response): void {
    this.authSessionService.clearSessionCookie(response);
  }

  @Get('microsoft')
  microsoft(): never {
    throw new NotImplementedException({
      code: 'MICROSOFT_SSO_NOT_READY',
      message:
        'Microsoft SSO is not connected yet. Use temporary email/password sign-in for UAT.',
    });
  }
}
