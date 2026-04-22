import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ProductBrand } from '../../../enums/product-brand.enum';
import { ProductCategory } from '../../../enums/product-category.enum';
import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductStatus } from '../../../enums/product-status.enum';
import { ProductsController } from '../controllers/products.controller';
import { ProductsService } from '../services/products.service';

describe('ProductsController', () => {
  it('maps product records to API responses', async () => {
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

    const productsService = {
      create: async () => product,
    };
    const controller = new ProductsController(productsService as unknown as ProductsService);

    const response = await controller.create({
      brand: product.brand,
      category: product.category,
      clusterOwnerUserIds: product.clusterOwnerUserIds,
      commercialOwnerUserId: product.commercialOwnerUserId,
      description: product.description ?? undefined,
      financeOwnerUserId: product.financeOwnerUserId,
      marketingOwnerUserId: product.marketingOwnerUserId,
      productCode: product.productCode ?? undefined,
      productOwnerUserId: product.productOwnerUserId,
      status: product.status,
      workingName: product.workingName,
    });

    assert.deepEqual(response, {
      brand: product.brand,
      category: product.category,
      clusterOwnerUserIds: product.clusterOwnerUserIds,
      commercialOwnerUserId: product.commercialOwnerUserId,
      createdAt: product.createdAt,
      currentStage: product.currentStage,
      description: product.description,
      financeOwnerUserId: product.financeOwnerUserId,
      id: product.id,
      marketingOwnerUserId: product.marketingOwnerUserId,
      productCode: product.productCode,
      productOwnerUserId: product.productOwnerUserId,
      status: product.status,
      updatedAt: product.updatedAt,
      workingName: product.workingName,
    });
  });
});
