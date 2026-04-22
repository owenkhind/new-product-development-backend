import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { UserRole } from '../enums/user-role.enum';
import type { AuthenticatedUser } from '../types/authenticated-user.type';
import { UsersRepository } from '../modules/users/repositories/users.repository';
import { AuthorizationPolicyService } from '../modules/authorization/services/authorization-policy.service';
import { AUTHORIZATION_RULE_KEY, type AuthorizationRule } from './authorize.decorator';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly usersRepository: UsersRepository,
    private readonly authorizationPolicyService: AuthorizationPolicyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rule = this.reflector.getAllAndOverride<AuthorizationRule | undefined>(
      AUTHORIZATION_RULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!rule) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const actor = await this.resolveActor(request);

    if (!actor) {
      throw new UnauthorizedException({
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required to access this resource.',
      });
    }

    request.user = actor;

    await this.authorizationPolicyService.assertAuthorized({
      action: rule.action,
      actor,
      resource: rule.resource,
      targetId: this.getTargetId(request.params),
    });

    return true;
  }

  private async resolveActor(request: Request): Promise<AuthenticatedUser | null> {
    if (request.user) {
      return request.user;
    }

    const environment = this.configService.get<string>('NODE_ENV');

    if (environment === 'production') {
      return null;
    }

    const userIdHeader = request.headers['x-dev-user-id'];
    const userId = Array.isArray(userIdHeader) ? userIdHeader[0] : userIdHeader;

    if (!userId) {
      return null;
    }

    const user = await this.usersRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException({
        code: 'INVALID_DEV_ACTOR',
        message: 'The development actor header did not match an active user.',
      });
    }

    const overrideHeader = request.headers['x-dev-admin-override'];
    const isAdminSupportOverride =
      user.role === UserRole.ADMIN && this.parseBooleanHeader(overrideHeader);

    const actingAsHeader = request.headers['x-dev-acting-as-user-id'];
    const actingAsUserId = Array.isArray(actingAsHeader) ? actingAsHeader[0] : actingAsHeader;

    if (actingAsUserId && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException({
        code: 'ADMIN_OVERRIDE_REQUIRED',
        message: 'Only admins can impersonate another user in development mode.',
      });
    }

    return {
      actingAsUserId: actingAsUserId ?? null,
      id: user.id,
      isAdminSupportOverride,
      role: user.role,
    };
  }

  private parseBooleanHeader(value: string | string[] | undefined): boolean {
    const headerValue = Array.isArray(value) ? value[0] : value;

    return headerValue === 'true' || headerValue === '1';
  }

  private getTargetId(params: Record<string, string | string[] | undefined>): string | undefined {
    return this.getRouteParam(params.productId ?? params.id);
  }

  private getRouteParam(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
  }
}
