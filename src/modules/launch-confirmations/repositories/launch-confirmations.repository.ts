import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type {
  LaunchConfirmationChannelRecord,
  LaunchConfirmationRecord,
} from '../types/launch-confirmation-record.type';

type LaunchConfirmationRow = QueryResultRow & {
  channels: LaunchConfirmationChannelRecord[] | null;
  created_at: Date;
  id: string;
  launch_date: string;
  notes: string | null;
  product_id: string;
  updated_at: Date;
};

type CreateLaunchConfirmationInput = Omit<LaunchConfirmationRecord, 'createdAt' | 'updatedAt'>;
type UpdateLaunchConfirmationInput = Partial<Omit<CreateLaunchConfirmationInput, 'id' | 'productId'>>;

@Injectable()
export class LaunchConfirmationsRepository {
  private readonly tableName = qualifyTableName('launch_confirmations');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateLaunchConfirmationInput): Promise<LaunchConfirmationRecord> {
    const result = await this.databaseService.query<LaunchConfirmationRow>(
      `
        INSERT INTO ${this.tableName} (
          id,
          product_id,
          launch_date,
          notes,
          channels,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, NOW(), NOW())
        RETURNING *
      `,
      [input.id, input.productId, input.launchDate, input.notes, JSON.stringify(input.channels)],
    );

    return this.mapRow(result.rows[0]);
  }

  async findByProductId(productId: string): Promise<LaunchConfirmationRecord | null> {
    const result = await this.databaseService.query<LaunchConfirmationRow>(
      `
        SELECT *
        FROM ${this.tableName}
        WHERE product_id = $1
        LIMIT 1
      `,
      [productId],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async update(
    productId: string,
    input: UpdateLaunchConfirmationInput,
  ): Promise<LaunchConfirmationRecord | null> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.launchDate !== undefined) {
      params.push(input.launchDate);
      updates.push(`launch_date = $${params.length}`);
    }

    if (input.notes !== undefined) {
      params.push(input.notes);
      updates.push(`notes = $${params.length}`);
    }

    if (input.channels !== undefined) {
      params.push(JSON.stringify(input.channels));
      updates.push(`channels = $${params.length}::jsonb`);
    }

    if (updates.length === 0) {
      return this.findByProductId(productId);
    }

    params.push(productId);

    const result = await this.databaseService.query<LaunchConfirmationRow>(
      `
        UPDATE ${this.tableName}
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE product_id = $${params.length}
        RETURNING *
      `,
      params,
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  private mapRow(row: LaunchConfirmationRow | undefined): LaunchConfirmationRecord {
    if (!row) {
      throw new Error('Expected a launch confirmation row but received none.');
    }

    return {
      channels: row.channels ?? [],
      createdAt: row.created_at,
      id: row.id,
      launchDate: row.launch_date,
      notes: row.notes,
      productId: row.product_id,
      updatedAt: row.updated_at,
    };
  }
}
