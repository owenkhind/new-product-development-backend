import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

import { PoliciesGuard } from '../../src/guards/policies.guard';
import { PolicyResource } from '../../src/enums/policy-resource.enum';
import { ProductStage } from '../../src/enums/product-stage.enum';
import { ProductStatus } from '../../src/enums/product-status.enum';
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
        findById: async () =>
          createProductRecord({
            currentStage: ProductStage.STAGE_3,
            status: ProductStatus.REJECTED,
          }),
      } as never,
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.REOPEN,
        actor: {
          id: testIds.commercialOwner,
          role: UserRole.GM_COMMERCIAL_OWNER,
        },
        resource: PolicyResource.WORKFLOW,
        targetId: product.id,
      }),
    );

    await assert.rejects(
      service.assertAuthorized({
        action: StageAction.REOPEN,
        actor: {
          id: testIds.productOwner,
          role: UserRole.PRODUCT_MANAGER,
        },
        resource: PolicyResource.WORKFLOW,
        targetId: product.id,
      }),
      ForbiddenException,
    );
  });

  it('allows Gate 1, Gate 2, and Gate 3 actors and rejects invalid ones', async () => {
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
        resource: PolicyResource.GATE_WORKFLOW,
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
        resource: PolicyResource.GATE_WORKFLOW,
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
        resource: PolicyResource.GATE_WORKFLOW,
        targetId: product.id,
      }),
      ForbiddenException,
    );

    const stageTwoService = new AuthorizationPolicyService(
      {} as never,
      {
        findById: async () =>
          createProductRecord({
            currentStage: ProductStage.STAGE_2,
          }),
      } as never,
    );

    await assert.doesNotReject(
      stageTwoService.assertAuthorized({
        action: StageAction.APPROVE,
        actor: {
          id: testIds.cooApprover,
          role: UserRole.COO_EXECUTIVE_APPROVER,
        },
        resource: PolicyResource.GATE_WORKFLOW,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      stageTwoService.assertAuthorized({
        action: StageAction.KILL,
        actor: {
          id: testIds.cooApprover,
          role: UserRole.COO_EXECUTIVE_APPROVER,
        },
        resource: PolicyResource.GATE_WORKFLOW,
        targetId: product.id,
      }),
    );

    const stageThreeService = new AuthorizationPolicyService(
      {} as never,
      {
        findById: async () =>
          createProductRecord({
            currentStage: ProductStage.STAGE_3,
          }),
      } as never,
    );

    await assert.doesNotReject(
      stageThreeService.assertAuthorized({
        action: StageAction.APPROVE,
        actor: {
          id: testIds.cooApprover,
          role: UserRole.COO_EXECUTIVE_APPROVER,
        },
        resource: PolicyResource.GATE_WORKFLOW,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      stageThreeService.assertAuthorized({
        action: StageAction.REJECT,
        actor: {
          id: testIds.commercialOwner,
          role: UserRole.GM_COMMERCIAL_OWNER,
        },
        resource: PolicyResource.GATE_WORKFLOW,
        targetId: product.id,
      }),
    );
  });

  it('allows Gate 2 review roles and rejects invalid ones', async () => {
    const service = new AuthorizationPolicyService(
      {} as never,
      {
        findById: async () =>
          createProductRecord({
            currentStage: ProductStage.STAGE_2,
          }),
      } as never,
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.REVIEW,
        actor: {
          id: testIds.qaReviewer,
          role: UserRole.QA_TSD_REVIEWER,
        },
        resource: PolicyResource.GATE_TWO_REVIEWS,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.CONFIRM,
        actor: {
          id: testIds.financeOwner,
          role: UserRole.FINANCE_MANAGER,
        },
        resource: PolicyResource.GATE_TWO_REVIEWS,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.APPROVE,
        actor: {
          id: testIds.commercialOwner,
          role: UserRole.GM_COMMERCIAL_OWNER,
        },
        resource: PolicyResource.GATE_TWO_REVIEWS,
        targetId: product.id,
      }),
    );

    await assert.rejects(
      service.assertAuthorized({
        action: StageAction.REVIEW,
        actor: {
          id: testIds.productOwner,
          role: UserRole.PRODUCT_MANAGER,
        },
        resource: PolicyResource.GATE_TWO_REVIEWS,
        targetId: product.id,
      }),
      ForbiddenException,
    );
  });

  it('allows assigned Gate 3 review roles and rejects invalid ones', async () => {
    const service = new AuthorizationPolicyService(
      {} as never,
      {
        findById: async () =>
          createProductRecord({
            currentStage: ProductStage.STAGE_3,
          }),
      } as never,
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.CONFIRM,
        actor: {
          id: testIds.financeOwner,
          role: UserRole.FINANCE_MANAGER,
        },
        resource: PolicyResource.GATE_THREE_REVIEWS,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.REVIEW,
        actor: {
          id: testIds.marketingOwner,
          role: UserRole.MARKETING_GTM_OWNER,
        },
        resource: PolicyResource.GATE_THREE_REVIEWS,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.APPROVE,
        actor: {
          id: testIds.commercialOwner,
          role: UserRole.GM_COMMERCIAL_OWNER,
        },
        resource: PolicyResource.GATE_THREE_REVIEWS,
        targetId: product.id,
      }),
    );

    await assert.rejects(
      service.assertAuthorized({
        action: StageAction.REVIEW,
        actor: {
          id: testIds.productOwner,
          role: UserRole.PRODUCT_MANAGER,
        },
        resource: PolicyResource.GATE_THREE_REVIEWS,
        targetId: product.id,
      }),
      ForbiddenException,
    );
  });

  it('tightens Stage 4 template editing by feature responsibility', async () => {
    const service = new AuthorizationPolicyService(
      {} as never,
      {
        findById: async () =>
          createProductRecord({
            currentStage: ProductStage.STAGE_4,
          }),
      } as never,
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: testIds.clusterManager,
          role: UserRole.CLUSTER_MANAGER,
        },
        resource: PolicyResource.LAUNCH_CONFIRMATIONS,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: testIds.marketingOwner,
          role: UserRole.MARKETING_GTM_OWNER,
        },
        resource: PolicyResource.LAUNCH_CONFIRMATIONS,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: testIds.clusterManager,
          role: UserRole.CLUSTER_MANAGER,
        },
        resource: PolicyResource.SELL_IN_REPORTS,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: testIds.sourcingManager,
          role: UserRole.SPDM_PRODUCT_OPS,
        },
        resource: PolicyResource.SELL_IN_REPORTS,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: testIds.marketingOwner,
          role: UserRole.MARKETING_GTM_OWNER,
        },
        resource: PolicyResource.WEEKLY_FEEDBACK_LOGS,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: testIds.qaReviewer,
          role: UserRole.KD_AFTER_SALES,
        },
        resource: PolicyResource.WEEKLY_FEEDBACK_LOGS,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: testIds.commercialOwner,
          role: UserRole.GM_COMMERCIAL_OWNER,
        },
        resource: PolicyResource.DAY_30_REVIEWS,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: testIds.financeOwner,
          role: UserRole.FINANCE_MANAGER,
        },
        resource: PolicyResource.DAY_30_REVIEWS,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: testIds.cooApprover,
          role: UserRole.COO_EXECUTIVE_APPROVER,
        },
        resource: PolicyResource.DAY_30_REVIEWS,
        targetId: product.id,
      }),
    );
  });

  it('rejects wrong-role and wrong-stage Stage 4 template edits', async () => {
    const stageFourService = new AuthorizationPolicyService(
      {} as never,
      {
        findById: async () =>
          createProductRecord({
            currentStage: ProductStage.STAGE_4,
          }),
      } as never,
    );

    await assert.rejects(
      stageFourService.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: testIds.productOwner,
          role: UserRole.PRODUCT_MANAGER,
        },
        resource: PolicyResource.LAUNCH_CONFIRMATIONS,
        targetId: product.id,
      }),
      ForbiddenException,
    );

    await assert.rejects(
      stageFourService.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: testIds.financeOwner,
          role: UserRole.FINANCE_MANAGER,
        },
        resource: PolicyResource.WEEKLY_FEEDBACK_LOGS,
        targetId: product.id,
      }),
      ForbiddenException,
    );

    const wrongStageService = new AuthorizationPolicyService(
      {} as never,
      {
        findById: async () =>
          createProductRecord({
            currentStage: ProductStage.STAGE_3,
          }),
      } as never,
    );

    await assert.rejects(
      wrongStageService.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: testIds.clusterManager,
          role: UserRole.CLUSTER_MANAGER,
        },
        resource: PolicyResource.SELL_IN_REPORTS,
        targetId: product.id,
      }),
      ForbiddenException,
    );
  });

  it('keeps Stage 4 template view access product-scoped', async () => {
    const service = new AuthorizationPolicyService(
      {} as never,
      {
        findById: async () =>
          createProductRecord({
            currentStage: ProductStage.STAGE_4,
          }),
      } as never,
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.VIEW,
        actor: {
          id: testIds.clusterManager,
          role: UserRole.CLUSTER_MANAGER,
        },
        resource: PolicyResource.WEEKLY_FEEDBACK_LOGS,
        targetId: product.id,
      }),
    );

    await assert.rejects(
      service.assertAuthorized({
        action: StageAction.VIEW,
        actor: {
          id: testIds.sourcingManager,
          role: UserRole.SOURCING_MANAGER,
        },
        resource: PolicyResource.DAY_30_REVIEWS,
        targetId: product.id,
      }),
      ForbiddenException,
    );
  });

  it('allows Stage 5 scorecard, recommendation, and portfolio actors', async () => {
    const service = new AuthorizationPolicyService(
      {} as never,
      {
        findById: async () =>
          createProductRecord({
            currentStage: ProductStage.STAGE_5,
          }),
      } as never,
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: testIds.productOwner,
          role: UserRole.PRODUCT_MANAGER,
        },
        resource: PolicyResource.PRODUCT_SCORECARDS,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: testIds.financeOwner,
          role: UserRole.FINANCE_MANAGER,
        },
        resource: PolicyResource.PRODUCT_SCORECARDS,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.CONFIRM,
        actor: {
          id: testIds.commercialOwner,
          role: UserRole.GM_COMMERCIAL_OWNER,
        },
        resource: PolicyResource.REVAMP_EOL_RECOMMENDATIONS,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.APPROVE,
        actor: {
          id: testIds.cooApprover,
          role: UserRole.COO_EXECUTIVE_APPROVER,
        },
        resource: PolicyResource.REVAMP_EOL_RECOMMENDATIONS,
        targetId: product.id,
      }),
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.CREATE,
        actor: {
          id: testIds.financeOwner,
          role: UserRole.FINANCE_MANAGER,
        },
        resource: PolicyResource.PORTFOLIO_UPDATES,
      }),
    );
  });

  it('rejects wrong-role and wrong-stage Stage 5 access', async () => {
    const stageFiveService = new AuthorizationPolicyService(
      {} as never,
      {
        findById: async () =>
          createProductRecord({
            currentStage: ProductStage.STAGE_5,
          }),
      } as never,
    );

    await assert.rejects(
      stageFiveService.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: testIds.clusterManager,
          role: UserRole.CLUSTER_MANAGER,
        },
        resource: PolicyResource.PRODUCT_SCORECARDS,
        targetId: product.id,
      }),
      ForbiddenException,
    );

    await assert.rejects(
      stageFiveService.assertAuthorized({
        action: StageAction.APPROVE,
        actor: {
          id: testIds.commercialOwner,
          role: UserRole.GM_COMMERCIAL_OWNER,
        },
        resource: PolicyResource.REVAMP_EOL_RECOMMENDATIONS,
        targetId: product.id,
      }),
      ForbiddenException,
    );

    await assert.rejects(
      stageFiveService.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: testIds.productOwner,
          role: UserRole.PRODUCT_MANAGER,
        },
        resource: PolicyResource.PORTFOLIO_UPDATES,
      }),
      ForbiddenException,
    );

    const wrongStageService = new AuthorizationPolicyService(
      {} as never,
      {
        findById: async () =>
          createProductRecord({
            currentStage: ProductStage.STAGE_4,
          }),
      } as never,
    );

    await assert.rejects(
      wrongStageService.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: testIds.productOwner,
          role: UserRole.PRODUCT_MANAGER,
        },
        resource: PolicyResource.REVAMP_EOL_RECOMMENDATIONS,
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
