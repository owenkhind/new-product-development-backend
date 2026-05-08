import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { GateDecisionOutcome } from '../../src/enums/gate-decision-outcome.enum';
import { ProductStage } from '../../src/enums/product-stage.enum';
import { ProductStatus } from '../../src/enums/product-status.enum';
import { UserRole } from '../../src/enums/user-role.enum';
import { ApprovalQueueService } from '../../src/modules/approvals/services/approval-queue.service';
import type { ApprovalQueueRecord } from '../../src/modules/approvals/repositories/approval-queue.repository';
import { testIds } from '../helpers/fixtures';

describe('ApprovalQueueService', () => {
  it('maps backend approval records into queue items and summary metrics', async () => {
    const service = new ApprovalQueueService({
      listForActor: async () => [
        createApprovalQueueRecord({
          latestDecisionOutcome: GateDecisionOutcome.SUBMITTED,
          stage: ProductStage.STAGE_4,
          status: ProductStatus.IN_REVIEW,
        }),
        createApprovalQueueRecord({
          id: '00000000-0000-4000-8000-000000000070',
          latestDecisionOutcome: GateDecisionOutcome.REJECTED,
          stage: ProductStage.STAGE_5,
          status: ProductStatus.REJECTED,
          workingName: 'Rice Cooker Pro',
        }),
      ],
    } as never);

    const queue = await service.getQueue({
      actingAsUserId: null,
      id: testIds.commercialOwner,
      isAdminSupportOverride: false,
      role: UserRole.GM_COMMERCIAL_OWNER,
    });

    assert.equal(queue.items.length, 2);
    const firstItem = queue.items[0];
    const secondItem = queue.items[1];

    assert.ok(firstItem);
    assert.ok(secondItem);
    assert.equal(firstItem.assignedRole, UserRole.GM_COMMERCIAL_OWNER);
    assert.equal(firstItem.gateLabel, 'Stage 4 review');
    assert.equal(firstItem.status, 'PENDING');
    assert.equal(secondItem.status, 'REJECTED');
    assert.equal(queue.summary.assignedApprovals, 1);
    assert.equal(queue.summary.supportOverridesOpen, 1);
  });
});

function createApprovalQueueRecord(
  overrides: Partial<ApprovalQueueRecord> = {},
): ApprovalQueueRecord {
  return {
    category: 'FANS',
    id: testIds.product,
    latestDecisionActorUserId: testIds.productOwner,
    latestDecisionComment: 'Submitted for review.',
    latestDecisionCreatedAt: new Date('2026-04-22T00:00:00.000Z'),
    latestDecisionIsAdminSupportAction: false,
    latestDecisionOutcome: GateDecisionOutcome.SUBMITTED,
    latestDecisionOverrideReason: null,
    ownerName: 'Product Owner',
    productCode: 'KPD-001',
    stage: ProductStage.STAGE_4,
    status: ProductStatus.IN_REVIEW,
    updatedAt: new Date('2026-04-22T00:00:00.000Z'),
    workingName: 'Desk Fan Revamp',
    ...overrides,
  };
}
