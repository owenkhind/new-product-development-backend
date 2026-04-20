import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type { CreateUserDto } from '../dto/create-user.dto';
import type { ListUsersQueryDto } from '../dto/list-users-query.dto';
import type { UpdateUserDto } from '../dto/update-user.dto';
import { UsersRepository } from '../repositories/users.repository';
import type { UserRecord } from '../types/user-record.type';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto): Promise<UserRecord> {
    const existingUser = await this.usersRepository.findByEmail(createUserDto.email);

    if (existingUser) {
      throw new ConflictException({
        code: 'USER_EMAIL_ALREADY_EXISTS',
        message: `A user with email ${createUserDto.email} already exists.`,
      });
    }

    return this.usersRepository.create({
      email: createUserDto.email,
      fullName: createUserDto.fullName,
      id: randomUUID(),
      isActive: createUserDto.isActive ?? true,
      role: createUserDto.role,
    });
  }

  async findAll(query: ListUsersQueryDto): Promise<{ rows: UserRecord[]; total: number }> {
    const limit = Math.min(query.limit, 100);
    const offset = (query.page - 1) * limit;

    return this.usersRepository.list({
      isActive: query.isActive,
      limit,
      offset,
      role: query.role,
    });
  }

  async findOne(id: string): Promise<UserRecord> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: `User ${id} was not found.`,
      });
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserRecord> {
    if (updateUserDto.email) {
      const existingUser = await this.usersRepository.findByEmail(updateUserDto.email);

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException({
          code: 'USER_EMAIL_ALREADY_EXISTS',
          message: `A user with email ${updateUserDto.email} already exists.`,
        });
      }
    }

    const user = await this.usersRepository.update(id, updateUserDto);

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: `User ${id} was not found.`,
      });
    }

    return user;
  }
}
