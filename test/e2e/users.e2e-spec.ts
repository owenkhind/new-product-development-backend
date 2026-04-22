import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { UserRole } from '../../src/enums/user-role.enum';
import { PoliciesGuard } from '../../src/guards/policies.guard';
import { CreateUserDto } from '../../src/modules/users/dto/create-user.dto';
import { UsersController } from '../../src/modules/users/controllers/users.controller';
import { UsersService } from '../../src/modules/users/services/users.service';
import { UsersRepository } from '../../src/modules/users/repositories/users.repository';
import { AuthorizationPolicyService } from '../../src/modules/authorization/services/authorization-policy.service';
import { createUserRecord, testIds } from '../helpers/fixtures';
import {
  createExecutionContext,
  createHttpTestApp,
  createValidationPipe,
} from '../helpers/create-http-test-app';

describe('Users module wiring (e2e)', () => {
  let app: Awaited<ReturnType<typeof createHttpTestApp>>['app'];
  let controller: UsersController;
  let guard: PoliciesGuard;

  const adminUser = createUserRecord({
    id: testIds.admin,
    role: UserRole.ADMIN,
  });
  const createdUser = createUserRecord();
  const usersService = {
    create: async () => createdUser,
    findAll: async () => ({
      rows: [createdUser],
      total: 1,
    }),
    findOne: async () => createdUser,
    update: async () => ({
      ...createdUser,
      fullName: 'Updated User',
    }),
  };

  before(async () => {
    const setup = await createHttpTestApp({
      controllers: [UsersController],
      providers: [
        PoliciesGuard,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: UsersRepository,
          useValue: {
            findById: async (id: string) => (id === testIds.admin ? adminUser : null),
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
    controller = new UsersController(usersService as never);
    guard = new PoliciesGuard(
      new Reflector(),
      {
        get: () => 'test',
      } as never,
      {
        findById: async (id: string) => (id === testIds.admin ? adminUser : null),
      } as never,
      {
        assertAuthorized: async () => undefined,
      } as never,
    );
  });

  after(async () => {
    await app.close();
  });

  it('rejects requests without a dev actor header', async () => {
    await assert.rejects(
      guard.canActivate(
        createExecutionContext({
          controllerClass: controller,
          handlerName: 'findAll',
          request: {
            headers: {},
            params: {},
          },
        }),
      ),
    );
  });

  it('applies the global validation rules for create payloads', async () => {
    const pipe = createValidationPipe();

    await assert.rejects(
      pipe.transform(
        {
          email: 'not-an-email',
          fullName: '',
          role: 'INVALID',
        },
        {
          data: '',
          metatype: CreateUserDto,
          type: 'body',
        },
      ),
    );
  });

  it('creates, lists, gets, and updates users through the wired module', async () => {
    await assert.doesNotReject(
      guard.canActivate(
        createExecutionContext({
          controllerClass: controller,
          handlerName: 'create',
          request: {
            headers: {
              'x-dev-user-id': testIds.admin,
            },
            params: {},
          },
        }),
      ),
    );

    const createResponse = await controller.create({
      email: createdUser.email,
      fullName: createdUser.fullName,
      role: createdUser.role,
    });
    const listResponse = await controller.findAll({
      limit: 20,
      page: 1,
    });
    const getResponse = await controller.findOne(createdUser.id);
    const updateResponse = await controller.update(createdUser.id, {
      fullName: 'Updated User',
    });

    assert.equal(createResponse.id, createdUser.id);
    assert.equal(listResponse.meta.total, 1);
    assert.equal(getResponse.id, createdUser.id);
    assert.equal(updateResponse.fullName, 'Updated User');
  });
});
