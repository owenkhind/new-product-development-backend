import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AuditEntityType } from '../../../enums/audit-entity-type.enum';
import { ProductBrand } from '../../../enums/product-brand.enum';
import { ProductCategory } from '../../../enums/product-category.enum';
import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductStatus } from '../../../enums/product-status.enum';
import { WorkflowTransitionAction } from '../../../enums/workflow-transition-action.enum';
import { ProductWorkflowController } from '../controllers/product-workflow.controller';
import { ProductWorkflowService } from '../services/product-workflow.service';

describe('ProductWorkflowController', () => {
  it('maps workflow transition results to API responses', async () => {
    const result = {
      auditLog: {
        actingAsUserId: null,
        action: WorkflowTransitionAction.SUBMIT,
        actorUserId: 'product-user-id',
        createdAt: new Date('2026-04-22T00:00:00.000Z'),
        entityId: 'product-id',
        entityType: AuditEntityType.PRODUCT,
        fromState: {
          currentStage: ProductStage.STAGE_1,
          status: ProductStatus.DRAFT,
        },
        id: 'audit-log-id',
        metadata: {},
        productId: 'product-id',
        toState: {
          currentStage: ProductStage.STAGE_1,
          status: ProductStatus.IN_REVIEW,
        },
      },
      gateDecision: {
        actingAsUserId: null,
        actorUserId: 'product-user-id',
        comment: 'Ready for Gate 1',
        createdAt: new Date('2026-04-22T00:00:00.000Z'),
        gateStage: ProductStage.STAGE_1,
        id: 'gate-decision-id',
        isAdminSupportAction: false,
        outcome: WorkflowTransitionAction.SUBMIT,
        overrideReason: null,
        productId: 'product-id',
      },
      product: {
        brand: ProductBrand.KHIND,
        category: ProductCategory.FANS,
        clusterOwnerUserIds: ['cluster-user-id'],
        commercialOwnerUserId: 'commercial-user-id',
        createdAt: new Date('2026-04-20T00:00:00.000Z'),
        currentStage: ProductStage.STAGE_1,
        description: 'Initial product draft',
        financeOwnerUserId: 'finance-user-id',
        id: 'product-id',
        marketingOwnerUserId: 'marketing-user-id',
        productCode: 'KPD-001',
        productOwnerUserId: 'product-user-id',
        status: ProductStatus.IN_REVIEW,
        updatedAt: new Date('2026-04-22T00:00:00.000Z'),
        workingName: 'Desk Fan Revamp',
      },
    };

    const service = {
      transition: async () => result,
    };
    const controller = new ProductWorkflowController(service as unknown as ProductWorkflowService);

    const response = await controller.submit(
      'product-id',
      {
        comment: 'Ready for Gate 1',
      },
      {
        user: {
          id: 'product-user-id',
        },
      } as never,
    );

    assert.deepEqual(response, {
      auditLog: {
        actingAsUserId: null,
        action: WorkflowTransitionAction.SUBMIT,
        actorUserId: 'product-user-id',
        createdAt: result.auditLog.createdAt,
        entityId: 'product-id',
        entityType: AuditEntityType.PRODUCT,
        fromState: {
          currentStage: ProductStage.STAGE_1,
          status: ProductStatus.DRAFT,
        },
        id: 'audit-log-id',
        metadata: {},
        productId: 'product-id',
        toState: {
          currentStage: ProductStage.STAGE_1,
          status: ProductStatus.IN_REVIEW,
        },
      },
      gateDecision: {
        actingAsUserId: null,
        actorUserId: 'product-user-id',
        comment: 'Ready for Gate 1',
        createdAt: result.gateDecision.createdAt,
        gateStage: ProductStage.STAGE_1,
        id: 'gate-decision-id',
        isAdminSupportAction: false,
        outcome: WorkflowTransitionAction.SUBMIT,
        overrideReason: null,
        productId: 'product-id',
      },
      product: {
        brand: ProductBrand.KHIND,
        category: ProductCategory.FANS,
        clusterOwnerUserIds: ['cluster-user-id'],
        commercialOwnerUserId: 'commercial-user-id',
        createdAt: result.product.createdAt,
        currentStage: ProductStage.STAGE_1,
        description: 'Initial product draft',
        financeOwnerUserId: 'finance-user-id',
        id: 'product-id',
        marketingOwnerUserId: 'marketing-user-id',
        productCode: 'KPD-001',
        productOwnerUserId: 'product-user-id',
        status: ProductStatus.IN_REVIEW,
        updatedAt: result.product.updatedAt,
        workingName: 'Desk Fan Revamp',
      },
    });
  });
});
