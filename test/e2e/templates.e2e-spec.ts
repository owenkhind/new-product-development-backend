import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { PolicyResource } from '../../src/enums/policy-resource.enum';
import { ProductStage } from '../../src/enums/product-stage.enum';
import { StageAction } from '../../src/enums/stage-action.enum';
import { UserRole } from '../../src/enums/user-role.enum';
import { PoliciesGuard } from '../../src/guards/policies.guard';
import { AuthorizationPolicyService } from '../../src/modules/authorization/services/authorization-policy.service';
import { TemplatesController } from '../../src/modules/templates/controllers/templates.controller';
import { TemplateLibraryService } from '../../src/modules/templates/services/template-library.service';
import { UsersRepository } from '../../src/modules/users/repositories/users.repository';
import { createUserRecord, testIds } from '../helpers/fixtures';
import {
  createExecutionContext,
  createHttpTestApp,
} from '../helpers/create-http-test-app';

describe('Templates module wiring (e2e)', () => {
  let app: Awaited<ReturnType<typeof createHttpTestApp>>['app'];
  let controller: TemplatesController;
  let guard: PoliciesGuard;
  const productOwner = createUserRecord({
    id: testIds.productOwner,
    role: UserRole.PRODUCT_MANAGER,
  });
  const libraryResult = {
    metrics: [
      {
        label: 'Lifecycle templates',
        tone: 'blue' as const,
        value: 17,
      },
    ],
    stageSummaries: [
      {
        blockedCount: 0,
        completionPercent: 80,
        label: 'Stage 1 - Register / Spot & Screen',
        stage: ProductStage.STAGE_1,
        templateCount: 3,
      },
    ],
    templates: [
      {
        completionPercent: 80,
        description: 'Capture the product opportunity.',
        id: 'T1',
        lastUpdated: '2026-04-30',
        ownerRole: 'Product' as const,
        requiredForGate: 'Gate 1',
        stage: ProductStage.STAGE_1,
        status: 'IN_REVIEW' as const,
        title: 'Opportunity Brief',
      },
    ],
  };

  before(async () => {
    const templateLibraryService = {
      getDashboard: async () => libraryResult,
    };
    const setup = await createHttpTestApp({
      controllers: [TemplatesController],
      providers: [
        PoliciesGuard,
        {
          provide: TemplateLibraryService,
          useValue: templateLibraryService,
        },
        {
          provide: UsersRepository,
          useValue: {
            findById: async (id: string) =>
              id === testIds.productOwner ? productOwner : null,
          },
        },
        {
          provide: AuthorizationPolicyService,
          useValue: {
            assertAuthorized: async (input: {
              action: StageAction;
              resource: PolicyResource;
            }) => {
              assert.equal(input.resource, PolicyResource.TEMPLATES);
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
    controller = new TemplatesController(templateLibraryService as never);
    guard = new PoliciesGuard(
      new Reflector(),
      {
        get: () => 'test',
      } as never,
      {
        findById: async (id: string) =>
          id === testIds.productOwner ? productOwner : null,
      } as never,
      {
        assertAuthorized: async () => undefined,
      } as never,
    );
  });

  after(async () => {
    await app.close();
  });

  it('requires an authenticated actor and returns the template library', async () => {
    await assert.rejects(
      guard.canActivate(
        createExecutionContext({
          controllerClass: controller,
          handlerName: 'getLibrary',
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
          handlerName: 'getLibrary',
          request: {
            headers: {
              'x-dev-user-id': testIds.productOwner,
            },
            params: {},
          },
        }),
      ),
    );

    const response = await controller.getLibrary();

    assert.equal(response.metrics[0]?.value, 17);
    assert.equal(response.templates[0]?.id, 'T1');
  });
});
