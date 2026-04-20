import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { UserRole } from '../../../enums/user-role.enum';
import { UsersController } from '../controllers/users.controller';
import { UsersService } from '../services/users.service';

describe('UsersController', () => {
  it('maps service records to API responses', async () => {
    const user = {
      createdAt: new Date('2026-04-15T00:00:00.000Z'),
      email: 'owner@example.com',
      fullName: 'Owner User',
      id: 'user-1',
      isActive: true,
      lastLoginAt: null,
      role: UserRole.PRODUCT_MANAGER,
      updatedAt: new Date('2026-04-15T00:00:00.000Z'),
    };

    const usersService = {
      create: async () => user,
    };
    const controller = new UsersController(usersService as unknown as UsersService);

    const response = await controller.create({
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });

    assert.deepEqual(response, {
      createdAt: user.createdAt,
      email: user.email,
      fullName: user.fullName,
      id: user.id,
      isActive: true,
      lastLoginAt: null,
      role: user.role,
      updatedAt: user.updatedAt,
    });
  });
});
