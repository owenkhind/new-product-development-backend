import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { PoliciesGuard } from '../../src/guards/policies.guard';
import { WorkflowTransitionRequestDto } from '../../src/modules/workflow/dto/workflow-transition-request.dto';
import { ProductWorkflowController } from '../../src/modules/workflow/controllers/product-workflow.controller';
import { ProductWorkflowService } from '../../src/modules/workflow/services/product-workflow.service';
import { UsersRepository } from '../../src/modules/users/repositories/users.repository';
import { AuthorizationPolicyService } from '../../src/modules/authorization/services/authorization-policy.service';
import {
  createAuditLogRecord,
  createGateDecisionRecord,
  createProductRecord,
  createUserRecord,
  testIds,
} from '../helpers/fixtures';
import {
  createExecutionContext,
  createHttpTestApp,
  createValidationPipe,
} from '../helpers/create-http-test-app';

describe('Workflow module wiring (e2e)', () => {
  let app: Awaited<ReturnType<typeof createHttpTestApp>>['app'];
  let controller: ProductWorkflowController;
  let guard: PoliciesGuard;

  const productManager = createUserRecord({
    id: testIds.productOwner,
  });
  const workflowResult = {
    auditLog: createAuditLogRecord(),
    gateDecision: createGateDecisionRecord(),
    product: createProductRecord(),
  };
  const workflowService = {
    transition: async () => workflowResult,
  };

  before(async () => {
    const setup = await createHttpTestApp({
      controllers: [ProductWorkflowController],
      providers: [
        PoliciesGuard,
        {
          provide: ProductWorkflowService,
          useValue: workflowService,
        },
        {
          provide: UsersRepository,
          useValue: {
            findById: async (id: string) => (id === testIds.productOwner ? productManager : null),
          },
        },
        {
          provide: AuthorizationPolicyService,
          useValue: {
            assertAuthorized: async () => undefined,
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
    controller = new ProductWorkflowController(workflowService as never);
    guard = new PoliciesGuard(
      new Reflector(),
      {
        get: () => 'test',
      } as never,
      {
        findById: async (id: string) => (id === testIds.productOwner ? productManager : null),
      } as never,
      {
        assertAuthorized: async () => undefined,
      } as never,
    );
  });

  after(async () => {
    await app.close();
  });

  it('rejects unauthenticated workflow requests through the guard', async () => {
    await assert.rejects(
      guard.canActivate(
        createExecutionContext({
          controllerClass: controller,
          handlerName: 'submit',
          request: {
            headers: {},
            params: {
              id: testIds.product,
            },
          },
        }),
      ),
    );
  });

  it('applies workflow validation rules', async () => {
    const pipe = createValidationPipe();

    await assert.rejects(
      pipe.transform(
        {
          comment: 'x'.repeat(1001),
        },
        {
          data: '',
          metatype: WorkflowTransitionRequestDto,
          type: 'body',
        },
      ),
    );
  });

  it('executes submit and approve transitions through the wired module', async () => {
    await assert.doesNotReject(
      guard.canActivate(
        createExecutionContext({
          controllerClass: controller,
          handlerName: 'submit',
          request: {
            headers: {
              'x-dev-user-id': testIds.productOwner,
            },
            params: {
              id: testIds.product,
            },
          },
        }),
      ),
    );

    const submitResponse = await controller.submit(
      testIds.product,
      {
        comment: 'Ready for Gate 1',
      },
      {
        user: {
          id: testIds.productOwner,
          role: productManager.role,
        },
      } as never,
    );

    const approveResponse = await controller.approve(
      testIds.product,
      {},
      {
        user: {
          id: testIds.productOwner,
          role: productManager.role,
        },
      } as never,
    );

    assert.equal(submitResponse.gateDecision.id, workflowResult.gateDecision.id);
    assert.equal(approveResponse.auditLog.id, workflowResult.auditLog.id);
  });
});
