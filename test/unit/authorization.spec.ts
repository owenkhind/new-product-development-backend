import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

import { PoliciesGuard } from '../../src/guards/policies.guard';
import { PolicyResource } from '../../src/enums/policy-resource.enum';
import { StageAction } from '../../src/enums/stage-action.enum';
import { UserRole } from '../../src/enums/user-role.enum';
import { AuthorizationPolicyService } from '../../src/modules/authorization/services/authorization-policy.service';
import { createProductRecord, testIds } from '../helpers/fixtures';

describe('AuthorizationPolicyService', () => {
  const product = createProductRecord();

  it('lets admins bypass authorization checks', async () => {
    const service = new AuthorizationPolicyService({} as never, {} as never);

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.ARCHIVE,
        actor: {
          id: testIds.admin,
          role: UserRole.ADMIN,
        },
        resource: PolicyResource.WORKFLOW,
        targetId: product.id,
      }),
    );
  });

  it('allows product managers to create products', async () => {
    const service = new AuthorizationPolicyService({} as never, {} as never);

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.CREATE,
        actor: {
          id: testIds.productOwner,
          role: UserRole.PRODUCT_MANAGER,
        },
        resource: PolicyResource.PRODUCTS,
      }),
    );
  });

  it('rejects non-product-managers from creating products', async () => {
    const service = new AuthorizationPolicyService({} as never, {} as never);

    await assert.rejects(
      service.assertAuthorized({
        action: StageAction.CREATE,
        actor: {
          id: testIds.financeOwner,
          role: UserRole.FINANCE_MANAGER,
        },
        resource: PolicyResource.PRODUCTS,
      }),
      ForbiddenException,
    );
  });

  it('allows assigned owners to edit and oversight roles to view products', async () => {
    const service = new AuthorizationPolicyService(
      {} as never,
      {
        findById: async () => product,
      } as never,
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: testIds.financeOwner,
          role: UserRole.FINANCE_MANAGER,
        },
        resource: PolicyResource.PRODUCTS,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.VIEW,
        actor: {
          id: testIds.headOfProduct,
          role: UserRole.HEAD_OF_PRODUCT,
        },
        resource: PolicyResource.PRODUCTS,
        targetId: product.id,
      }),
    );
  });

  it('rejects unassigned product editors', async () => {
    const service = new AuthorizationPolicyService(
      {} as never,
      {
        findById: async () => product,
      } as never,
    );

    await assert.rejects(
      service.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: testIds.admin,
          role: UserRole.FINANCE_MANAGER,
        },
        resource: PolicyResource.PRODUCTS,
        targetId: product.id,
      }),
      ForbiddenException,
    );
  });

  it('allows stage-specific workflow actors and rejects invalid ones', async () => {
    const service = new AuthorizationPolicyService(
      {} as never,
      {
        findById: async () => product,
      } as never,
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.SUBMIT,
        actor: {
          id: testIds.productOwner,
          role: UserRole.PRODUCT_MANAGER,
        },
        resource: PolicyResource.WORKFLOW,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.APPROVE,
        actor: {
          id: testIds.headOfProduct,
          role: UserRole.HEAD_OF_PRODUCT,
        },
        resource: PolicyResource.WORKFLOW,
        targetId: product.id,
      }),
    );

    await assert.rejects(
      service.assertAuthorized({
        action: StageAction.APPROVE,
        actor: {
          id: testIds.commercialOwner,
          role: UserRole.GM_COMMERCIAL_OWNER,
        },
        resource: PolicyResource.WORKFLOW,
        targetId: product.id,
      }),
      ForbiddenException,
    );
  });

  it('allows assigned users to view gate decisions and audit logs', async () => {
    const service = new AuthorizationPolicyService(
      {} as never,
      {
        findById: async () => product,
      } as never,
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.VIEW,
        actor: {
          id: testIds.clusterManager,
          role: UserRole.CLUSTER_MANAGER,
        },
        resource: PolicyResource.GATE_DECISIONS,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.VIEW,
        actor: {
          id: testIds.clusterManager,
          role: UserRole.CLUSTER_MANAGER,
        },
        resource: PolicyResource.AUDIT_LOGS,
        targetId: product.id,
      }),
    );
  });

  it('allows users to view themselves and rejects access to other user records', async () => {
    const service = new AuthorizationPolicyService({} as never, {} as never);

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.VIEW,
        actor: {
          id: testIds.productOwner,
          role: UserRole.PRODUCT_MANAGER,
        },
        resource: PolicyResource.USERS,
        targetId: testIds.productOwner,
      }),
    );

    await assert.rejects(
      service.assertAuthorized({
        action: StageAction.VIEW,
        actor: {
          id: testIds.productOwner,
          role: UserRole.PRODUCT_MANAGER,
        },
        resource: PolicyResource.USERS,
        targetId: testIds.financeOwner,
      }),
      ForbiddenException,
    );
  });
});

describe('PoliciesGuard', () => {
  it('returns true when a route has no authorization rule', async () => {
    const guard = new PoliciesGuard(
      {
        getAllAndOverride: () => undefined,
      } as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const result = await guard.canActivate({
      getClass: () => undefined,
      getHandler: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({
          headers: {},
          params: {},
        }),
      }),
    } as never);

    assert.equal(result, true);
  });

  it('uses an existing request.user and resolves productId route params', async () => {
    const calls: Array<{ targetId?: string }> = [];
    const request = {
      headers: {},
      params: {
        productId: testIds.product,
      },
      user: {
        id: testIds.productOwner,
        role: UserRole.PRODUCT_MANAGER,
      },
    };
    const guard = new PoliciesGuard(
      {
        getAllAndOverride: () => ({
          action: StageAction.VIEW,
          resource: PolicyResource.GATE_DECISIONS,
        }),
      } as never,
      {
        get: () => 'development',
      } as never,
      {} as never,
      {
        assertAuthorized: async (input: { targetId?: string }) => {
          calls.push(input);
        },
      } as never,
    );

    const result = await guard.canActivate({
      getClass: () => undefined,
      getHandler: () => undefined,
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as never);

    assert.equal(result, true);
    assert.equal(calls[0]?.targetId, testIds.product);
  });

  it('hydrates request.user from development headers', async () => {
    const request = {
      headers: {
        'x-dev-user-id': testIds.productOwner,
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
          id: testIds.productOwner,
          isActive: true,
          role: UserRole.PRODUCT_MANAGER,
        }),
      } as never,
      {
        assertAuthorized: async () => undefined,
      } as never,
    );

    await guard.canActivate({
      getClass: () => undefined,
      getHandler: () => undefined,
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as never);

    assert.deepEqual(request.user, {
      actingAsUserId: null,
      id: testIds.productOwner,
      isAdminSupportOverride: false,
      role: UserRole.PRODUCT_MANAGER,
    });
  });

  it('rejects missing actors in production mode', async () => {
    const guard = new PoliciesGuard(
      {
        getAllAndOverride: () => ({
          action: StageAction.VIEW,
          resource: PolicyResource.USERS,
        }),
      } as never,
      {
        get: () => 'production',
      } as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(
      guard.canActivate({
        getClass: () => undefined,
        getHandler: () => undefined,
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
            params: {},
          }),
        }),
      } as never),
      UnauthorizedException,
    );
  });

  it('rejects invalid dev actors and non-admin impersonation', async () => {
    const invalidActorGuard = new PoliciesGuard(
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
      {} as never,
    );

    await assert.rejects(
      invalidActorGuard.canActivate({
        getClass: () => undefined,
        getHandler: () => undefined,
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              'x-dev-user-id': testIds.productOwner,
            },
            params: {},
          }),
        }),
      } as never),
      UnauthorizedException,
    );

    const nonAdminImpersonationGuard = new PoliciesGuard(
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
        findById: async () => ({
          id: testIds.productOwner,
          isActive: true,
          role: UserRole.PRODUCT_MANAGER,
        }),
      } as never,
      {} as never,
    );

    await assert.rejects(
      nonAdminImpersonationGuard.canActivate({
        getClass: () => undefined,
        getHandler: () => undefined,
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {
              'x-dev-acting-as-user-id': testIds.financeOwner,
              'x-dev-user-id': testIds.productOwner,
            },
            params: {},
          }),
        }),
      } as never),
      ForbiddenException,
    );
  });

  it('supports admin override and acting-as headers', async () => {
    const request = {
      headers: {
        'x-dev-acting-as-user-id': testIds.financeOwner,
        'x-dev-admin-override': 'true',
        'x-dev-user-id': testIds.admin,
      },
      params: {},
      user: undefined,
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
        findById: async () => ({
          id: testIds.admin,
          isActive: true,
          role: UserRole.ADMIN,
        }),
      } as never,
      {
        assertAuthorized: async () => undefined,
      } as never,
    );

    await guard.canActivate({
      getClass: () => undefined,
      getHandler: () => undefined,
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as never);

    assert.deepEqual(request.user, {
      actingAsUserId: testIds.financeOwner,
      id: testIds.admin,
      isAdminSupportOverride: true,
      role: UserRole.ADMIN,
    });
  });
});
