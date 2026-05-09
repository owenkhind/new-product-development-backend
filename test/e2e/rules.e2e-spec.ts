import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { PolicyResource } from '../../src/enums/policy-resource.enum';
import { StageAction } from '../../src/enums/stage-action.enum';
import { UserRole } from '../../src/enums/user-role.enum';
import { PoliciesGuard } from '../../src/guards/policies.guard';
import { AuthorizationPolicyService } from '../../src/modules/authorization/services/authorization-policy.service';
import { RulesController } from '../../src/modules/rules/controllers/rules.controller';
import { RulesService } from '../../src/modules/rules/services/rules.service';
import { UsersRepository } from '../../src/modules/users/repositories/users.repository';
import { createUserRecord, testIds } from '../helpers/fixtures';
import {
  createExecutionContext,
  createHttpTestApp,
} from '../helpers/create-http-test-app';

describe('Rules module wiring (e2e)', () => {
  let app: Awaited<ReturnType<typeof createHttpTestApp>>['app'];
  let controller: RulesController;
  let guard: PoliciesGuard;
  const financeOwner = createUserRecord({
    id: testIds.financeOwner,
    role: UserRole.FINANCE_MANAGER,
  });
  const rulesDashboard = {
    gpFloors: [
      {
        channel: 'ITO Retailers',
        floorPercent: 22,
        ownerRole: 'Finance Manager',
        stage: 'Stage 3 - T7',
        status: 'ACTIVE' as const,
      },
    ],
    metrics: [
      { label: 'Backend policy rules', tone: 'blue' as const, value: 1 },
    ],
    rules: [
      {
        category: 'GP_FLOOR' as const,
        condition: 'Projected GP should stay above floor.',
        description: 'Finance resolves exceptions.',
        id: 'backend-policy-stage-3-gp-floor',
        lastChangedAt: 'Backend policy',
        ownerRole: 'Finance Manager',
        outcome: 'Below-floor channels surface as finance exceptions.',
        severity: 'HIGH' as const,
        stage: 'Stage 3',
        status: 'ACTIVE' as const,
        title: 'Stage 3 GP floor',
      },
    ],
  };

  before(async () => {
    const rulesService = {
      getDashboard: () => rulesDashboard,
    };
    const setup = await createHttpTestApp({
      controllers: [RulesController],
      providers: [
        PoliciesGuard,
        {
          provide: RulesService,
          useValue: rulesService,
        },
        {
          provide: UsersRepository,
          useValue: {
            findById: async (id: string) =>
              id === testIds.financeOwner ? financeOwner : null,
          },
        },
        {
          provide: AuthorizationPolicyService,
          useValue: {
            assertAuthorized: async (input: {
              action: StageAction;
              resource: PolicyResource;
            }) => {
              assert.equal(input.resource, PolicyResource.RULES);
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
    controller = new RulesController(rulesService as never);
    guard = new PoliciesGuard(
      new Reflector(),
      {
        get: () => 'test',
      } as never,
      {
        findById: async (id: string) =>
          id === testIds.financeOwner ? financeOwner : null,
      } as never,
      {
        assertAuthorized: async () => undefined,
      } as never,
    );
  });

  after(async () => {
    await app.close();
  });

  it('requires an authenticated policy actor and returns rules data', async () => {
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
              'x-dev-user-id': testIds.financeOwner,
            },
            params: {},
          },
        }),
      ),
    );

    const response = controller.getDashboard();

    assert.equal(response.gpFloors[0]?.floorPercent, 22);
    assert.equal(response.rules[0]?.id, 'backend-policy-stage-3-gp-floor');
  });
});
