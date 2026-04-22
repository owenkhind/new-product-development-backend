import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ProductAuditLogsController } from '../../src/modules/audit-logs/controllers/product-audit-logs.controller';
import { AuditLogsService } from '../../src/modules/audit-logs/services/audit-logs.service';
import { ProductGateDecisionsController } from '../../src/modules/gate-decisions/controllers/product-gate-decisions.controller';
import { GateDecisionsService } from '../../src/modules/gate-decisions/services/gate-decisions.service';
import { createAuditLogRecord, createGateDecisionRecord, testIds } from '../helpers/fixtures';

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
    const calls: Array<{ limit: number; offset: number; productId: string }> = [];
    const service = new AuditLogsService({
      listByProductId: async (input: { limit: number; offset: number; productId: string }) => {
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
