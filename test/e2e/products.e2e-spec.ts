import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { PoliciesGuard } from '../../src/guards/policies.guard';
import { CreateProductDto } from '../../src/modules/products/dto/create-product.dto';
import { ProductsController } from '../../src/modules/products/controllers/products.controller';
import { ProductsService } from '../../src/modules/products/services/products.service';
import { UsersRepository } from '../../src/modules/users/repositories/users.repository';
import { AuthorizationPolicyService } from '../../src/modules/authorization/services/authorization-policy.service';
import { createProductRecord, createUserRecord, testIds } from '../helpers/fixtures';
import {
  createExecutionContext,
  createHttpTestApp,
  createValidationPipe,
} from '../helpers/create-http-test-app';

describe('Products module wiring (e2e)', () => {
  let app: Awaited<ReturnType<typeof createHttpTestApp>>['app'];
  let controller: ProductsController;
  let guard: PoliciesGuard;

  const productManager = createUserRecord({
    id: testIds.productOwner,
  });
  const product = createProductRecord();
  const productsService = {
    create: async () => product,
    findAll: async () => ({
      rows: [product],
      total: 1,
    }),
    findOne: async () => product,
    update: async () => ({
      ...product,
      workingName: 'Updated Product',
    }),
  };

  before(async () => {
    const setup = await createHttpTestApp({
      controllers: [ProductsController],
      providers: [
        PoliciesGuard,
        {
          provide: ProductsService,
          useValue: productsService,
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
    controller = new ProductsController(productsService as never);
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

  it('applies the global validation rules for product creation payloads', async () => {
    const pipe = createValidationPipe();

    await assert.rejects(
      pipe.transform(
        {
          brand: 'INVALID',
          category: 'FANS',
          productOwnerUserId: 'bad-id',
          workingName: '',
        },
        {
          data: '',
          metatype: CreateProductDto,
          type: 'body',
        },
      ),
    );
  });

  it('creates, lists, gets, and updates products through the wired module', async () => {
    await assert.doesNotReject(
      guard.canActivate(
        createExecutionContext({
          controllerClass: controller,
          handlerName: 'create',
          request: {
            headers: {
              'x-dev-user-id': testIds.productOwner,
            },
            params: {},
          },
        }),
      ),
    );

    const createResponse = await controller.create({
      brand: product.brand,
      category: product.category,
      productOwnerUserId: testIds.productOwner,
      workingName: product.workingName,
    });
    const listResponse = await controller.findAll(
      {
        limit: 20,
        page: 1,
      },
      {
        user: {
          id: testIds.productOwner,
          role: productManager.role,
        },
      } as never,
    );
    const getResponse = await controller.findOne(product.id);
    const updateResponse = await controller.update(product.id, {
      workingName: 'Updated Product',
    });

    assert.equal(createResponse.id, product.id);
    assert.equal(listResponse.meta.total, 1);
    assert.equal(getResponse.id, product.id);
    assert.equal(updateResponse.workingName, 'Updated Product');
  });
});
