import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { PoliciesGuard } from '../../src/guards/policies.guard';
import { ProductAuditLogsController } from '../../src/modules/audit-logs/controllers/product-audit-logs.controller';
import { AuditLogsService } from '../../src/modules/audit-logs/services/audit-logs.service';
import { ProductGateDecisionsController } from '../../src/modules/gate-decisions/controllers/product-gate-decisions.controller';
import { GateDecisionsService } from '../../src/modules/gate-decisions/services/gate-decisions.service';
import { UsersRepository } from '../../src/modules/users/repositories/users.repository';
import { AuthorizationPolicyService } from '../../src/modules/authorization/services/authorization-policy.service';
import { createAuditLogRecord, createGateDecisionRecord, createUserRecord, testIds } from '../helpers/fixtures';
import {
  createExecutionContext,
  createHttpTestApp,
} from '../helpers/create-http-test-app';

describe('Record modules wiring (e2e)', () => {
  let app: Awaited<ReturnType<typeof createHttpTestApp>>['app'];
  let gateDecisionController: ProductGateDecisionsController;
  let auditLogController: ProductAuditLogsController;
  let guard: PoliciesGuard;

  const productManager = createUserRecord({
    id: testIds.productOwner,
  });
  const gateDecision = createGateDecisionRecord();
  const auditLog = createAuditLogRecord();
  const gateDecisionsService = {
    findByProductId: async () => [gateDecision],
  };
  const auditLogsService = {
    findByProductId: async () => ({
      rows: [auditLog],
      total: 1,
    }),
  };

  before(async () => {
    const setup = await createHttpTestApp({
      controllers: [ProductGateDecisionsController, ProductAuditLogsController],
      providers: [
        PoliciesGuard,
        {
          provide: GateDecisionsService,
          useValue: gateDecisionsService,
        },
        {
          provide: AuditLogsService,
          useValue: auditLogsService,
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
    gateDecisionController = new ProductGateDecisionsController(gateDecisionsService as never);
    auditLogController = new ProductAuditLogsController(auditLogsService as never);
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

  it('wires gate decision and audit log access through the guard and controllers', async () => {
    await assert.doesNotReject(
      guard.canActivate(
        createExecutionContext({
          controllerClass: gateDecisionController,
          handlerName: 'findAll',
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

    const gateDecisionResponse = await gateDecisionController.findAll(testIds.product);
    const auditLogResponse = await auditLogController.findAll(testIds.product, {
      limit: 20,
      page: 1,
    });

    assert.equal(gateDecisionResponse.data[0]?.id, gateDecision.id);
    assert.equal(auditLogResponse.data[0]?.id, auditLog.id);
    assert.equal(auditLogResponse.meta.total, 1);
  });
});
