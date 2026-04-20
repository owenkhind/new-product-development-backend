import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type { UserRole } from '../../../enums/user-role.enum';
import type { UserRecord } from '../types/user-record.type';

type UserRow = QueryResultRow & {
  created_at: Date;
  email: string;
  full_name: string;
  id: string;
  is_active: boolean;
  last_login_at: Date | null;
  role: UserRole;
  updated_at: Date;
};

type CreateUserInput = {
  email: string;
  fullName: string;
  id: string;
  isActive: boolean;
  role: UserRole;
};

type ListUsersFilters = {
  isActive?: boolean;
  limit: number;
  offset: number;
  role?: UserRole;
};

type UpdateUserInput = {
  email?: string;
  fullName?: string;
  isActive?: boolean;
  role?: UserRole;
};

@Injectable()
export class UsersRepository {
  private readonly tableName = qualifyTableName('users');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateUserInput): Promise<UserRecord> {
    const result = await this.databaseService.query<UserRow>(
      `
        INSERT INTO ${this.tableName} (
          id,
          email,
          full_name,
          role,
          is_active,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, email, full_name, role, is_active, created_at, updated_at, last_login_at
      `,
      [input.id, input.email, input.fullName, input.role, input.isActive],
    );

    return this.mapRow(result.rows[0]);
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const result = await this.databaseService.query<UserRow>(
      `
        SELECT id, email, full_name, role, is_active, created_at, updated_at, last_login_at
        FROM ${this.tableName}
        WHERE email = $1
        LIMIT 1
      `,
      [email],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const result = await this.databaseService.query<UserRow>(
      `
        SELECT id, email, full_name, role, is_active, created_at, updated_at, last_login_at
        FROM ${this.tableName}
        WHERE id = $1
        LIMIT 1
      `,
      [id],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async list(filters: ListUsersFilters): Promise<{ rows: UserRecord[]; total: number }> {
    const whereClauses: string[] = [];
    const params: unknown[] = [];

    if (filters.role) {
      params.push(filters.role);
      whereClauses.push(`role = $${params.length}`);
    }

    if (typeof filters.isActive === 'boolean') {
      params.push(filters.isActive);
      whereClauses.push(`is_active = $${params.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const countParams = [...params];

    params.push(filters.limit, filters.offset);

    const [countResult, rowsResult] = await Promise.all([
      this.databaseService.query<{ total: string }>(
        `
          SELECT COUNT(*)::text AS total
          FROM ${this.tableName}
          ${whereSql}
        `,
        countParams,
      ),
      this.databaseService.query<UserRow>(
        `
          SELECT id, email, full_name, role, is_active, created_at, updated_at, last_login_at
          FROM ${this.tableName}
          ${whereSql}
          ORDER BY created_at DESC
          LIMIT $${params.length - 1}
          OFFSET $${params.length}
        `,
        params,
      ),
    ]);

    return {
      rows: rowsResult.rows.map((row) => this.mapRow(row)),
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  }

  async update(id: string, input: UpdateUserInput): Promise<UserRecord | null> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.email !== undefined) {
      params.push(input.email);
      updates.push(`email = $${params.length}`);
    }

    if (input.fullName !== undefined) {
      params.push(input.fullName);
      updates.push(`full_name = $${params.length}`);
    }

    if (input.role !== undefined) {
      params.push(input.role);
      updates.push(`role = $${params.length}`);
    }

    if (input.isActive !== undefined) {
      params.push(input.isActive);
      updates.push(`is_active = $${params.length}`);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    params.push(id);

    const result = await this.databaseService.query<UserRow>(
      `
        UPDATE ${this.tableName}
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${params.length}
        RETURNING id, email, full_name, role, is_active, created_at, updated_at, last_login_at
      `,
      params,
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  private mapRow(row: UserRow | undefined): UserRecord {
    if (!row) {
      throw new Error('Expected a database row but received none.');
    }

    return {
      createdAt: row.created_at,
      email: row.email,
      fullName: row.full_name,
      id: row.id,
      isActive: row.is_active,
      lastLoginAt: row.last_login_at,
      role: row.role,
      updatedAt: row.updated_at,
    };
  }
}
