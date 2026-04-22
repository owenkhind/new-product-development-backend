import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AuditEntityType } from '../../../enums/audit-entity-type.enum';
import { WorkflowTransitionAction } from '../../../enums/workflow-transition-action.enum';
import { ProductAuditLogsController } from '../controllers/product-audit-logs.controller';
import { AuditLogsService } from '../services/audit-logs.service';

describe('ProductAuditLogsController', () => {
  it('maps audit log records to API responses', async () => {
    const auditLog = {
      actingAsUserId: null,
      action: WorkflowTransitionAction.SUBMIT,
      actorUserId: 'product-user-id',
      createdAt: new Date('2026-04-22T00:00:00.000Z'),
      entityId: 'product-id',
      entityType: AuditEntityType.PRODUCT,
      fromState: {
        currentStage: 'STAGE_1',
        status: 'DRAFT',
      },
      id: 'audit-log-id',
      metadata: {
        comment: 'Ready for Gate 1',
      },
      productId: 'product-id',
      toState: {
        currentStage: 'STAGE_1',
        status: 'IN_REVIEW',
      },
    };

    const service = {
      findByProductId: async () => ({
        rows: [auditLog],
        total: 1,
      }),
    };
    const controller = new ProductAuditLogsController(service as unknown as AuditLogsService);

    const response = await controller.findAll('product-id', {
      limit: 20,
      page: 1,
    });

    assert.deepEqual(response, {
      data: [
        {
          actingAsUserId: null,
          action: WorkflowTransitionAction.SUBMIT,
          actorUserId: 'product-user-id',
          createdAt: auditLog.createdAt,
          entityId: 'product-id',
          entityType: AuditEntityType.PRODUCT,
          fromState: {
            currentStage: 'STAGE_1',
            status: 'DRAFT',
          },
          id: 'audit-log-id',
          metadata: {
            comment: 'Ready for Gate 1',
          },
          productId: 'product-id',
          toState: {
            currentStage: 'STAGE_1',
            status: 'IN_REVIEW',
          },
        },
      ],
      meta: {
        limit: 20,
        page: 1,
        total: 1,
      },
    });
  });
});
