import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { PoliciesGuard } from '../../src/guards/policies.guard';
import { AuthorizationPolicyService } from '../../src/modules/authorization/services/authorization-policy.service';
import { GateWorkflowController } from '../../src/modules/workflow/controllers/gate-workflow.controller';
import { ProductWorkflowController } from '../../src/modules/workflow/controllers/product-workflow.controller';
import { GateThreeReviewsService } from '../../src/modules/workflow/services/gate-three-reviews.service';
import { GateTwoReviewsService } from '../../src/modules/workflow/services/gate-two-reviews.service';
import { GateWorkflowService } from '../../src/modules/workflow/services/gate-workflow.service';
import { ProductWorkflowService } from '../../src/modules/workflow/services/product-workflow.service';
import { UsersRepository } from '../../src/modules/users/repositories/users.repository';
import { WorkflowTransitionRequestDto } from '../../src/modules/workflow/dto/workflow-transition-request.dto';
import {
  createAuditLogRecord,
  createGateDecisionRecord,
  createGateThreeReviewRecord,
  createGateTwoReviewRecord,
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
  let productWorkflowController: ProductWorkflowController;
  let gateWorkflowController: GateWorkflowController;
  let guard: PoliciesGuard;

  const productManager = createUserRecord({
    id: testIds.productOwner,
  });
  const workflowResult = {
    auditLog: createAuditLogRecord(),
    product: createProductRecord(),
  };
  const gateWorkflowResult = {
    auditLog: createAuditLogRecord(),
    gateDecision: createGateDecisionRecord(),
    product: createProductRecord(),
  };
  const gateTwoReviewResult = {
    auditLog: createAuditLogRecord(),
    review: createGateTwoReviewRecord(),
  };
  const gateThreeReviewResult = {
    auditLog: createAuditLogRecord(),
    review: createGateThreeReviewRecord(),
  };

  before(async () => {
    const setup = await createHttpTestApp({
      controllers: [ProductWorkflowController, GateWorkflowController],
      providers: [
        PoliciesGuard,
        {
          provide: ProductWorkflowService,
          useValue: {
            transition: async () => workflowResult,
          },
        },
        {
          provide: GateWorkflowService,
          useValue: {
            transition: async () => gateWorkflowResult,
          },
        },
        {
          provide: GateTwoReviewsService,
          useValue: {
            recordReview: async () => gateTwoReviewResult,
          },
        },
        {
          provide: GateThreeReviewsService,
          useValue: {
            recordReview: async () => gateThreeReviewResult,
          },
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
    productWorkflowController = new ProductWorkflowController({
      transition: async () => workflowResult,
    } as never);
    gateWorkflowController = new GateWorkflowController(
      {
        transition: async () => gateWorkflowResult,
      } as never,
      {
        recordReview: async () => gateTwoReviewResult,
      } as never,
      {
        recordReview: async () => gateThreeReviewResult,
      } as never,
    );
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
          controllerClass: gateWorkflowController,
          handlerName: 'submitGateOne',
          request: {
            headers: {},
            params: {
              productId: testIds.product,
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

  it('executes generic workflow and gate workflow transitions through the wired module', async () => {
    await assert.doesNotReject(
      guard.canActivate(
        createExecutionContext({
          controllerClass: gateWorkflowController,
          handlerName: 'submitGateOne',
          request: {
            headers: {
              'x-dev-user-id': testIds.productOwner,
            },
            params: {
              productId: testIds.product,
            },
          },
        }),
      ),
    );

    const reopenResponse = await productWorkflowController.reopen(
      testIds.product,
      {
        comment: 'Reopen',
      },
      {
        user: {
          id: testIds.productOwner,
          role: productManager.role,
        },
      } as never,
    );

    const approveResponse = await gateWorkflowController.approveGateOne(
      testIds.product,
      {},
      {
        user: {
          id: testIds.headOfProduct,
          role: productManager.role,
        },
      } as never,
    );

    const financeResponse = await gateWorkflowController.confirmGateTwoFinance(
      testIds.product,
      {
        comment: 'Finance confirmed',
      },
      {
        user: {
          id: testIds.financeOwner,
          role: productManager.role,
        },
      } as never,
    );
    const marketingResponse = await gateWorkflowController.reviewGateThreeMarketing(
      testIds.product,
      {
        comment: 'Marketing reviewed',
      },
      {
        user: {
          id: testIds.marketingOwner,
          role: productManager.role,
        },
      } as never,
    );

    assert.equal(reopenResponse.auditLog.id, workflowResult.auditLog.id);
    assert.equal(approveResponse.gateDecision.id, gateWorkflowResult.gateDecision.id);
    assert.equal(financeResponse.review.productId, gateTwoReviewResult.review.productId);
    assert.equal(marketingResponse.review.productId, gateThreeReviewResult.review.productId);
  });
});
