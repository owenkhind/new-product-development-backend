import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BadRequestException } from '@nestjs/common';

import { ProductBrand } from '../../../enums/product-brand.enum';
import { ProductCategory } from '../../../enums/product-category.enum';
import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductStatus } from '../../../enums/product-status.enum';
import { UserRole } from '../../../enums/user-role.enum';
import { WorkflowTransitionAction } from '../../../enums/workflow-transition-action.enum';
import { ProductWorkflowService } from '../services/product-workflow.service';

describe('ProductWorkflowService', () => {
  const baseProduct = {
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
    status: ProductStatus.DRAFT,
    updatedAt: new Date('2026-04-20T00:00:00.000Z'),
    workingName: 'Desk Fan Revamp',
  };

  it('submits a draft product into review and records approval traces', async () => {
    const transactionQueries: string[] = [];
    const updatedProduct = {
      ...baseProduct,
      status: ProductStatus.IN_REVIEW,
    };

    const service = new ProductWorkflowService(
      {
        getClient: async () => ({
          query: async (text: string) => {
            transactionQueries.push(text);
            return { rows: [] };
          },
          release: () => undefined,
        }),
      } as never,
      {
        findById: async () => baseProduct,
        update: async () => updatedProduct,
      } as never,
      {
        create: async (input: { outcome: WorkflowTransitionAction }) => ({
          id: 'gate-decision-id',
          outcome: input.outcome,
        }),
      } as never,
      {
        create: async (input: { action: WorkflowTransitionAction }) => ({
          id: 'audit-log-id',
          action: input.action,
        }),
      } as never,
    );

    const result = await service.transition(
      baseProduct.id,
      WorkflowTransitionAction.SUBMIT,
      {
        id: 'product-user-id',
        role: UserRole.PRODUCT_MANAGER,
      },
      {
        comment: 'Ready for Gate 1',
      },
    );

    assert.equal(result.product.status, ProductStatus.IN_REVIEW);
    assert.equal(result.gateDecision.outcome, WorkflowTransitionAction.SUBMIT);
    assert.equal(result.auditLog.action, WorkflowTransitionAction.SUBMIT);
    assert.deepEqual(transactionQueries, ['BEGIN', 'COMMIT']);
  });

  it('approves an in-review stage 1 product into stage 2 draft', async () => {
    const inReviewProduct = {
      ...baseProduct,
      status: ProductStatus.IN_REVIEW,
    };
    const updatedProduct = {
      ...baseProduct,
      currentStage: ProductStage.STAGE_2,
      status: ProductStatus.DRAFT,
    };

    const service = new ProductWorkflowService(
      {
        getClient: async () => ({
          query: async () => ({ rows: [] }),
          release: () => undefined,
        }),
      } as never,
      {
        findById: async () => inReviewProduct,
        update: async () => updatedProduct,
      } as never,
      {
        create: async (input: { outcome: WorkflowTransitionAction }) => ({
          id: 'gate-decision-id',
          outcome: input.outcome,
        }),
      } as never,
      {
        create: async (input: { action: WorkflowTransitionAction }) => ({
          id: 'audit-log-id',
          action: input.action,
        }),
      } as never,
    );

    const result = await service.transition(
      baseProduct.id,
      WorkflowTransitionAction.APPROVE,
      {
        id: 'head-of-product-id',
        role: UserRole.HEAD_OF_PRODUCT,
      },
      {},
    );

    assert.equal(result.product.currentStage, ProductStage.STAGE_2);
    assert.equal(result.product.status, ProductStatus.DRAFT);
  });

  it('rejects invalid status transitions', async () => {
    const service = new ProductWorkflowService(
      {
        getClient: async () => ({
          query: async () => ({ rows: [] }),
          release: () => undefined,
        }),
      } as never,
      {
        findById: async () => baseProduct,
      } as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(
      service.transition(
        baseProduct.id,
        WorkflowTransitionAction.APPROVE,
        {
          id: 'head-of-product-id',
          role: UserRole.HEAD_OF_PRODUCT,
        },
        {},
      ),
      BadRequestException,
    );
  });

  it('requires an override reason for admin support actions', async () => {
    const service = new ProductWorkflowService(
      {
        getClient: async () => ({
          query: async () => ({ rows: [] }),
          release: () => undefined,
        }),
      } as never,
      {
        findById: async () => baseProduct,
      } as never,
      {} as never,
      {} as never,
    );

    await assert.rejects(
      service.transition(
        baseProduct.id,
        WorkflowTransitionAction.SUBMIT,
        {
          id: 'admin-id',
          isAdminSupportOverride: true,
          role: UserRole.ADMIN,
        },
        {},
      ),
      BadRequestException,
    );
  });
});
