import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { UserRole } from '../../src/enums/user-role.enum';
import { PoliciesGuard } from '../../src/guards/policies.guard';
import { AuditLogsController } from '../../src/modules/audit-logs/controllers/audit-logs.controller';
import { ProductAuditLogsController } from '../../src/modules/audit-logs/controllers/product-audit-logs.controller';
import { AuditLogsService } from '../../src/modules/audit-logs/services/audit-logs.service';
import { AuthorizationPolicyService } from '../../src/modules/authorization/services/authorization-policy.service';
import { ProductGateDecisionsController } from '../../src/modules/gate-decisions/controllers/product-gate-decisions.controller';
import { GateDecisionsService } from '../../src/modules/gate-decisions/services/gate-decisions.service';
import { UsersRepository } from '../../src/modules/users/repositories/users.repository';
import {
  createAuditLogRecord,
  createGateDecisionRecord,
  createUserRecord,
  testIds,
} from '../helpers/fixtures';
import {
  createExecutionContext,
  createHttpTestApp,
} from '../helpers/create-http-test-app';

describe('Record modules wiring (e2e)', () => {
  let app: Awaited<ReturnType<typeof createHttpTestApp>>['app'];
  let gateDecisionController: ProductGateDecisionsController;
  let auditDashboardController: AuditLogsController;
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
    getDashboard: async () => ({
      events: [
        {
          actor: auditLog.actorUserId,
          actorRole: UserRole.PRODUCT_MANAGER,
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
  };

  before(async () => {
    const setup = await createHttpTestApp({
      controllers: [
        ProductGateDecisionsController,
        AuditLogsController,
        ProductAuditLogsController,
      ],
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
            findById: async (id: string) =>
              id === testIds.productOwner ? productManager : null,
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
    gateDecisionController = new ProductGateDecisionsController(
      gateDecisionsService as never,
    );
    auditDashboardController = new AuditLogsController(
      auditLogsService as never,
    );
    auditLogController = new ProductAuditLogsController(
      auditLogsService as never,
    );
    guard = new PoliciesGuard(
      new Reflector(),
      {
        get: () => 'test',
      } as never,
      {
        findById: async (id: string) =>
          id === testIds.productOwner ? productManager : null,
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

    const gateDecisionResponse = await gateDecisionController.findAll(
      testIds.product,
    );
    const auditDashboardResponse = await auditDashboardController.getDashboard(
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
    const auditLogResponse = await auditLogController.findAll(testIds.product, {
      limit: 20,
      page: 1,
    });

    assert.equal(gateDecisionResponse.data[0]?.id, gateDecision.id);
    assert.equal(auditDashboardResponse.events[0]?.id, auditLog.id);
    assert.equal(auditDashboardResponse.metrics[0]?.value, 1);
    assert.equal(auditLogResponse.data[0]?.id, auditLog.id);
    assert.equal(auditLogResponse.meta.total, 1);
  });

  it('wires global audit dashboard access through the guard', async () => {
    await assert.doesNotReject(
      guard.canActivate(
        createExecutionContext({
          controllerClass: auditDashboardController,
          handlerName: 'getDashboard',
          request: {
            headers: {
              'x-dev-user-id': testIds.productOwner,
            },
            params: {},
          },
        }),
      ),
    );
  });
});
