import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ForbiddenException } from '@nestjs/common';

import { PolicyResource } from '../../../enums/policy-resource.enum';
import { ProductBrand } from '../../../enums/product-brand.enum';
import { ProductCategory } from '../../../enums/product-category.enum';
import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductStatus } from '../../../enums/product-status.enum';
import { StageAction } from '../../../enums/stage-action.enum';
import { UserRole } from '../../../enums/user-role.enum';
import { AuthorizationPolicyService } from '../services/authorization-policy.service';

describe('AuthorizationPolicyService', () => {
  const product = {
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

  it('allows assigned finance owners to edit their product', async () => {
    const service = new AuthorizationPolicyService(
      {} as never,
      {
        findById: async () => product,
      } as never,
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: 'finance-user-id',
          role: UserRole.FINANCE_MANAGER,
        },
        resource: PolicyResource.PRODUCTS,
        targetId: product.id,
      }),
    );
  });

  it('rejects unassigned product editors', async () => {
    const service = new AuthorizationPolicyService(
      {} as never,
      {
        findById: async () => product,
      } as never,
    );

    await assert.rejects(
      service.assertAuthorized({
        action: StageAction.EDIT,
        actor: {
          id: 'other-finance-user-id',
          role: UserRole.FINANCE_MANAGER,
        },
        resource: PolicyResource.PRODUCTS,
        targetId: product.id,
      }),
      ForbiddenException,
    );
  });

  it('allows oversight roles to view any product', async () => {
    const service = new AuthorizationPolicyService(
      {} as never,
      {
        findById: async () => product,
      } as never,
    );

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.VIEW,
        actor: {
          id: 'head-of-product-id',
          role: UserRole.HEAD_OF_PRODUCT,
        },
        resource: PolicyResource.PRODUCTS,
        targetId: product.id,
      }),
    );
  });

  it('allows users to view their own user record', async () => {
    const service = new AuthorizationPolicyService({} as never, {} as never);

    await assert.doesNotReject(
      service.assertAuthorized({
        action: StageAction.VIEW,
        actor: {
          id: 'user-1',
          role: UserRole.PRODUCT_MANAGER,
        },
        resource: PolicyResource.USERS,
        targetId: 'user-1',
      }),
    );
  });

  it('rejects non-admin access to other user records', async () => {
    const service = new AuthorizationPolicyService({} as never, {} as never);

    await assert.rejects(
      service.assertAuthorized({
        action: StageAction.VIEW,
        actor: {
          id: 'user-1',
          role: UserRole.PRODUCT_MANAGER,
        },
        resource: PolicyResource.USERS,
        targetId: 'user-2',
      }),
      ForbiddenException,
    );
  });
});
