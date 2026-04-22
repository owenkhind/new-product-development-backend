import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { UnauthorizedException } from '@nestjs/common';

import { PolicyResource } from '../enums/policy-resource.enum';
import { StageAction } from '../enums/stage-action.enum';
import { UserRole } from '../enums/user-role.enum';
import { PoliciesGuard } from './policies.guard';

describe('PoliciesGuard', () => {
  it('hydrates request.user from development headers before checking policy', async () => {
    const request = {
      headers: {
        'x-dev-user-id': 'user-1',
      },
      params: {},
      user: undefined,
    };
    const guard = new PoliciesGuard(
      {
        getAllAndOverride: () => ({
          action: StageAction.VIEW,
          resource: PolicyResource.PRODUCTS,
        }),
      } as never,
      {
        get: () => 'development',
      } as never,
      {
        findById: async () => ({
          id: 'user-1',
          isActive: true,
          role: UserRole.PRODUCT_MANAGER,
        }),
      } as never,
      {
        assertAuthorized: async () => undefined,
      } as never,
    );

    const canActivate = await guard.canActivate({
      getClass: () => undefined,
      getHandler: () => undefined,
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as never);

    assert.equal(canActivate, true);
    assert.deepEqual(request.user, {
      actingAsUserId: null,
      id: 'user-1',
      isAdminSupportOverride: false,
      role: UserRole.PRODUCT_MANAGER,
    });
  });

  it('rejects protected routes when no actor is available', async () => {
    const request = {
      headers: {},
      params: {},
    };
    const guard = new PoliciesGuard(
      {
        getAllAndOverride: () => ({
          action: StageAction.VIEW,
          resource: PolicyResource.USERS,
        }),
      } as never,
      {
        get: () => 'development',
      } as never,
      {
        findById: async () => null,
      } as never,
      {
        assertAuthorized: async () => undefined,
      } as never,
    );

    await assert.rejects(
      guard.canActivate({
        getClass: () => undefined,
        getHandler: () => undefined,
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as never),
      UnauthorizedException,
    );
  });
});
