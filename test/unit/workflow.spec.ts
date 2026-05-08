import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { AuditAction } from '../../src/enums/audit-action.enum';
import { AuditEntityType } from '../../src/enums/audit-entity-type.enum';
import { ChannelType } from '../../src/enums/channel-type.enum';
import { EolMilestoneStatus } from '../../src/enums/eol-milestone-status.enum';
import { GateDecisionOutcome } from '../../src/enums/gate-decision-outcome.enum';
import { LaunchIssueStatus } from '../../src/enums/launch-issue-status.enum';
import { ProductStage } from '../../src/enums/product-stage.enum';
import { ProductStatus } from '../../src/enums/product-status.enum';
import { RevampEolDecision } from '../../src/enums/revamp-eol-decision.enum';
import { UserRole } from '../../src/enums/user-role.enum';
import { WorkflowTransitionAction } from '../../src/enums/workflow-transition-action.enum';
import { GateWorkflowController } from '../../src/modules/workflow/controllers/gate-workflow.controller';
import { ProductWorkflowController } from '../../src/modules/workflow/controllers/product-workflow.controller';
import { GateTwoReviewsService } from '../../src/modules/workflow/services/gate-two-reviews.service';
import { GateThreeReviewsService } from '../../src/modules/workflow/services/gate-three-reviews.service';
import { GateWorkflowService } from '../../src/modules/workflow/services/gate-workflow.service';
import { ProductWorkflowService } from '../../src/modules/workflow/services/product-workflow.service';
import { StageFiveCompletionService } from '../../src/modules/workflow/services/stage-five-completion.service';
import { StageFourCompletionService } from '../../src/modules/workflow/services/stage-four-completion.service';
import { StageThreeCompletionService } from '../../src/modules/workflow/services/stage-three-completion.service';
import { StageSixCompletionService } from '../../src/modules/workflow/services/stage-six-completion.service';
import { StageTwoCompletionService } from '../../src/modules/workflow/services/stage-two-completion.service';
import {
  createAuditLogRecord,
  createBusinessCaseRecord,
  createClearancePlanRecord,
  createChannelListingPlanRecord,
  createChannelPricingRecord,
  createDay30ReviewRecord,
  createEolExecutionPlanRecord,
  createGateDecisionRecord,
  createGateThreeReviewRecord,
  createGateTwoReviewRecord,
  createGtmPlanRecord,
  createLaunchConfirmationRecord,
  createPortfolioUpdateRecord,
  createProductRecord,
  createProductScorecardRecord,
  createRevampEolRecommendationRecord,
  createSellInReportRecord,
  createSupplierEvaluationRecord,
  createWeeklyFeedbackLogRecord,
  testIds,
} from '../helpers/fixtures';

describe('ProductWorkflowController', () => {
  const workflowResult = {
    auditLog: createAuditLogRecord({
      action: AuditAction.REOPEN,
    }),
    product: createProductRecord({
      status: ProductStatus.DRAFT,
    }),
  };

  const cases = [
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
          comment: 'Handled',
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
    auditCreate?: (input: { action: AuditAction }) => Promise<unknown>;
    product?: ReturnType<typeof createProductRecord> | null;
    productUpdate?: (input: { status: ProductStatus }) => Promise<unknown>;
    query?: (text: string) => Promise<{ rows: never[] }>;
  }): ProductWorkflowService {
    const product =
      options?.product === undefined ? createProductRecord() : options.product;

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
            status?: ProductStatus;
          },
        ) =>
          options?.productUpdate?.({
            status: input.status ?? ProductStatus.DRAFT,
          }) ??
          ({
            ...product,
            status: input.status ?? product?.status,
          } as const),
      } as never,
      {
        create:
          options?.auditCreate ??
          (async (input: { action: AuditAction }) =>
            createAuditLogRecord({
              action: input.action,
              entityType: AuditEntityType.PRODUCT,
            })),
      } as never,
    );
  }

  it('supports reopen, block, and archive transitions with audit logs only', async () => {
    const reopenResult = await createService({
      product: createProductRecord({
        status: ProductStatus.KILLED,
      }),
    }).transition(testIds.product, WorkflowTransitionAction.REOPEN, actor, {});
    assert.equal(reopenResult.product.status, ProductStatus.DRAFT);
    assert.equal(reopenResult.auditLog.action, AuditAction.REOPEN);

    const blockResult = await createService({
      product: createProductRecord({
        status: ProductStatus.DRAFT,
      }),
    }).transition(testIds.product, WorkflowTransitionAction.BLOCK, actor, {});
    assert.equal(blockResult.product.status, ProductStatus.BLOCKED);
    assert.equal(blockResult.auditLog.action, AuditAction.BLOCK);

    const archiveResult = await createService({
      product: createProductRecord({
        status: ProductStatus.REJECTED,
      }),
    }).transition(testIds.product, WorkflowTransitionAction.ARCHIVE, actor, {});
    assert.equal(archiveResult.product.status, ProductStatus.ARCHIVED);
    assert.equal(archiveResult.auditLog.action, AuditAction.ARCHIVE);
  });

  it('rejects invalid generic workflow transitions and missing products', async () => {
    await assert.rejects(
      createService({
        product: createProductRecord({
          status: ProductStatus.DRAFT,
        }),
      }).transition(
        testIds.product,
        WorkflowTransitionAction.REOPEN,
        actor,
        {},
      ),
      BadRequestException,
    );

    await assert.rejects(
      createService({
        product: null,
      }).transition(
        testIds.product,
        WorkflowTransitionAction.ARCHIVE,
        actor,
        {},
      ),
      NotFoundException,
    );
  });

  it('requires admin override reasons and rolls back failed transactions', async () => {
    const queries: string[] = [];
    const service = createService({
      auditCreate: async () => {
        throw new Error('audit failed');
      },
      product: createProductRecord({
        status: ProductStatus.DRAFT,
      }),
      query: async (text: string) => {
        queries.push(text);
        return { rows: [] };
      },
    });

    await assert.rejects(
      service.transition(
        testIds.product,
        WorkflowTransitionAction.BLOCK,
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
        WorkflowTransitionAction.BLOCK,
        {
          id: testIds.admin,
          isAdminSupportOverride: true,
          role: UserRole.ADMIN,
        },
        {
          overrideReason: 'Repairing workflow state',
        },
      ),
      Error,
    );

    assert.deepEqual(queries, ['BEGIN', 'ROLLBACK']);
  });
});

describe('GateWorkflowController', () => {
  const workflowResult = {
    auditLog: createAuditLogRecord({
      action: AuditAction.APPROVE,
    }),
    gateDecision: createGateDecisionRecord({
      outcome: GateDecisionOutcome.APPROVED,
    }),
    product: createProductRecord({
      currentStage: ProductStage.STAGE_2,
    }),
  };
  const reviewResult = {
    auditLog: createAuditLogRecord({
      action: AuditAction.FINANCE_CONFIRMED,
    }),
    review: createGateTwoReviewRecord(),
  };

  it('maps gate transition responses', async () => {
    const controller = new GateWorkflowController(
      {
        transition: async () => workflowResult,
      } as never,
      {
        recordReview: async () => reviewResult,
      } as never,
      {
        recordReview: async () => ({
          auditLog: createAuditLogRecord({
            action: AuditAction.MARKETING_REVIEW_COMPLETED,
          }),
          review: createGateThreeReviewRecord(),
        }),
      } as never,
    );

    const approveResponse = await controller.approveGateOne(
      testIds.product,
      {},
      {
        user: {
          id: testIds.headOfProduct,
          role: UserRole.HEAD_OF_PRODUCT,
        },
      } as never,
    );
    const killResponse = await controller.killGateTwo(testIds.product, {}, {
      user: {
        id: testIds.cooApprover,
        role: UserRole.COO_EXECUTIVE_APPROVER,
      },
    } as never);
    const stageFourResponse = await controller.approveGateFour(
      testIds.product,
      {},
      {
        user: {
          id: testIds.cooApprover,
          role: UserRole.COO_EXECUTIVE_APPROVER,
        },
      } as never,
    );
    const financeResponse = await controller.confirmGateTwoFinance(
      testIds.product,
      {
        comment: 'Finance confirmed',
      },
      {
        user: {
          id: testIds.financeOwner,
          role: UserRole.FINANCE_MANAGER,
        },
      } as never,
    );

    assert.equal(
      approveResponse.gateDecision.id,
      workflowResult.gateDecision.id,
    );
    assert.equal(killResponse.auditLog.id, workflowResult.auditLog.id);
    assert.equal(stageFourResponse.product.id, workflowResult.product.id);
    assert.equal(financeResponse.review.productId, testIds.product);
  });
});

describe('GateWorkflowService', () => {
  function createService(options?: {
    auditCreate?: (input: { action: AuditAction }) => Promise<unknown>;
    gateCreate?: (input: { outcome: GateDecisionOutcome }) => Promise<unknown>;
    product?: ReturnType<typeof createProductRecord> | null;
    productUpdate?: (input: {
      currentStage: ProductStage;
      status: ProductStatus;
    }) => Promise<unknown>;
    query?: (text: string) => Promise<{ rows: never[] }>;
    stageOneAssert?: (productId: string) => Promise<void>;
    stageFiveApproveAssert?: (productId: string) => Promise<void>;
    stageFiveSubmitAssert?: (productId: string) => Promise<void>;
    stageFourApproveAssert?: (productId: string) => Promise<void>;
    stageFourSubmitAssert?: (productId: string) => Promise<void>;
    stageSixApproveAssert?: (productId: string) => Promise<void>;
    stageSixSubmitAssert?: (productId: string) => Promise<void>;
    stageThreeApproveAssert?: (productId: string) => Promise<void>;
    stageThreeSubmitAssert?: (productId: string) => Promise<void>;
    stageTwoApproveAssert?: (productId: string) => Promise<void>;
    stageTwoSubmitAssert?: (productId: string) => Promise<void>;
  }): GateWorkflowService {
    const product =
      options?.product === undefined ? createProductRecord() : options.product;

    return new GateWorkflowService(
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
          options?.productUpdate?.({
            currentStage:
              input.currentStage ??
              product?.currentStage ??
              ProductStage.STAGE_1,
            status: input.status ?? product?.status ?? ProductStatus.DRAFT,
          }) ??
          ({
            ...product,
            currentStage: input.currentStage ?? product?.currentStage,
            status: input.status ?? product?.status,
          } as const),
      } as never,
      {
        create:
          options?.gateCreate ??
          (async (input: { outcome: GateDecisionOutcome }) =>
            createGateDecisionRecord({ outcome: input.outcome })),
      } as never,
      {
        create:
          options?.auditCreate ??
          (async (input: { action: AuditAction }) =>
            createAuditLogRecord({
              action: input.action,
              entityType: AuditEntityType.PRODUCT,
            })),
      } as never,
      {
        assertReadyForGateOne:
          options?.stageOneAssert ?? (async () => undefined),
      } as never,
      {
        assertReadyForGateTwoApproval:
          options?.stageTwoApproveAssert ?? (async () => undefined),
        assertReadyForGateTwoSubmission:
          options?.stageTwoSubmitAssert ?? (async () => undefined),
      } as never,
      {
        assertReadyForGateThreeApproval:
          options?.stageThreeApproveAssert ?? (async () => undefined),
        assertReadyForGateThreeSubmission:
          options?.stageThreeSubmitAssert ?? (async () => undefined),
      } as never,
      {
        assertReadyForStageFourApproval:
          options?.stageFourApproveAssert ?? (async () => undefined),
        assertReadyForStageFourSubmission:
          options?.stageFourSubmitAssert ?? (async () => undefined),
      } as never,
      {
        assertReadyForStageFiveApproval:
          options?.stageFiveApproveAssert ?? (async () => undefined),
        assertReadyForStageFiveSubmission:
          options?.stageFiveSubmitAssert ?? (async () => undefined),
      } as never,
      {
        assertReadyForStageSixApproval:
          options?.stageSixApproveAssert ?? (async () => undefined),
        assertReadyForStageSixSubmission:
          options?.stageSixSubmitAssert ?? (async () => undefined),
      } as never,
    );
  }

  it('handles Gate 1 submit, approve, reject, and kill', async () => {
    const submitResult = await createService({
      product: createProductRecord({
        currentStage: ProductStage.STAGE_1,
        status: ProductStatus.DRAFT,
      }),
    }).transition(
      testIds.product,
      'SUBMIT',
      {
        id: testIds.productOwner,
        role: UserRole.PRODUCT_MANAGER,
      },
      {},
    );
    assert.equal(submitResult.product.status, ProductStatus.IN_REVIEW);
    assert.equal(
      submitResult.gateDecision.outcome,
      GateDecisionOutcome.SUBMITTED,
    );

    const approveResult = await createService({
      product: createProductRecord({
        currentStage: ProductStage.STAGE_1,
        status: ProductStatus.IN_REVIEW,
      }),
    }).transition(
      testIds.product,
      'APPROVE',
      {
        id: testIds.headOfProduct,
        role: UserRole.HEAD_OF_PRODUCT,
      },
      {},
    );
    assert.equal(approveResult.product.currentStage, ProductStage.STAGE_2);
    assert.equal(approveResult.product.status, ProductStatus.DRAFT);

    const rejectResult = await createService({
      product: createProductRecord({
        currentStage: ProductStage.STAGE_1,
        status: ProductStatus.IN_REVIEW,
      }),
    }).transition(
      testIds.product,
      'REJECT',
      {
        id: testIds.headOfProduct,
        role: UserRole.HEAD_OF_PRODUCT,
      },
      {},
    );
    assert.equal(rejectResult.product.status, ProductStatus.REJECTED);

    const killResult = await createService({
      product: createProductRecord({
        currentStage: ProductStage.STAGE_1,
        status: ProductStatus.IN_REVIEW,
      }),
    }).transition(
      testIds.product,
      'KILL',
      {
        id: testIds.headOfProduct,
        role: UserRole.HEAD_OF_PRODUCT,
      },
      {},
    );
    assert.equal(killResult.product.status, ProductStatus.KILLED);
    assert.equal(killResult.auditLog.action, AuditAction.KILL);
  });

  it('enforces Stage 1 and Stage 2 readiness before submit or approve', async () => {
    const stageOneError = new BadRequestException({
      code: 'STAGE_ONE_REQUIREMENTS_INCOMPLETE',
    });

    await assert.rejects(
      createService({
        product: createProductRecord({
          currentStage: ProductStage.STAGE_1,
          status: ProductStatus.DRAFT,
        }),
        stageOneAssert: async () => {
          throw stageOneError;
        },
      }).transition(
        testIds.product,
        'SUBMIT',
        {
          id: testIds.productOwner,
          role: UserRole.PRODUCT_MANAGER,
        },
        {},
      ),
      stageOneError,
    );

    const stageTwoSubmitError = new BadRequestException({
      code: 'STAGE_TWO_SUBMISSION_INCOMPLETE',
    });

    await assert.rejects(
      createService({
        product: createProductRecord({
          currentStage: ProductStage.STAGE_2,
          status: ProductStatus.DRAFT,
        }),
        stageTwoSubmitAssert: async () => {
          throw stageTwoSubmitError;
        },
      }).transition(
        testIds.product,
        'SUBMIT',
        {
          id: testIds.productOwner,
          role: UserRole.PRODUCT_MANAGER,
        },
        {},
      ),
      stageTwoSubmitError,
    );

    const stageTwoApproveError = new BadRequestException({
      code: 'STAGE_TWO_APPROVAL_INCOMPLETE',
    });

    await assert.rejects(
      createService({
        product: createProductRecord({
          currentStage: ProductStage.STAGE_2,
          status: ProductStatus.IN_REVIEW,
        }),
        stageTwoApproveAssert: async () => {
          throw stageTwoApproveError;
        },
      }).transition(
        testIds.product,
        'APPROVE',
        {
          id: testIds.cooApprover,
          role: UserRole.COO_EXECUTIVE_APPROVER,
        },
        {},
      ),
      stageTwoApproveError,
    );
  });

  it('handles Gate 2 approve, reject, and kill', async () => {
    const approveResult = await createService({
      product: createProductRecord({
        currentStage: ProductStage.STAGE_2,
        status: ProductStatus.IN_REVIEW,
      }),
    }).transition(
      testIds.product,
      'APPROVE',
      {
        id: testIds.cooApprover,
        role: UserRole.COO_EXECUTIVE_APPROVER,
      },
      {},
    );
    assert.equal(approveResult.product.currentStage, ProductStage.STAGE_3);
    assert.equal(
      approveResult.gateDecision.outcome,
      GateDecisionOutcome.APPROVED,
    );

    const rejectResult = await createService({
      product: createProductRecord({
        currentStage: ProductStage.STAGE_2,
        status: ProductStatus.IN_REVIEW,
      }),
    }).transition(
      testIds.product,
      'REJECT',
      {
        id: testIds.commercialOwner,
        role: UserRole.GM_COMMERCIAL_OWNER,
      },
      {},
    );
    assert.equal(rejectResult.product.status, ProductStatus.REJECTED);

    const killResult = await createService({
      product: createProductRecord({
        currentStage: ProductStage.STAGE_2,
        status: ProductStatus.IN_REVIEW,
      }),
    }).transition(
      testIds.product,
      'KILL',
      {
        id: testIds.cooApprover,
        role: UserRole.COO_EXECUTIVE_APPROVER,
      },
      {},
    );
    assert.equal(killResult.product.status, ProductStatus.KILLED);
  });

  it('handles Gate 3 submit, approve, reject, and kill', async () => {
    const submitResult = await createService({
      product: createProductRecord({
        currentStage: ProductStage.STAGE_3,
        status: ProductStatus.DRAFT,
      }),
    }).transition(
      testIds.product,
      'SUBMIT',
      {
        id: testIds.productOwner,
        role: UserRole.PRODUCT_MANAGER,
      },
      {},
    );
    assert.equal(submitResult.product.status, ProductStatus.IN_REVIEW);

    const approveResult = await createService({
      product: createProductRecord({
        currentStage: ProductStage.STAGE_3,
        status: ProductStatus.IN_REVIEW,
      }),
    }).transition(
      testIds.product,
      'APPROVE',
      {
        id: testIds.cooApprover,
        role: UserRole.COO_EXECUTIVE_APPROVER,
      },
      {},
    );
    assert.equal(approveResult.product.currentStage, ProductStage.STAGE_4);
    assert.equal(approveResult.product.status, ProductStatus.DRAFT);

    const rejectResult = await createService({
      product: createProductRecord({
        currentStage: ProductStage.STAGE_3,
        status: ProductStatus.IN_REVIEW,
      }),
    }).transition(
      testIds.product,
      'REJECT',
      {
        id: testIds.commercialOwner,
        role: UserRole.GM_COMMERCIAL_OWNER,
      },
      {},
    );
    assert.equal(rejectResult.product.status, ProductStatus.REJECTED);

    const killResult = await createService({
      product: createProductRecord({
        currentStage: ProductStage.STAGE_3,
        status: ProductStatus.IN_REVIEW,
      }),
    }).transition(
      testIds.product,
      'KILL',
      {
        id: testIds.cooApprover,
        role: UserRole.COO_EXECUTIVE_APPROVER,
      },
      {},
    );
    assert.equal(killResult.product.status, ProductStatus.KILLED);
  });

  it('handles Stage 4, Stage 5, and Stage 6 lifecycle approval transitions', async () => {
    const stageFourApproveResult = await createService({
      product: createProductRecord({
        currentStage: ProductStage.STAGE_4,
        status: ProductStatus.IN_REVIEW,
      }),
    }).transition(
      testIds.product,
      'APPROVE',
      {
        id: testIds.cooApprover,
        role: UserRole.COO_EXECUTIVE_APPROVER,
      },
      {},
    );
    assert.equal(
      stageFourApproveResult.product.currentStage,
      ProductStage.STAGE_5,
    );
    assert.equal(stageFourApproveResult.product.status, ProductStatus.DRAFT);

    const stageFiveApproveResult = await createService({
      product: createProductRecord({
        currentStage: ProductStage.STAGE_5,
        status: ProductStatus.IN_REVIEW,
      }),
    }).transition(
      testIds.product,
      'APPROVE',
      {
        id: testIds.cooApprover,
        role: UserRole.COO_EXECUTIVE_APPROVER,
      },
      {},
    );
    assert.equal(
      stageFiveApproveResult.product.currentStage,
      ProductStage.STAGE_6,
    );
    assert.equal(stageFiveApproveResult.product.status, ProductStatus.DRAFT);

    const stageSixApproveResult = await createService({
      product: createProductRecord({
        currentStage: ProductStage.STAGE_6,
        status: ProductStatus.IN_REVIEW,
      }),
    }).transition(
      testIds.product,
      'APPROVE',
      {
        id: testIds.cooApprover,
        role: UserRole.COO_EXECUTIVE_APPROVER,
      },
      {},
    );
    assert.equal(
      stageSixApproveResult.product.currentStage,
      ProductStage.STAGE_6,
    );
    assert.equal(stageSixApproveResult.product.status, ProductStatus.APPROVED);
  });

  it('enforces Stage 4-6 readiness before lifecycle approval', async () => {
    const stageFourError = new BadRequestException({
      code: 'STAGE_FOUR_APPROVAL_INCOMPLETE',
    });

    await assert.rejects(
      createService({
        product: createProductRecord({
          currentStage: ProductStage.STAGE_4,
          status: ProductStatus.IN_REVIEW,
        }),
        stageFourApproveAssert: async () => {
          throw stageFourError;
        },
      }).transition(
        testIds.product,
        'APPROVE',
        {
          id: testIds.cooApprover,
          role: UserRole.COO_EXECUTIVE_APPROVER,
        },
        {},
      ),
      stageFourError,
    );

    const stageSixError = new BadRequestException({
      code: 'STAGE_SIX_APPROVAL_INCOMPLETE',
    });

    await assert.rejects(
      createService({
        product: createProductRecord({
          currentStage: ProductStage.STAGE_6,
          status: ProductStatus.IN_REVIEW,
        }),
        stageSixApproveAssert: async () => {
          throw stageSixError;
        },
      }).transition(
        testIds.product,
        'APPROVE',
        {
          id: testIds.cooApprover,
          role: UserRole.COO_EXECUTIVE_APPROVER,
        },
        {},
      ),
      stageSixError,
    );
  });

  it('rejects invalid statuses', async () => {
    await assert.rejects(
      createService({
        product: createProductRecord({
          currentStage: ProductStage.STAGE_1,
          status: ProductStatus.DRAFT,
        }),
      }).transition(
        testIds.product,
        'APPROVE',
        {
          id: testIds.headOfProduct,
          role: UserRole.HEAD_OF_PRODUCT,
        },
        {},
      ),
      BadRequestException,
    );
  });
});

describe('StageFourCompletionService', () => {
  function createService(options?: {
    day30Review?: ReturnType<typeof createDay30ReviewRecord> | null;
    launchConfirmation?: ReturnType<
      typeof createLaunchConfirmationRecord
    > | null;
    sellInReports?: ReturnType<typeof createSellInReportRecord>[];
    weeklyFeedbackLogs?: ReturnType<typeof createWeeklyFeedbackLogRecord>[];
  }): StageFourCompletionService {
    return new StageFourCompletionService(
      {
        findByProductId: async () =>
          options?.launchConfirmation ??
          createLaunchConfirmationRecord({
            channels: [
              ...createLaunchConfirmationRecord().channels,
              {
                accountName: 'Key Dealer Network',
                channelType: ChannelType.MM,
                goLiveAt: '2026-05-15T11:00:00.000Z',
                id: '00000000-0000-4000-8000-000000000099',
                isLive: true,
                issueStatus: LaunchIssueStatus.NO_ISSUE,
                issueSummary: null,
                listingUrl: 'https://dealer.example.test/product',
              },
            ],
          }),
      } as never,
      {
        listByProductId: async () => ({
          rows: options?.sellInReports ?? [createSellInReportRecord()],
          total: options?.sellInReports?.length ?? 1,
        }),
      } as never,
      {
        listByProductId: async () => ({
          rows: options?.weeklyFeedbackLogs ?? [
            createWeeklyFeedbackLogRecord({
              id: '00000000-0000-4000-8000-000000000061',
            }),
            createWeeklyFeedbackLogRecord({
              id: '00000000-0000-4000-8000-000000000062',
            }),
            createWeeklyFeedbackLogRecord({
              id: '00000000-0000-4000-8000-000000000063',
            }),
            createWeeklyFeedbackLogRecord({
              id: '00000000-0000-4000-8000-000000000064',
            }),
          ],
          total: options?.weeklyFeedbackLogs?.length ?? 4,
        }),
      } as never,
      {
        findByProductId: async () =>
          options?.day30Review ??
          createDay30ReviewRecord({
            channelGp: [
              {
                actualGpPercent: '32.00',
                channelType: ChannelType.MTO,
                id: '00000000-0000-4000-8000-000000000065',
                notes: 'Above floor.',
              },
            ],
          }),
      } as never,
    );
  }

  it('accepts complete Stage 4 records and rejects incomplete approval readiness', async () => {
    await createService().assertReadyForStageFourSubmission(testIds.product);
    await createService().assertReadyForStageFourApproval(testIds.product);

    await assert.rejects(
      createService({
        weeklyFeedbackLogs: [createWeeklyFeedbackLogRecord()],
      }).assertReadyForStageFourApproval(testIds.product),
      BadRequestException,
    );
  });
});

describe('StageFiveCompletionService', () => {
  function createService(options?: {
    portfolioUpdates?: ReturnType<typeof createPortfolioUpdateRecord>[];
    recommendation?: ReturnType<
      typeof createRevampEolRecommendationRecord
    > | null;
    scorecards?: ReturnType<typeof createProductScorecardRecord>[];
  }): StageFiveCompletionService {
    return new StageFiveCompletionService(
      {
        listLatestByProductId: async () =>
          options?.scorecards ?? [createProductScorecardRecord()],
      } as never,
      {
        list: async () => ({
          rows: options?.portfolioUpdates ?? [createPortfolioUpdateRecord()],
          total: options?.portfolioUpdates?.length ?? 1,
        }),
      } as never,
      {
        findByProductId: async () =>
          options?.recommendation ??
          createRevampEolRecommendationRecord({
            cooDecision: RevampEolDecision.APPROVED,
            cooDecisionAt: new Date('2026-04-28T10:00:00.000Z'),
            cooDecisionByUserId: testIds.cooApprover,
          }),
      } as never,
    );
  }

  it('requires an approved EOL recommendation before advancing to Stage 6', async () => {
    await createService().assertReadyForStageFiveSubmission(testIds.product);
    await createService().assertReadyForStageFiveApproval(testIds.product);

    await assert.rejects(
      createService({
        recommendation: createRevampEolRecommendationRecord(),
      }).assertReadyForStageFiveApproval(testIds.product),
      BadRequestException,
    );
  });
});

describe('StageSixCompletionService', () => {
  function createService(options?: {
    clearancePlan?: ReturnType<typeof createClearancePlanRecord> | null;
    eolExecutionPlan?: ReturnType<typeof createEolExecutionPlanRecord> | null;
    recommendation?: ReturnType<
      typeof createRevampEolRecommendationRecord
    > | null;
  }): StageSixCompletionService {
    return new StageSixCompletionService(
      {
        findApprovedEolByProductId: async () =>
          options?.recommendation ??
          createRevampEolRecommendationRecord({
            cooDecision: RevampEolDecision.APPROVED,
            cooDecisionAt: new Date('2026-04-28T10:00:00.000Z'),
            cooDecisionByUserId: testIds.cooApprover,
          }),
      } as never,
      {
        findByProductId: async () =>
          options?.eolExecutionPlan ??
          createEolExecutionPlanRecord({
            milestones: [
              {
                dueDate: '2026-08-15',
                id: '00000000-0000-4000-8000-000000000066',
                milestoneName: 'Stop new PO creation',
                notes: 'Completed.',
                ownerRole: 'SPDM_PRODUCT_OPS',
                status: EolMilestoneStatus.COMPLETED,
              },
            ],
          }),
      } as never,
      {
        findByProductId: async () =>
          options?.clearancePlan ??
          createClearancePlanRecord({
            pricingRows: [
              {
                channelType: ChannelType.MTO,
                clearanceRsp: '150.00',
                floorPrice: '140.00',
                id: '00000000-0000-4000-8000-000000000067',
                markdownApproved: true,
                notes: 'Approved markdown.',
                originalRsp: '199.00',
              },
            ],
          }),
      } as never,
    );
  }

  it('accepts complete Stage 6 execution records and blocks unresolved clearance rows', async () => {
    await createService().assertReadyForStageSixSubmission(testIds.product);
    await createService().assertReadyForStageSixApproval(testIds.product);

    await assert.rejects(
      createService({
        clearancePlan: createClearancePlanRecord(),
      }).assertReadyForStageSixApproval(testIds.product),
      BadRequestException,
    );
  });
});

describe('GateThreeReviewsService', () => {
  function createService(options?: {
    auditCreate?: (input: { action: AuditAction }) => Promise<unknown>;
    existingReview?: ReturnType<typeof createGateThreeReviewRecord> | null;
    product?: ReturnType<typeof createProductRecord> | null;
    query?: (text: string) => Promise<{ rows: never[] }>;
    reviewUpsert?: () => Promise<unknown>;
  }): GateThreeReviewsService {
    const product =
      options?.product === undefined
        ? createProductRecord({
            currentStage: ProductStage.STAGE_3,
          })
        : options.product;

    return new GateThreeReviewsService(
      {
        getClient: async () => ({
          query: options?.query ?? (async () => ({ rows: [] })),
          release: () => undefined,
        }),
      } as never,
      {
        findById: async () => product,
      } as never,
      {
        findByProductId: async () => options?.existingReview ?? null,
        upsert:
          options?.reviewUpsert ??
          (async (input: { productId: string }) =>
            createGateThreeReviewRecord({
              productId: input.productId,
            })),
      } as never,
      {
        create:
          options?.auditCreate ??
          (async (input: { action: AuditAction }) =>
            createAuditLogRecord({
              action: input.action,
            })),
      } as never,
    );
  }

  it('records Finance, Marketing, and GM checkpoints with audit logs', async () => {
    const financeResult = await createService().recordReview(
      testIds.product,
      'FINANCE',
      {
        id: testIds.financeOwner,
        role: UserRole.FINANCE_MANAGER,
      },
      {
        comment: 'Finance done',
      },
    );
    assert.equal(financeResult.auditLog.action, AuditAction.FINANCE_CONFIRMED);

    const marketingResult = await createService().recordReview(
      testIds.product,
      'MARKETING',
      {
        id: testIds.marketingOwner,
        role: UserRole.MARKETING_GTM_OWNER,
      },
      {
        comment: 'Marketing done',
      },
    );
    assert.equal(
      marketingResult.auditLog.action,
      AuditAction.MARKETING_REVIEW_COMPLETED,
    );

    const gmResult = await createService().recordReview(
      testIds.product,
      'GM',
      {
        id: testIds.commercialOwner,
        role: UserRole.GM_COMMERCIAL_OWNER,
      },
      {
        comment: 'GM done',
      },
    );
    assert.equal(gmResult.auditLog.action, AuditAction.GM_APPROVED);
  });

  it('rejects invalid stage, missing product, and missing admin override reason', async () => {
    await assert.rejects(
      createService({
        product: createProductRecord({
          currentStage: ProductStage.STAGE_2,
        }),
      }).recordReview(
        testIds.product,
        'FINANCE',
        {
          id: testIds.financeOwner,
          role: UserRole.FINANCE_MANAGER,
        },
        {},
      ),
      BadRequestException,
    );

    await assert.rejects(
      createService({
        product: null,
      }).recordReview(
        testIds.product,
        'FINANCE',
        {
          id: testIds.financeOwner,
          role: UserRole.FINANCE_MANAGER,
        },
        {},
      ),
      NotFoundException,
    );

    await assert.rejects(
      createService().recordReview(
        testIds.product,
        'FINANCE',
        {
          id: testIds.admin,
          isAdminSupportOverride: true,
          role: UserRole.ADMIN,
        },
        {},
      ),
      BadRequestException,
    );
  });
});

describe('GateTwoReviewsService', () => {
  function createService(options?: {
    auditCreate?: (input: { action: AuditAction }) => Promise<unknown>;
    existingReview?: ReturnType<typeof createGateTwoReviewRecord> | null;
    product?: ReturnType<typeof createProductRecord> | null;
    query?: (text: string) => Promise<{ rows: never[] }>;
    reviewUpsert?: () => Promise<unknown>;
  }): GateTwoReviewsService {
    const product =
      options?.product === undefined
        ? createProductRecord({
            currentStage: ProductStage.STAGE_2,
          })
        : options.product;

    return new GateTwoReviewsService(
      {
        getClient: async () => ({
          query: options?.query ?? (async () => ({ rows: [] })),
          release: () => undefined,
        }),
      } as never,
      {
        findById: async () => product,
      } as never,
      {
        findByProductId: async () => options?.existingReview ?? null,
        upsert:
          options?.reviewUpsert ??
          (async (input: { productId: string }) =>
            createGateTwoReviewRecord({
              productId: input.productId,
            })),
      } as never,
      {
        create:
          options?.auditCreate ??
          (async (input: { action: AuditAction }) =>
            createAuditLogRecord({
              action: input.action,
            })),
      } as never,
    );
  }

  it('records QA, Finance, and GM checkpoints with audit logs', async () => {
    const qaResult = await createService().recordReview(
      testIds.product,
      'QA',
      {
        id: testIds.qaReviewer,
        role: UserRole.QA_TSD_REVIEWER,
      },
      {
        comment: 'QA done',
      },
    );
    assert.equal(qaResult.auditLog.action, AuditAction.QA_REVIEW_COMPLETED);

    const financeResult = await createService().recordReview(
      testIds.product,
      'FINANCE',
      {
        id: testIds.financeOwner,
        role: UserRole.FINANCE_MANAGER,
      },
      {
        comment: 'Finance done',
      },
    );
    assert.equal(financeResult.auditLog.action, AuditAction.FINANCE_CONFIRMED);

    const gmResult = await createService().recordReview(
      testIds.product,
      'GM',
      {
        id: testIds.commercialOwner,
        role: UserRole.GM_COMMERCIAL_OWNER,
      },
      {
        comment: 'GM done',
      },
    );
    assert.equal(gmResult.auditLog.action, AuditAction.GM_APPROVED);
  });

  it('rejects invalid stage, missing product, and missing admin override reason', async () => {
    await assert.rejects(
      createService({
        product: createProductRecord({
          currentStage: ProductStage.STAGE_1,
        }),
      }).recordReview(
        testIds.product,
        'QA',
        {
          id: testIds.qaReviewer,
          role: UserRole.QA_TSD_REVIEWER,
        },
        {},
      ),
      BadRequestException,
    );

    await assert.rejects(
      createService({
        product: null,
      }).recordReview(
        testIds.product,
        'QA',
        {
          id: testIds.qaReviewer,
          role: UserRole.QA_TSD_REVIEWER,
        },
        {},
      ),
      NotFoundException,
    );

    await assert.rejects(
      createService().recordReview(
        testIds.product,
        'QA',
        {
          id: testIds.admin,
          isAdminSupportOverride: true,
          role: UserRole.ADMIN,
        },
        {},
      ),
      BadRequestException,
    );
  });
});

describe('StageTwoCompletionService', () => {
  function createService(options?: {
    businessCase?: ReturnType<typeof createBusinessCaseRecord> | null;
    supplierEvaluation?: ReturnType<
      typeof createSupplierEvaluationRecord
    > | null;
    gateTwoReview?: ReturnType<typeof createGateTwoReviewRecord> | null;
  }): StageTwoCompletionService {
    return new StageTwoCompletionService(
      {
        findByProductId: async () =>
          options?.supplierEvaluation === undefined
            ? createSupplierEvaluationRecord()
            : options.supplierEvaluation,
      } as never,
      {
        findByProductId: async () =>
          options?.businessCase === undefined
            ? createBusinessCaseRecord()
            : options.businessCase,
      } as never,
      {
        findByProductId: async () =>
          options?.gateTwoReview === undefined
            ? createGateTwoReviewRecord()
            : options.gateTwoReview,
      } as never,
    );
  }

  it('accepts complete Stage 2 submission and approval data', async () => {
    const service = createService();
    await assert.doesNotReject(
      service.assertReadyForGateTwoSubmission(testIds.product),
    );
    await assert.doesNotReject(
      service.assertReadyForGateTwoApproval(testIds.product),
    );
  });

  it('rejects missing Stage 2 prerequisites', async () => {
    await assert.rejects(
      createService({
        businessCase: null,
        supplierEvaluation: null,
      }).assertReadyForGateTwoSubmission(testIds.product),
      BadRequestException,
    );

    await assert.rejects(
      createService({
        gateTwoReview: createGateTwoReviewRecord({
          financeConfirmedAt: null,
          financeConfirmedByUserId: null,
          gmApprovedAt: null,
          gmApprovedByUserId: null,
          qaReviewCompletedAt: null,
          qaReviewedByUserId: null,
        }),
        supplierEvaluation: createSupplierEvaluationRecord({
          suppliers: [createSupplierEvaluationRecord().suppliers[0]!],
        }),
      }).assertReadyForGateTwoApproval(testIds.product),
      BadRequestException,
    );
  });
});

describe('StageThreeCompletionService', () => {
  function createService(options?: {
    channelListingPlan?: ReturnType<
      typeof createChannelListingPlanRecord
    > | null;
    channelPricing?: ReturnType<typeof createChannelPricingRecord> | null;
    gateThreeReview?: ReturnType<typeof createGateThreeReviewRecord> | null;
    gtmPlan?: ReturnType<typeof createGtmPlanRecord> | null;
  }): StageThreeCompletionService {
    return new StageThreeCompletionService(
      {
        findByProductId: async () =>
          options?.channelListingPlan === undefined
            ? createChannelListingPlanRecord()
            : options.channelListingPlan,
      } as never,
      {
        findByProductId: async () =>
          options?.channelPricing === undefined
            ? createChannelPricingRecord()
            : options.channelPricing,
      } as never,
      {
        findByProductId: async () =>
          options?.gtmPlan === undefined
            ? createGtmPlanRecord()
            : options.gtmPlan,
      } as never,
      {
        findByProductId: async () =>
          options?.gateThreeReview === undefined
            ? createGateThreeReviewRecord()
            : options.gateThreeReview,
      } as never,
    );
  }

  it('accepts complete Stage 3 submission and approval data', async () => {
    const service = createService();
    await assert.doesNotReject(
      service.assertReadyForGateThreeSubmission(testIds.product),
    );
    await assert.doesNotReject(
      service.assertReadyForGateThreeApproval(testIds.product),
    );
  });

  it('rejects missing Stage 3 prerequisites', async () => {
    await assert.rejects(
      createService({
        channelListingPlan: null,
        channelPricing: null,
        gtmPlan: null,
      }).assertReadyForGateThreeSubmission(testIds.product),
      BadRequestException,
    );

    await assert.rejects(
      createService({
        channelListingPlan: createChannelListingPlanRecord({
          channels: [createChannelListingPlanRecord().channels[0]!],
          lazadaConfirmed: false,
          shopeeConfirmed: false,
        }),
        channelPricing: createChannelPricingRecord({
          pricingRows: [
            {
              ...createChannelPricingRecord().pricingRows[0]!,
              calculatedGpPercent: '10.00',
            },
          ],
        }),
        gateThreeReview: createGateThreeReviewRecord({
          financeConfirmedAt: null,
          financeConfirmedByUserId: null,
          gmApprovedAt: null,
          gmApprovedByUserId: null,
          marketingReviewedAt: null,
          marketingReviewedByUserId: null,
        }),
        gtmPlan: createGtmPlanRecord({
          checklistItems: [
            {
              ...createGtmPlanRecord().checklistItems[0]!,
              isComplete: false,
            },
          ],
        }),
      }).assertReadyForGateThreeApproval(testIds.product),
      BadRequestException,
    );
  });
});
