import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ConflictException, NotFoundException } from '@nestjs/common';

import { UserRole } from '../../../enums/user-role.enum';
import { UsersService } from '../services/users.service';
import type { UserRecord } from '../types/user-record.type';

describe('UsersService', () => {
  const baseUser: UserRecord = {
    createdAt: new Date('2026-04-15T00:00:00.000Z'),
    email: 'owner@example.com',
    fullName: 'Owner User',
    id: 'user-1',
    isActive: true,
    lastLoginAt: null,
    role: UserRole.PRODUCT_MANAGER,
    updatedAt: new Date('2026-04-15T00:00:00.000Z'),
  };

  it('creates a user when email is available', async () => {
    const findByEmailCalls: string[] = [];
    const createCalls: Array<{ email: string; fullName: string; id: string; isActive: boolean; role: UserRole }> = [];
    const repository = {
      create: async (input: {
        email: string;
        fullName: string;
        id: string;
        isActive: boolean;
        role: UserRole;
      }) => {
        createCalls.push(input);
        return baseUser;
      },
      findByEmail: async (email: string) => {
        findByEmailCalls.push(email);
        return null;
      },
    };
    const service = new UsersService(repository as never);

    const result = await service.create({
      email: baseUser.email,
      fullName: baseUser.fullName,
      role: baseUser.role,
    });

    assert.equal(findByEmailCalls.length, 1);
    assert.equal(findByEmailCalls[0], baseUser.email);
    assert.equal(createCalls.length, 1);
    assert.equal(createCalls[0]?.email, baseUser.email);
    assert.deepEqual(result, baseUser);
  });

  it('rejects duplicate emails', async () => {
    const repository = {
      findByEmail: async () => baseUser,
    };
    const service = new UsersService(repository as never);

    await assert.rejects(
      service.create({
        email: baseUser.email,
        fullName: baseUser.fullName,
        role: baseUser.role,
      }),
      ConflictException,
    );
  });

  it('returns a paginated list', async () => {
    const listCalls: Array<{
      isActive?: boolean;
      limit: number;
      offset: number;
      role?: UserRole;
    }> = [];
    const repository = {
      list: async (input: {
        isActive?: boolean;
        limit: number;
        offset: number;
        role?: UserRole;
      }) => {
        listCalls.push(input);
        return {
          rows: [baseUser],
          total: 1,
        };
      },
    };
    const service = new UsersService(repository as never);

    const result = await service.findAll({
      isActive: true,
      limit: 20,
      page: 1,
      role: UserRole.PRODUCT_MANAGER,
    });

    assert.deepEqual(listCalls[0], {
      isActive: true,
      limit: 20,
      offset: 0,
      role: UserRole.PRODUCT_MANAGER,
    });
    assert.equal(result.total, 1);
  });

  it('throws when a user does not exist', async () => {
    const repository = {
      findById: async () => null,
    };
    const service = new UsersService(repository as never);

    await assert.rejects(service.findOne('missing-user'), NotFoundException);
  });
});
