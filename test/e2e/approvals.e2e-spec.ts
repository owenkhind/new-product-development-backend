import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { PolicyResource } from '../../src/enums/policy-resource.enum';
import { StageAction } from '../../src/enums/stage-action.enum';
import { UserRole } from '../../src/enums/user-role.enum';
import { PoliciesGuard } from '../../src/guards/policies.guard';
import { ApprovalsController } from '../../src/modules/approvals/controllers/approvals.controller';
import { ApprovalQueueService } from '../../src/modules/approvals/services/approval-queue.service';
import { AuthorizationPolicyService } from '../../src/modules/authorization/services/authorization-policy.service';
import { UsersRepository } from '../../src/modules/users/repositories/users.repository';
import { createUserRecord, testIds } from '../helpers/fixtures';
import {
  createExecutionContext,
  createHttpTestApp,
} from '../helpers/create-http-test-app';

describe('Approvals module wiring (e2e)', () => {
  let app: Awaited<ReturnType<typeof createHttpTestApp>>['app'];
  let controller: ApprovalsController;
  let guard: PoliciesGuard;
  const cooApprover = createUserRecord({
    id: testIds.cooApprover,
    role: UserRole.COO_EXECUTIVE_APPROVER,
  });
  const queueResult = {
    items: [
      {
        assignedApprover: 'COO Executive Approver',
        assignedRole: UserRole.COO_EXECUTIVE_APPROVER,
        blockers: [],
        category: 'Fans',
        dueDate: '2026-04-22',
        gateLabel: 'Gate 3',
        id: 'approval-1',
        lastActivity: 'Submitted for approval',
        owner: 'Product Owner',
        priorDecisionSummary: 'Submitted by product owner.',
        productId: testIds.product,
        productName: 'Desk Fan Revamp',
        productStage: 'STAGE_3',
        productStatus: 'IN_REVIEW',
        readinessScore: 45,
        requestedBy: 'Product Owner',
        stageLabel: 'Stage 3 - Launch Readiness',
        status: 'PENDING',
        urgency: 'UPCOMING',
      },
    ],
    summary: {
      assignedApprovals: 1,
      averageReadiness: 45,
      overdueDecisions: 0,
      supportOverridesOpen: 0,
    },
  };

  before(async () => {
    const approvalsService = {
      getQueue: async () => queueResult,
    };
    const setup = await createHttpTestApp({
      controllers: [ApprovalsController],
      providers: [
        PoliciesGuard,
        {
          provide: ApprovalQueueService,
          useValue: approvalsService,
        },
        {
          provide: UsersRepository,
          useValue: {
            findById: async (id: string) =>
              id === testIds.cooApprover ? cooApprover : null,
          },
        },
        {
          provide: AuthorizationPolicyService,
          useValue: {
            assertAuthorized: async (input: {
              action: StageAction;
              resource: PolicyResource;
            }) => {
              assert.equal(input.resource, PolicyResource.APPROVALS);
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
    controller = new ApprovalsController(approvalsService as never);
    guard = new PoliciesGuard(
      new Reflector(),
      {
        get: () => 'test',
      } as never,
      {
        findById: async (id: string) =>
          id === testIds.cooApprover ? cooApprover : null,
      } as never,
      {
        assertAuthorized: async () => undefined,
      } as never,
    );
  });

  after(async () => {
    await app.close();
  });

  it('requires an authenticated approval actor and returns queue data', async () => {
    await assert.rejects(
      guard.canActivate(
        createExecutionContext({
          controllerClass: controller,
          handlerName: 'getQueue',
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
          handlerName: 'getQueue',
          request: {
            headers: {
              'x-dev-user-id': testIds.cooApprover,
            },
            params: {},
          },
        }),
      ),
    );

    const response = await controller.getQueue({
      user: {
        id: testIds.cooApprover,
        role: UserRole.COO_EXECUTIVE_APPROVER,
      },
    } as never);

    assert.equal(response.items.length, 1);
    assert.equal(response.summary.assignedApprovals, 1);
  });
});
