import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

import { ProductBrand } from '../../../enums/product-brand.enum';
import { ProductCategory } from '../../../enums/product-category.enum';
import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductStatus } from '../../../enums/product-status.enum';
import { UserRole } from '../../../enums/user-role.enum';
import { ProductsService } from '../services/products.service';
import type { ProductRecord } from '../types/product-record.type';

describe('ProductsService', () => {
  const baseProduct: ProductRecord = {
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

  const usersById = new Map([
    [
      'product-user-id',
      { id: 'product-user-id', isActive: true, role: UserRole.PRODUCT_MANAGER },
    ],
    [
      'commercial-user-id',
      { id: 'commercial-user-id', isActive: true, role: UserRole.GM_COMMERCIAL_OWNER },
    ],
    [
      'finance-user-id',
      { id: 'finance-user-id', isActive: true, role: UserRole.FINANCE_MANAGER },
    ],
    [
      'marketing-user-id',
      { id: 'marketing-user-id', isActive: true, role: UserRole.MARKETING_GTM_OWNER },
    ],
    [
      'cluster-user-id',
      { id: 'cluster-user-id', isActive: true, role: UserRole.CLUSTER_MANAGER },
    ],
    [
      'wrong-role-user-id',
      { id: 'wrong-role-user-id', isActive: true, role: UserRole.FINANCE_MANAGER },
    ],
  ]);

  it('creates a product when assignments are valid', async () => {
    const repository = {
      create: async () => baseProduct,
      findByProductCode: async () => null,
    };
    const usersRepository = {
      findById: async (id: string) => usersById.get(id) ?? null,
    };
    const service = new ProductsService(repository as never, usersRepository as never);

    const result = await service.create({
      brand: ProductBrand.KHIND,
      category: ProductCategory.FANS,
      clusterOwnerUserIds: ['cluster-user-id', 'cluster-user-id'],
      commercialOwnerUserId: 'commercial-user-id',
      description: 'Initial product draft',
      financeOwnerUserId: 'finance-user-id',
      marketingOwnerUserId: 'marketing-user-id',
      productCode: 'KPD-001',
      productOwnerUserId: 'product-user-id',
      workingName: 'Desk Fan Revamp',
    });

    assert.deepEqual(result, baseProduct);
  });

  it('rejects duplicate product codes', async () => {
    const repository = {
      findByProductCode: async () => baseProduct,
    };
    const usersRepository = {
      findById: async (id: string) => usersById.get(id) ?? null,
    };
    const service = new ProductsService(repository as never, usersRepository as never);

    await assert.rejects(
      service.create({
        brand: ProductBrand.KHIND,
        category: ProductCategory.FANS,
        productCode: 'KPD-001',
        productOwnerUserId: 'product-user-id',
        workingName: 'Desk Fan Revamp',
      }),
      ConflictException,
    );
  });

  it('rejects invalid assignment roles', async () => {
    const repository = {
      findByProductCode: async () => null,
    };
    const usersRepository = {
      findById: async (id: string) => usersById.get(id) ?? null,
    };
    const service = new ProductsService(repository as never, usersRepository as never);

    await assert.rejects(
      service.create({
        brand: ProductBrand.KHIND,
        category: ProductCategory.FANS,
        productOwnerUserId: 'wrong-role-user-id',
        workingName: 'Desk Fan Revamp',
      }),
      BadRequestException,
    );
  });

  it('throws when the product does not exist', async () => {
    const repository = {
      findById: async () => null,
    };
    const usersRepository = {
      findById: async (id: string) => usersById.get(id) ?? null,
    };
    const service = new ProductsService(repository as never, usersRepository as never);

    await assert.rejects(service.findOne('missing-product'), NotFoundException);
  });
});
