import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ProductCategory } from '../../src/enums/product-category.enum';
import { ProductStage } from '../../src/enums/product-stage.enum';
import { ProductStatus } from '../../src/enums/product-status.enum';
import { UserRole } from '../../src/enums/user-role.enum';
import { DashboardService } from '../../src/modules/dashboard/services/dashboard.service';
import type { DashboardRepositoryResult } from '../../src/modules/dashboard/types/dashboard.type';
import { testIds } from '../helpers/fixtures';

describe('DashboardService', () => {
  it('maps product aggregates into dashboard metrics, stages, and gate reviews', async () => {
    const service = new DashboardService({
      getDashboard: async () => createDashboardRepositoryResult(),
    } as never);

    const dashboard = await service.getDashboard({
      actingAsUserId: null,
      id: testIds.productOwner,
      isAdminSupportOverride: false,
      role: UserRole.PRODUCT_MANAGER,
    });

    assert.equal(dashboard.products.length, 3);
    assert.equal(dashboard.summary.activeProducts, 3);
    assert.equal(dashboard.summary.blockedActions, 1);
    assert.equal(dashboard.summary.gateQueue, 2);
    assert.equal(dashboard.summary.averageCycleDays, 5);
    assert.equal(dashboard.portfolioMix.aClass, 33);
    assert.equal(dashboard.stageHealth[0]?.count, 1);
    assert.equal(dashboard.products[0]?.owner, 'Aina Product');
    assert.equal(dashboard.products[0]?.myWork, true);
    assert.equal(
      dashboard.gateReviews.find(
        (review) => review.productName === 'Smart Fan Revamp',
      )?.state,
      'risk',
    );
  });
});

function createDashboardRepositoryResult(): DashboardRepositoryResult {
  return {
    products: [
      {
        category: ProductCategory.SDA,
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
        id: '00000000-0000-4000-8000-000000000101',
        ownerName: 'Aina Product',
        ownerUserId: testIds.productOwner,
        productCode: 'NPD-101',
        stage: ProductStage.STAGE_1,
        status: ProductStatus.IN_REVIEW,
        updatedAt: new Date('2026-04-04T00:00:00.000Z'),
        workingName: 'Glass Blender Plus',
      },
      {
        category: ProductCategory.FANS,
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
        id: '00000000-0000-4000-8000-000000000102',
        ownerName: 'Commercial Owner',
        ownerUserId: testIds.commercialOwner,
        productCode: 'NPD-102',
        stage: ProductStage.STAGE_4,
        status: ProductStatus.BLOCKED,
        updatedAt: new Date('2026-04-08T00:00:00.000Z'),
        workingName: 'Smart Fan Revamp',
      },
      {
        category: ProductCategory.MDA,
        createdAt: new Date('2026-04-01T00:00:00.000Z'),
        id: '00000000-0000-4000-8000-000000000103',
        ownerName: 'Finance Owner',
        ownerUserId: testIds.financeOwner,
        productCode: 'NPD-103',
        stage: ProductStage.STAGE_6,
        status: ProductStatus.DRAFT,
        updatedAt: new Date('2026-04-06T00:00:00.000Z'),
        workingName: 'Clearance SKU',
      },
    ],
    stageStatusCounts: [
      {
        count: 1,
        stage: ProductStage.STAGE_1,
        status: ProductStatus.IN_REVIEW,
      },
      {
        count: 1,
        stage: ProductStage.STAGE_4,
        status: ProductStatus.BLOCKED,
      },
      {
        count: 1,
        stage: ProductStage.STAGE_6,
        status: ProductStatus.DRAFT,
      },
    ],
  };
}
