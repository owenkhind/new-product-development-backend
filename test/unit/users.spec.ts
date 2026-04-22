import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ConflictException, NotFoundException } from '@nestjs/common';

import { UserRole } from '../../src/enums/user-role.enum';
import { UsersController } from '../../src/modules/users/controllers/users.controller';
import { UsersService } from '../../src/modules/users/services/users.service';
import { createUserRecord, testIds } from '../helpers/fixtures';

describe('UsersController', () => {
  it('maps create responses', async () => {
    const user = createUserRecord();
    const controller = new UsersController({
      create: async () => user,
    } as never);

    const response = await controller.create({
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });

    assert.deepEqual(response, user);
  });

  it('maps list responses with pagination meta', async () => {
    const user = createUserRecord();
    const controller = new UsersController({
      findAll: async () => ({
        rows: [user],
        total: 1,
      }),
    } as never);

    const response = await controller.findAll({
      limit: 20,
      page: 1,
    });

    assert.deepEqual(response, {
      data: [user],
      meta: {
        limit: 20,
        page: 1,
        total: 1,
      },
    });
  });

  it('maps single-record and update responses', async () => {
    const user = createUserRecord({
      fullName: 'Updated User',
    });
    const controller = new UsersController({
      findOne: async () => user,
      update: async () => user,
    } as never);

    assert.deepEqual(await controller.findOne(user.id), user);
    assert.deepEqual(await controller.update(user.id, { fullName: user.fullName }), user);
  });
});

describe('UsersService', () => {
  it('creates a user with default active status', async () => {
    const createdInputs: Array<{
      email: string;
      fullName: string;
      id: string;
      isActive: boolean;
      role: UserRole;
    }> = [];
    const baseUser = createUserRecord();
    const service = new UsersService({
      create: async (input: {
        email: string;
        fullName: string;
        id: string;
        isActive: boolean;
        role: UserRole;
      }) => {
        createdInputs.push(input);
        return baseUser;
      },
      findByEmail: async () => null,
    } as never);

    const result = await service.create({
      email: baseUser.email,
      fullName: baseUser.fullName,
      role: baseUser.role,
    });

    assert.equal(createdInputs.length, 1);
    assert.equal(createdInputs[0]?.isActive, true);
    assert.match(createdInputs[0]?.id ?? '', /^[0-9a-f-]{36}$/i);
    assert.deepEqual(result, baseUser);
  });

  it('preserves explicit active state on create', async () => {
    const createdInputs: Array<{ isActive: boolean }> = [];
    const baseUser = createUserRecord({
      isActive: false,
    });
    const service = new UsersService({
      create: async (input: {
        email: string;
        fullName: string;
        id: string;
        isActive: boolean;
        role: UserRole;
      }) => {
        createdInputs.push(input);
        return baseUser;
      },
      findByEmail: async () => null,
    } as never);

    await service.create({
      email: baseUser.email,
      fullName: baseUser.fullName,
      isActive: false,
      role: baseUser.role,
    });

    assert.equal(createdInputs[0]?.isActive, false);
  });

  it('rejects duplicate emails on create', async () => {
    const baseUser = createUserRecord();
    const service = new UsersService({
      findByEmail: async () => baseUser,
    } as never);

    await assert.rejects(
      service.create({
        email: baseUser.email,
        fullName: baseUser.fullName,
        role: baseUser.role,
      }),
      ConflictException,
    );
  });

  it('caps list limits and calculates offset', async () => {
    const listCalls: Array<{
      isActive?: boolean;
      limit: number;
      offset: number;
      role?: UserRole;
    }> = [];
    const service = new UsersService({
      list: async (input: {
        isActive?: boolean;
        limit: number;
        offset: number;
        role?: UserRole;
      }) => {
        listCalls.push(input);
        return {
          rows: [createUserRecord()],
          total: 1,
        };
      },
    } as never);

    await service.findAll({
      isActive: true,
      limit: 500,
      page: 3,
      role: UserRole.PRODUCT_MANAGER,
    });

    assert.deepEqual(listCalls[0], {
      isActive: true,
      limit: 100,
      offset: 200,
      role: UserRole.PRODUCT_MANAGER,
    });
  });

  it('throws when a requested user does not exist', async () => {
    const service = new UsersService({
      findById: async () => null,
    } as never);

    await assert.rejects(service.findOne(testIds.productOwner), NotFoundException);
  });

  it('rejects duplicate emails on update for another user', async () => {
    const baseUser = createUserRecord();
    const service = new UsersService({
      findByEmail: async () => baseUser,
    } as never);

    await assert.rejects(
      service.update(testIds.admin, {
        email: baseUser.email,
      }),
      ConflictException,
    );
  });

  it('updates a user when the email is still unique', async () => {
    const updatedUser = createUserRecord({
      fullName: 'Updated User',
    });
    const service = new UsersService({
      findByEmail: async () => null,
      update: async () => updatedUser,
    } as never);

    const result = await service.update(updatedUser.id, {
      fullName: updatedUser.fullName,
    });

    assert.deepEqual(result, updatedUser);
  });

  it('throws when updating a missing user', async () => {
    const service = new UsersService({
      update: async () => null,
    } as never);

    await assert.rejects(
      service.update(testIds.productOwner, {
        fullName: 'Missing User',
      }),
      NotFoundException,
    );
  });
});
