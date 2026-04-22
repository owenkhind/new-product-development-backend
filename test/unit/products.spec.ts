import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

import { ProductBrand } from '../../src/enums/product-brand.enum';
import { ProductCategory } from '../../src/enums/product-category.enum';
import { ProductStage } from '../../src/enums/product-stage.enum';
import { ProductStatus } from '../../src/enums/product-status.enum';
import { UserRole } from '../../src/enums/user-role.enum';
import { ProductsController } from '../../src/modules/products/controllers/products.controller';
import { ProductsService } from '../../src/modules/products/services/products.service';
import { createProductRecord, testIds } from '../helpers/fixtures';

describe('ProductsController', () => {
  it('maps create responses', async () => {
    const product = createProductRecord();
    const controller = new ProductsController({
      create: async () => product,
    } as never);

    const response = await controller.create({
      brand: product.brand,
      category: product.category,
      productOwnerUserId: product.productOwnerUserId,
      workingName: product.workingName,
    });

    assert.deepEqual(response, product);
  });

  it('maps list responses and forwards request.user', async () => {
    const product = createProductRecord();
    const calls: Array<{ actorId: string; queryLimit: number }> = [];
    const controller = new ProductsController({
      findAll: async (
        query: {
          limit: number;
        },
        actor: {
          id: string;
        },
      ) => {
        calls.push({
          actorId: actor.id,
          queryLimit: query.limit,
        });

        return {
          rows: [product],
          total: 1,
        };
      },
    } as never);

    const response = await controller.findAll(
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

    assert.equal(calls[0]?.actorId, testIds.productOwner);
    assert.deepEqual(response, {
      data: [product],
      meta: {
        limit: 20,
        page: 1,
        total: 1,
      },
    });
  });

  it('maps single-record and update responses', async () => {
    const product = createProductRecord({
      workingName: 'Updated Product',
    });
    const controller = new ProductsController({
      findOne: async () => product,
      update: async () => product,
    } as never);

    assert.deepEqual(await controller.findOne(product.id), product);
    assert.deepEqual(await controller.update(product.id, { workingName: product.workingName }), product);
  });
});

describe('ProductsService', () => {
  const usersById = new Map([
    [
      testIds.productOwner,
      { id: testIds.productOwner, isActive: true, role: UserRole.PRODUCT_MANAGER },
    ],
    [
      testIds.commercialOwner,
      { id: testIds.commercialOwner, isActive: true, role: UserRole.GM_COMMERCIAL_OWNER },
    ],
    [
      testIds.financeOwner,
      { id: testIds.financeOwner, isActive: true, role: UserRole.FINANCE_MANAGER },
    ],
    [
      testIds.marketingOwner,
      { id: testIds.marketingOwner, isActive: true, role: UserRole.MARKETING_GTM_OWNER },
    ],
    [
      testIds.clusterManager,
      { id: testIds.clusterManager, isActive: true, role: UserRole.CLUSTER_MANAGER },
    ],
    [testIds.admin, { id: testIds.admin, isActive: false, role: UserRole.CLUSTER_MANAGER }],
  ]);

  it('creates a product with default stage/status and deduplicated cluster owners', async () => {
    const createdInputs: Array<{
      clusterOwnerUserIds: string[];
      currentStage: ProductStage;
      status: ProductStatus;
    }> = [];
    const product = createProductRecord();
    const service = new ProductsService(
      {
        create: async (input: {
          brand: ProductBrand;
          category: ProductCategory;
          clusterOwnerUserIds: string[];
          commercialOwnerUserId: string | null;
          currentStage: ProductStage;
          description: string | null;
          financeOwnerUserId: string | null;
          id: string;
          marketingOwnerUserId: string | null;
          productCode: string | null;
          productOwnerUserId: string;
          status: ProductStatus;
          workingName: string;
        }) => {
          createdInputs.push(input);
          return product;
        },
        findByProductCode: async () => null,
      } as never,
      {
        findById: async (id: string) => usersById.get(id) ?? null,
      } as never,
    );

    const result = await service.create({
      brand: ProductBrand.KHIND,
      category: ProductCategory.FANS,
      clusterOwnerUserIds: [testIds.clusterManager, testIds.clusterManager],
      commercialOwnerUserId: testIds.commercialOwner,
      financeOwnerUserId: testIds.financeOwner,
      marketingOwnerUserId: testIds.marketingOwner,
      productOwnerUserId: testIds.productOwner,
      workingName: product.workingName,
    });

    assert.deepEqual(createdInputs[0]?.clusterOwnerUserIds, [testIds.clusterManager]);
    assert.equal(createdInputs[0]?.currentStage, ProductStage.STAGE_1);
    assert.equal(createdInputs[0]?.status, ProductStatus.DRAFT);
    assert.deepEqual(result, product);
  });

  it('rejects duplicate product codes', async () => {
    const product = createProductRecord();
    const service = new ProductsService(
      {
        findByProductCode: async () => product,
      } as never,
      {
        findById: async (id: string) => usersById.get(id) ?? null,
      } as never,
    );

    await assert.rejects(
      service.create({
        brand: ProductBrand.KHIND,
        category: ProductCategory.FANS,
        productCode: product.productCode ?? undefined,
        productOwnerUserId: testIds.productOwner,
        workingName: product.workingName,
      }),
      ConflictException,
    );
  });

  it('rejects missing assigned users', async () => {
    const service = new ProductsService(
      {
        findByProductCode: async () => null,
      } as never,
      {
        findById: async () => null,
      } as never,
    );

    await assert.rejects(
      service.create({
        brand: ProductBrand.KHIND,
        category: ProductCategory.FANS,
        productOwnerUserId: testIds.productOwner,
        workingName: 'Desk Fan Revamp',
      }),
      NotFoundException,
    );
  });

  it('rejects inactive assigned users', async () => {
    const service = new ProductsService(
      {
        findByProductCode: async () => null,
      } as never,
      {
        findById: async () => usersById.get(testIds.admin) ?? null,
      } as never,
    );

    await assert.rejects(
      service.create({
        brand: ProductBrand.KHIND,
        category: ProductCategory.FANS,
        clusterOwnerUserIds: [testIds.admin],
        productOwnerUserId: testIds.productOwner,
        workingName: 'Desk Fan Revamp',
      }),
      BadRequestException,
    );
  });

  it('rejects invalid assignment roles', async () => {
    const service = new ProductsService(
      {
        findByProductCode: async () => null,
      } as never,
      {
        findById: async () => ({
          id: testIds.financeOwner,
          isActive: true,
          role: UserRole.FINANCE_MANAGER,
        }),
      } as never,
    );

    await assert.rejects(
      service.create({
        brand: ProductBrand.KHIND,
        category: ProductCategory.FANS,
        productOwnerUserId: testIds.financeOwner,
        workingName: 'Desk Fan Revamp',
      }),
      BadRequestException,
    );
  });

  it('passes actor and capped pagination into list queries', async () => {
    const listCalls: Array<{
      actorId: string;
      actorRole: UserRole;
      limit: number;
      offset: number;
    }> = [];
    const service = new ProductsService(
      {
        list: async (input: {
          actorId: string;
          actorRole: UserRole;
          brand?: ProductBrand;
          category?: ProductCategory;
          limit: number;
          offset: number;
          productOwnerUserId?: string;
          stage?: ProductStage;
          status?: ProductStatus;
        }) => {
          listCalls.push(input);
          return {
            rows: [createProductRecord()],
            total: 1,
          };
        },
      } as never,
      {} as never,
    );

    await service.findAll(
      {
        limit: 500,
        page: 2,
      },
      {
        id: testIds.productOwner,
        role: UserRole.PRODUCT_MANAGER,
      },
    );

    assert.equal(listCalls[0]?.actorId, testIds.productOwner);
    assert.equal(listCalls[0]?.actorRole, UserRole.PRODUCT_MANAGER);
    assert.equal(listCalls[0]?.limit, 100);
    assert.equal(listCalls[0]?.offset, 100);
  });

  it('throws when the product does not exist on lookup', async () => {
    const service = new ProductsService(
      {
        findById: async () => null,
      } as never,
      {} as never,
    );

    await assert.rejects(service.findOne(testIds.product), NotFoundException);
  });

  it('rejects duplicate product codes on update for another product', async () => {
    const existingProduct = createProductRecord({
      id: testIds.admin,
    });
    const service = new ProductsService(
      {
        findByProductCode: async () => existingProduct,
      } as never,
      {
        findById: async (id: string) => usersById.get(id) ?? null,
      } as never,
    );

    await assert.rejects(
      service.update(testIds.product, {
        productCode: existingProduct.productCode ?? undefined,
      }),
      ConflictException,
    );
  });

  it('updates products with deduplicated cluster owners', async () => {
    const updatedProduct = createProductRecord({
      clusterOwnerUserIds: [testIds.clusterManager],
      workingName: 'Updated Product',
    });
    const updateCalls: Array<{ clusterOwnerUserIds?: string[]; workingName?: string }> = [];
    const service = new ProductsService(
      {
        findByProductCode: async () => null,
        update: async (
          _id: string,
          input: {
            brand?: ProductBrand;
            category?: ProductCategory;
            clusterOwnerUserIds?: string[];
            commercialOwnerUserId?: string | null;
            currentStage?: ProductStage;
            description?: string | null;
            financeOwnerUserId?: string | null;
            marketingOwnerUserId?: string | null;
            productCode?: string | null;
            productOwnerUserId?: string | null;
            status?: ProductStatus;
            workingName?: string;
          },
        ) => {
          updateCalls.push(input);
          return updatedProduct;
        },
      } as never,
      {
        findById: async (id: string) => usersById.get(id) ?? null,
      } as never,
    );

    const result = await service.update(testIds.product, {
      clusterOwnerUserIds: [testIds.clusterManager, testIds.clusterManager],
      workingName: updatedProduct.workingName,
    });

    assert.deepEqual(updateCalls[0]?.clusterOwnerUserIds, [testIds.clusterManager]);
    assert.equal(updateCalls[0]?.workingName, 'Updated Product');
    assert.deepEqual(result, updatedProduct);
  });

  it('throws when updating a missing product', async () => {
    const service = new ProductsService(
      {
        findByProductCode: async () => null,
        update: async () => null,
      } as never,
      {
        findById: async (id: string) => usersById.get(id) ?? null,
      } as never,
    );

    await assert.rejects(
      service.update(testIds.product, {
        workingName: 'Missing Product',
      }),
      NotFoundException,
    );
  });
});
