import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type { ChannelPricingRecord, ChannelPricingRowRecord } from '../types/channel-pricing-record.type';

type ChannelPricingRow = QueryResultRow & {
  created_at: Date;
  currency: string;
  id: string;
  notes: string | null;
  pricing_rows: ChannelPricingRowRecord[] | null;
  product_id: string;
  updated_at: Date;
};

type CreateChannelPricingInput = Omit<ChannelPricingRecord, 'createdAt' | 'updatedAt'>;
type UpdateChannelPricingInput = Partial<Omit<CreateChannelPricingInput, 'id' | 'productId'>>;

@Injectable()
export class ChannelPricingRepository {
  private readonly tableName = qualifyTableName('channel_pricing');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateChannelPricingInput): Promise<ChannelPricingRecord> {
    const result = await this.databaseService.query<ChannelPricingRow>(
      `
        INSERT INTO ${this.tableName} (
          id,
          product_id,
          currency,
          notes,
          pricing_rows,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, NOW(), NOW())
        RETURNING *
      `,
      [
        input.id,
        input.productId,
        input.currency,
        input.notes,
        JSON.stringify(input.pricingRows),
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  async findByProductId(productId: string): Promise<ChannelPricingRecord | null> {
    const result = await this.databaseService.query<ChannelPricingRow>(
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

  async update(productId: string, input: UpdateChannelPricingInput): Promise<ChannelPricingRecord | null> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.currency !== undefined) {
      params.push(input.currency);
      updates.push(`currency = $${params.length}`);
    }

    if (input.notes !== undefined) {
      params.push(input.notes);
      updates.push(`notes = $${params.length}`);
    }

    if (input.pricingRows !== undefined) {
      params.push(JSON.stringify(input.pricingRows));
      updates.push(`pricing_rows = $${params.length}::jsonb`);
    }

    if (updates.length === 0) {
      return this.findByProductId(productId);
    }

    params.push(productId);

    const result = await this.databaseService.query<ChannelPricingRow>(
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

  private mapRow(row: ChannelPricingRow | undefined): ChannelPricingRecord {
    if (!row) {
      throw new Error('Expected a channel pricing row but received none.');
    }

    return {
      createdAt: row.created_at,
      currency: row.currency,
      id: row.id,
      notes: row.notes,
      pricingRows: row.pricing_rows ?? [],
      productId: row.product_id,
      updatedAt: row.updated_at,
    };
  }
}
