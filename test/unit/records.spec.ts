import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AuditAction } from '../../src/enums/audit-action.enum';
import { UserRole } from '../../src/enums/user-role.enum';
import { AuditLogsController } from '../../src/modules/audit-logs/controllers/audit-logs.controller';
import { ProductAuditLogsController } from '../../src/modules/audit-logs/controllers/product-audit-logs.controller';
import { AuditLogsService } from '../../src/modules/audit-logs/services/audit-logs.service';
import { ProductGateDecisionsController } from '../../src/modules/gate-decisions/controllers/product-gate-decisions.controller';
import { GateDecisionsService } from '../../src/modules/gate-decisions/services/gate-decisions.service';
import {
  createAuditLogRecord,
  createGateDecisionRecord,
  testIds,
} from '../helpers/fixtures';

describe('GateDecisionsService', () => {
  it('forwards product lookups to the repository', async () => {
    const gateDecision = createGateDecisionRecord();
    const calls: string[] = [];
    const service = new GateDecisionsService({
      listByProductId: async (productId: string) => {
        calls.push(productId);
        return [gateDecision];
      },
    } as never);

    const result = await service.findByProductId(testIds.product);

    assert.equal(calls[0], testIds.product);
    assert.deepEqual(result, [gateDecision]);
  });
});

describe('ProductGateDecisionsController', () => {
  it('maps gate decision responses', async () => {
    const gateDecision = createGateDecisionRecord();
    const controller = new ProductGateDecisionsController({
      findByProductId: async () => [gateDecision],
    } as never);

    const response = await controller.findAll(testIds.product);

    assert.deepEqual(response, {
      data: [gateDecision],
    });
  });
});

describe('AuditLogsService', () => {
  it('caps pagination limit and calculates offset', async () => {
    const auditLog = createAuditLogRecord();
    const calls: Array<{ limit: number; offset: number; productId: string }> =
      [];
    const service = new AuditLogsService({
      listByProductId: async (input: {
        limit: number;
        offset: number;
        productId: string;
      }) => {
        calls.push(input);
        return {
          rows: [auditLog],
          total: 1,
        };
      },
    } as never);

    const result = await service.findByProductId(testIds.product, {
      limit: 500,
      page: 2,
    });

    assert.deepEqual(calls[0], {
      limit: 100,
      offset: 100,
      productId: testIds.product,
    });
    assert.deepEqual(result, {
      rows: [auditLog],
      total: 1,
    });
  });

  it('builds the global audit dashboard without per-product fan-out', async () => {
    const auditLog = createAuditLogRecord({
      actingAsUserId: testIds.admin,
      action: AuditAction.BLOCK,
      metadata: {
        comment: 'Blocked pending COO action',
        overrideReason: 'COO unavailable',
      },
    });
    const calls: Array<{
      actorId: string;
      actorRole: UserRole;
      limit: number;
      offset: number;
    }> = [];
    const service = new AuditLogsService({
      listDashboard: async (input: {
        actorId: string;
        actorRole: UserRole;
        limit: number;
        offset: number;
      }) => {
        calls.push(input);
        return {
          rows: [
            {
              ...auditLog,
              actorName: 'Owen Admin',
              actorRole: UserRole.ADMIN,
              productName: 'Smart Fan Revamp',
            },
          ],
          total: 1,
        };
      },
    } as never);

    const dashboard = await service.getDashboard(
      {
        limit: 500,
        page: 2,
      },
      {
        actingAsUserId: null,
        id: testIds.admin,
        isAdminSupportOverride: false,
        role: UserRole.ADMIN,
      },
    );

    assert.deepEqual(calls[0], {
      actorId: testIds.admin,
      actorRole: UserRole.ADMIN,
      limit: 100,
      offset: 100,
    });
    assert.equal(dashboard.events[0]?.eventType, 'ADMIN_OVERRIDE');
    assert.equal(dashboard.events[0]?.productName, 'Smart Fan Revamp');
    assert.equal(dashboard.latestOverride?.reason, 'COO unavailable');
    assert.equal(dashboard.metrics[0]?.value, 1);
  });
});

describe('ProductAuditLogsController', () => {
  it('maps audit log responses with pagination meta', async () => {
    const auditLog = createAuditLogRecord();
    const controller = new ProductAuditLogsController({
      findByProductId: async () => ({
        rows: [auditLog],
        total: 1,
      }),
    } as never);

    const response = await controller.findAll(testIds.product, {
      limit: 20,
      page: 1,
    });

    assert.deepEqual(response, {
      data: [auditLog],
      meta: {
        limit: 20,
        page: 1,
        total: 1,
      },
    });
  });
});

describe('AuditLogsController', () => {
  it('maps global audit dashboard responses', async () => {
    const auditLog = createAuditLogRecord();
    const controller = new AuditLogsController({
      getDashboard: async () => ({
        events: [
          {
            actor: auditLog.actorUserId,
            actorRole: 'PRODUCT_MANAGER',
            details: 'Submit on Product',
            eventType: 'STAGE_TRANSITION',
            id: auditLog.id,
            productName: 'Desk Fan Revamp',
            severity: 'NOTICE',
            timestamp: auditLog.createdAt.toISOString(),
            traceId: auditLog.entityId,
          },
        ],
        metrics: [{ label: 'Audit events', tone: 'blue', value: 1 }],
      }),
    } as never);

    const response = await controller.getDashboard(
      {
        limit: 20,
        page: 1,
      },
      {
        user: {
          id: testIds.productOwner,
          role: UserRole.PRODUCT_MANAGER,
        },
      } as never,
    );

    assert.equal(response.events[0]?.id, auditLog.id);
    assert.equal(response.metrics[0]?.value, 1);
  });
});
