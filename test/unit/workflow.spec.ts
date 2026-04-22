import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { AuditEntityType } from '../../src/enums/audit-entity-type.enum';
import { ProductStage } from '../../src/enums/product-stage.enum';
import { ProductStatus } from '../../src/enums/product-status.enum';
import { UserRole } from '../../src/enums/user-role.enum';
import { WorkflowTransitionAction } from '../../src/enums/workflow-transition-action.enum';
import { ProductWorkflowController } from '../../src/modules/workflow/controllers/product-workflow.controller';
import { ProductWorkflowService } from '../../src/modules/workflow/services/product-workflow.service';
import { createAuditLogRecord, createGateDecisionRecord, createProductRecord, testIds } from '../helpers/fixtures';

describe('ProductWorkflowController', () => {
  const workflowResult = {
    auditLog: createAuditLogRecord(),
    gateDecision: createGateDecisionRecord(),
    product: createProductRecord({
      status: ProductStatus.IN_REVIEW,
    }),
  };

  const cases = [
    {
      action: WorkflowTransitionAction.SUBMIT,
      method: 'submit',
    },
    {
      action: WorkflowTransitionAction.APPROVE,
      method: 'approve',
    },
    {
      action: WorkflowTransitionAction.REJECT,
      method: 'reject',
    },
    {
      action: WorkflowTransitionAction.REOPEN,
      method: 'reopen',
    },
    {
      action: WorkflowTransitionAction.BLOCK,
      method: 'block',
    },
    {
      action: WorkflowTransitionAction.ARCHIVE,
      method: 'archive',
    },
  ] as const;

  for (const testCase of cases) {
    it(`maps ${testCase.action.toLowerCase()} responses`, async () => {
      const calls: WorkflowTransitionAction[] = [];
      const controller = new ProductWorkflowController({
        transition: async (_id: string, action: WorkflowTransitionAction) => {
          calls.push(action);
          return workflowResult;
        },
      } as never);

      const response = await controller[testCase.method](
        testIds.product,
        {
          comment: 'Ready',
        },
        {
          user: {
            id: testIds.productOwner,
            role: UserRole.PRODUCT_MANAGER,
          },
        } as never,
      );

      assert.equal(calls[0], testCase.action);
      assert.deepEqual(response, {
        auditLog: workflowResult.auditLog,
        gateDecision: workflowResult.gateDecision,
        product: workflowResult.product,
      });
    });
  }
});

describe('ProductWorkflowService', () => {
  const actor = {
    id: testIds.productOwner,
    role: UserRole.PRODUCT_MANAGER,
  };

  function createService(options?: {
    auditCreate?: (input: { action: WorkflowTransitionAction }) => Promise<unknown>;
    gateCreate?: (input: { outcome: WorkflowTransitionAction }) => Promise<unknown>;
    product?: ReturnType<typeof createProductRecord>;
    productUpdate?: (input: { currentStage: ProductStage; status: ProductStatus }) => Promise<unknown>;
    query?: (text: string) => Promise<{ rows: never[] }>;
    stageOneAssert?: (productId: string) => Promise<void>;
  }): ProductWorkflowService {
    const product = options?.product ?? createProductRecord();

    return new ProductWorkflowService(
      {
        getClient: async () => ({
          query: options?.query ?? (async () => ({ rows: [] })),
          release: () => undefined,
        }),
      } as never,
      {
        findById: async () => product,
        update: async (
          _id: string,
          input: {
            currentStage?: ProductStage;
            status?: ProductStatus;
          },
        ) =>
          (options?.productUpdate?.(input as never) ??
            ({
              ...product,
              currentStage: input.currentStage ?? product.currentStage,
              status: input.status ?? product.status,
            } as const)),
      } as never,
      {
        create:
          options?.gateCreate ??
          (async (input: { outcome: WorkflowTransitionAction }) =>
            createGateDecisionRecord({ outcome: input.outcome })),
      } as never,
      {
        create:
          options?.auditCreate ??
          (async (input: { action: WorkflowTransitionAction }) =>
            createAuditLogRecord({
              action: input.action,
              entityType: AuditEntityType.PRODUCT,
            })),
      } as never,
      {
        assertReadyForGateOne: options?.stageOneAssert ?? (async () => undefined),
      } as never,
    );
  }

  it('submits draft and rejected products into review', async () => {
    const beginCommitQueries: string[] = [];
    const service = createService({
      product: createProductRecord({
        status: ProductStatus.DRAFT,
      }),
      query: async (text: string) => {
        beginCommitQueries.push(text);
        return { rows: [] };
      },
    });

    const submitResult = await service.transition(
      testIds.product,
      WorkflowTransitionAction.SUBMIT,
      actor,
      {
        comment: 'Ready for Gate 1',
      },
    );

    assert.equal(submitResult.product.status, ProductStatus.IN_REVIEW);
    assert.equal(submitResult.gateDecision.outcome, WorkflowTransitionAction.SUBMIT);
    assert.equal(submitResult.auditLog.action, WorkflowTransitionAction.SUBMIT);
    assert.deepEqual(beginCommitQueries, ['BEGIN', 'COMMIT']);

    const rejectedService = createService({
      product: createProductRecord({
        status: ProductStatus.REJECTED,
      }),
    });

    const rejectedResult = await rejectedService.transition(
      testIds.product,
      WorkflowTransitionAction.SUBMIT,
      actor,
      {},
    );

    assert.equal(rejectedResult.product.status, ProductStatus.IN_REVIEW);
  });

  it('approves in-review products into the next stage or terminal approval', async () => {
    const stageOneService = createService({
      product: createProductRecord({
        currentStage: ProductStage.STAGE_1,
        status: ProductStatus.IN_REVIEW,
      }),
    });
    const stageOneResult = await stageOneService.transition(
      testIds.product,
      WorkflowTransitionAction.APPROVE,
      {
        id: testIds.headOfProduct,
        role: UserRole.HEAD_OF_PRODUCT,
      },
      {},
    );

    assert.equal(stageOneResult.product.currentStage, ProductStage.STAGE_2);
    assert.equal(stageOneResult.product.status, ProductStatus.DRAFT);

    const stageSixService = createService({
      product: createProductRecord({
        currentStage: ProductStage.STAGE_6,
        status: ProductStatus.IN_REVIEW,
      }),
    });
    const stageSixResult = await stageSixService.transition(
      testIds.product,
      WorkflowTransitionAction.APPROVE,
      {
        id: testIds.headOfProduct,
        role: UserRole.COO_EXECUTIVE_APPROVER,
      },
      {},
    );

    assert.equal(stageSixResult.product.currentStage, ProductStage.STAGE_6);
    assert.equal(stageSixResult.product.status, ProductStatus.APPROVED);
  });

  it('requires Stage 1 completion before submit or approve can proceed', async () => {
    const incompleteError = new BadRequestException({
      code: 'STAGE_ONE_REQUIREMENTS_INCOMPLETE',
      message: 'Stage 1 is incomplete and cannot progress through Gate 1.',
    });

    await assert.rejects(
      createService({
        product: createProductRecord({
          currentStage: ProductStage.STAGE_1,
          status: ProductStatus.DRAFT,
        }),
        stageOneAssert: async () => {
          throw incompleteError;
        },
      }).transition(testIds.product, WorkflowTransitionAction.SUBMIT, actor, {}),
      incompleteError,
    );

    await assert.rejects(
      createService({
        product: createProductRecord({
          currentStage: ProductStage.STAGE_1,
          status: ProductStatus.IN_REVIEW,
        }),
        stageOneAssert: async () => {
          throw incompleteError;
        },
      }).transition(
        testIds.product,
        WorkflowTransitionAction.APPROVE,
        {
          id: testIds.headOfProduct,
          role: UserRole.HEAD_OF_PRODUCT,
        },
        {},
      ),
      incompleteError,
    );
  });

  it('supports reject, reopen, block, and archive transitions', async () => {
    const rejectResult = await createService({
      product: createProductRecord({
        status: ProductStatus.IN_REVIEW,
      }),
    }).transition(testIds.product, WorkflowTransitionAction.REJECT, actor, {});
    assert.equal(rejectResult.product.status, ProductStatus.REJECTED);

    const reopenResult = await createService({
      product: createProductRecord({
        status: ProductStatus.BLOCKED,
      }),
    }).transition(testIds.product, WorkflowTransitionAction.REOPEN, actor, {});
    assert.equal(reopenResult.product.status, ProductStatus.DRAFT);

    const blockResult = await createService({
      product: createProductRecord({
        status: ProductStatus.DRAFT,
      }),
    }).transition(testIds.product, WorkflowTransitionAction.BLOCK, actor, {});
    assert.equal(blockResult.product.status, ProductStatus.BLOCKED);

    const archiveResult = await createService({
      product: createProductRecord({
        status: ProductStatus.APPROVED,
      }),
    }).transition(testIds.product, WorkflowTransitionAction.ARCHIVE, actor, {});
    assert.equal(archiveResult.product.status, ProductStatus.ARCHIVED);
  });

  it('rejects invalid transitions and missing products', async () => {
    const invalidTransitionService = createService({
      product: createProductRecord({
        status: ProductStatus.DRAFT,
      }),
    });

    await assert.rejects(
      invalidTransitionService.transition(
        testIds.product,
        WorkflowTransitionAction.APPROVE,
        actor,
        {},
      ),
      BadRequestException,
    );

    const missingProductService = new ProductWorkflowService(
      {
        getClient: async () => ({
          query: async () => ({ rows: [] }),
          release: () => undefined,
        }),
      } as never,
      {
        findById: async () => null,
      } as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(
      missingProductService.transition(testIds.product, WorkflowTransitionAction.SUBMIT, actor, {}),
      NotFoundException,
    );
  });

  it('requires admin override reasons and rolls back failed transactions', async () => {
    const transactionQueries: string[] = [];
    const service = createService({
      product: createProductRecord({
        status: ProductStatus.DRAFT,
      }),
      gateCreate: async () => {
        throw new Error('gate failed');
      },
      query: async (text: string) => {
        transactionQueries.push(text);
        return { rows: [] };
      },
    });

    await assert.rejects(
      service.transition(
        testIds.product,
        WorkflowTransitionAction.SUBMIT,
        {
          id: testIds.admin,
          isAdminSupportOverride: true,
          role: UserRole.ADMIN,
        },
        {},
      ),
      BadRequestException,
    );

    await assert.rejects(
      service.transition(
        testIds.product,
        WorkflowTransitionAction.SUBMIT,
        actor,
        {
          comment: 'Ready',
          overrideReason: 'N/A',
        },
      ),
      Error,
    );

    assert.deepEqual(transactionQueries, ['BEGIN', 'ROLLBACK']);
  });
});
