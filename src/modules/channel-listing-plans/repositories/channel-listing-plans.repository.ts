import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type {
  ChannelListingPlanChannelRecord,
  ChannelListingPlanRecord,
} from '../types/channel-listing-plan-record.type';

type ChannelListingPlanRow = QueryResultRow & {
  channels: ChannelListingPlanChannelRecord[] | null;
  created_at: Date;
  id: string;
  lazada_confirmed: boolean;
  product_id: string;
  shopee_confirmed: boolean;
  summary: string | null;
  updated_at: Date;
};

type CreateChannelListingPlanInput = Omit<ChannelListingPlanRecord, 'createdAt' | 'updatedAt'>;
type UpdateChannelListingPlanInput = Partial<Omit<CreateChannelListingPlanInput, 'id' | 'productId'>>;

@Injectable()
export class ChannelListingPlansRepository {
  private readonly tableName = qualifyTableName('channel_listing_plans');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateChannelListingPlanInput): Promise<ChannelListingPlanRecord> {
    const result = await this.databaseService.query<ChannelListingPlanRow>(
      `
        INSERT INTO ${this.tableName} (
          id,
          product_id,
          summary,
          shopee_confirmed,
          lazada_confirmed,
          channels,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, NOW(), NOW())
        RETURNING *
      `,
      [
        input.id,
        input.productId,
        input.summary,
        input.shopeeConfirmed,
        input.lazadaConfirmed,
        JSON.stringify(input.channels),
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  async findByProductId(productId: string): Promise<ChannelListingPlanRecord | null> {
    const result = await this.databaseService.query<ChannelListingPlanRow>(
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
    input: UpdateChannelListingPlanInput,
  ): Promise<ChannelListingPlanRecord | null> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.summary !== undefined) {
      params.push(input.summary);
      updates.push(`summary = $${params.length}`);
    }

    if (input.shopeeConfirmed !== undefined) {
      params.push(input.shopeeConfirmed);
      updates.push(`shopee_confirmed = $${params.length}`);
    }

    if (input.lazadaConfirmed !== undefined) {
      params.push(input.lazadaConfirmed);
      updates.push(`lazada_confirmed = $${params.length}`);
    }

    if (input.channels !== undefined) {
      params.push(JSON.stringify(input.channels));
      updates.push(`channels = $${params.length}::jsonb`);
    }

    if (updates.length === 0) {
      return this.findByProductId(productId);
    }

    params.push(productId);

    const result = await this.databaseService.query<ChannelListingPlanRow>(
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

  private mapRow(row: ChannelListingPlanRow | undefined): ChannelListingPlanRecord {
    if (!row) {
      throw new Error('Expected a channel listing plan row but received none.');
    }

    return {
      channels: row.channels ?? [],
      createdAt: row.created_at,
      id: row.id,
      lazadaConfirmed: row.lazada_confirmed,
      productId: row.product_id,
      shopeeConfirmed: row.shopee_confirmed,
      summary: row.summary,
      updatedAt: row.updated_at,
    };
  }
}
