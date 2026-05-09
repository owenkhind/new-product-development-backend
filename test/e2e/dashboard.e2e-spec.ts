import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { PolicyResource } from '../../src/enums/policy-resource.enum';
import { StageAction } from '../../src/enums/stage-action.enum';
import { UserRole } from '../../src/enums/user-role.enum';
import { PoliciesGuard } from '../../src/guards/policies.guard';
import { AuthorizationPolicyService } from '../../src/modules/authorization/services/authorization-policy.service';
import { DashboardController } from '../../src/modules/dashboard/controllers/dashboard.controller';
import { DashboardService } from '../../src/modules/dashboard/services/dashboard.service';
import { UsersRepository } from '../../src/modules/users/repositories/users.repository';
import { createUserRecord, testIds } from '../helpers/fixtures';
import {
  createExecutionContext,
  createHttpTestApp,
} from '../helpers/create-http-test-app';

describe('Dashboard module wiring (e2e)', () => {
  let app: Awaited<ReturnType<typeof createHttpTestApp>>['app'];
  let controller: DashboardController;
  let guard: PoliciesGuard;
  const productManager = createUserRecord({
    id: testIds.productOwner,
    role: UserRole.PRODUCT_MANAGER,
  });
  const dashboardResult = {
    gateReviews: [],
    portfolioMix: {
      aClass: 0,
      bClass: 100,
      cClass: 0,
    },
    products: [
      {
        blockers: [],
        department: 'Product',
        due: 'In review',
        health: 'watch' as const,
        id: testIds.product,
        myWork: true,
        name: 'Glass Blender Plus',
        owner: 'Aina Product',
        progress: 62,
        stage: 'Stage 1' as const,
        summary: 'Prepare Gate 1',
        tags: ['Stage 1', 'In Review'],
      },
    ],
    stageHealth: [
      {
        completion: 62,
        count: 1,
        description: 'T1-T3, ART score, market proof',
        stage: 'Stage 1' as const,
        status: 'active' as const,
        title: 'Spot & Screen',
      },
    ],
    summary: {
      activeProducts: 1,
      averageCycleDays: 3,
      blockedActions: 0,
      gateQueue: 0,
      readyForGate: 0,
    },
  };

  before(async () => {
    const dashboardService = {
      getDashboard: async () => dashboardResult,
    };
    const setup = await createHttpTestApp({
      controllers: [DashboardController],
      providers: [
        PoliciesGuard,
        {
          provide: DashboardService,
          useValue: dashboardService,
        },
        {
          provide: UsersRepository,
          useValue: {
            findById: async (id: string) =>
              id === testIds.productOwner ? productManager : null,
          },
        },
        {
          provide: AuthorizationPolicyService,
          useValue: {
            assertAuthorized: async (input: {
              action: StageAction;
              resource: PolicyResource;
            }) => {
              assert.equal(input.resource, PolicyResource.PRODUCTS);
              assert.equal(input.action, StageAction.VIEW);
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: () => 'test',
          },
        },
      ],
    });

    app = setup.app;
    controller = new DashboardController(dashboardService as never);
    guard = new PoliciesGuard(
      new Reflector(),
      {
        get: () => 'test',
      } as never,
      {
        findById: async (id: string) =>
          id === testIds.productOwner ? productManager : null,
      } as never,
      {
        assertAuthorized: async () => undefined,
      } as never,
    );
  });

  after(async () => {
    await app.close();
  });

  it('requires an authenticated actor and returns dashboard aggregates', async () => {
    await assert.rejects(
      guard.canActivate(
        createExecutionContext({
          controllerClass: controller,
          handlerName: 'getDashboard',
          request: {
            headers: {},
            params: {},
          },
        }),
      ),
    );

    await assert.doesNotReject(
      guard.canActivate(
        createExecutionContext({
          controllerClass: controller,
          handlerName: 'getDashboard',
          request: {
            headers: {
              'x-dev-user-id': testIds.productOwner,
            },
            params: {},
          },
        }),
      ),
    );

    const response = await controller.getDashboard({
      user: {
        id: testIds.productOwner,
        role: UserRole.PRODUCT_MANAGER,
      },
    } as never);

    assert.equal(response.summary.activeProducts, 1);
    assert.equal(response.products[0]?.name, 'Glass Blender Plus');
  });
});
