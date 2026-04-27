import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import { Day30PerformanceFlag } from '../../../enums/day-30-performance-flag.enum';
import { Day30Verdict } from '../../../enums/day-30-verdict.enum';
import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type { Day30ReviewChannelGpRecord, Day30ReviewRecord } from '../types/day-30-review-record.type';

type Day30ReviewRow = QueryResultRow & {
  action_plan: string;
  actual_revenue: string;
  actual_sell_through_units: number;
  channel_gp: Day30ReviewChannelGpRecord[] | null;
  created_at: Date;
  flags: Day30PerformanceFlag[] | null;
  id: string;
  product_id: string;
  review_summary: string;
  target_revenue: string;
  target_sell_through_units: number;
  updated_at: Date;
  verdict: Day30Verdict;
};

type CreateDay30ReviewInput = Omit<Day30ReviewRecord, 'createdAt' | 'updatedAt'>;
type UpdateDay30ReviewInput = Partial<Omit<CreateDay30ReviewInput, 'id' | 'productId'>>;

@Injectable()
export class Day30ReviewsRepository {
  private readonly tableName = qualifyTableName('day_30_reviews');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateDay30ReviewInput): Promise<Day30ReviewRecord> {
    const result = await this.databaseService.query<Day30ReviewRow>(
      `
        INSERT INTO ${this.tableName} (
          id,
          product_id,
          review_summary,
          target_sell_through_units,
          actual_sell_through_units,
          target_revenue,
          actual_revenue,
          verdict,
          action_plan,
          flags,
          channel_gp,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, NOW(), NOW())
        RETURNING *
      `,
      [
        input.id,
        input.productId,
        input.reviewSummary,
        input.targetSellThroughUnits,
        input.actualSellThroughUnits,
        input.targetRevenue,
        input.actualRevenue,
        input.verdict,
        input.actionPlan,
        input.flags,
        JSON.stringify(input.channelGp),
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  async findByProductId(productId: string): Promise<Day30ReviewRecord | null> {
    const result = await this.databaseService.query<Day30ReviewRow>(
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

  async update(productId: string, input: UpdateDay30ReviewInput): Promise<Day30ReviewRecord | null> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.reviewSummary !== undefined) {
      params.push(input.reviewSummary);
      updates.push(`review_summary = $${params.length}`);
    }

    if (input.targetSellThroughUnits !== undefined) {
      params.push(input.targetSellThroughUnits);
      updates.push(`target_sell_through_units = $${params.length}`);
    }

    if (input.actualSellThroughUnits !== undefined) {
      params.push(input.actualSellThroughUnits);
      updates.push(`actual_sell_through_units = $${params.length}`);
    }

    if (input.targetRevenue !== undefined) {
      params.push(input.targetRevenue);
      updates.push(`target_revenue = $${params.length}`);
    }

    if (input.actualRevenue !== undefined) {
      params.push(input.actualRevenue);
      updates.push(`actual_revenue = $${params.length}`);
    }

    if (input.verdict !== undefined) {
      params.push(input.verdict);
      updates.push(`verdict = $${params.length}`);
    }

    if (input.actionPlan !== undefined) {
      params.push(input.actionPlan);
      updates.push(`action_plan = $${params.length}`);
    }

    if (input.flags !== undefined) {
      params.push(input.flags);
      updates.push(`flags = $${params.length}`);
    }

    if (input.channelGp !== undefined) {
      params.push(JSON.stringify(input.channelGp));
      updates.push(`channel_gp = $${params.length}::jsonb`);
    }

    if (updates.length === 0) {
      return this.findByProductId(productId);
    }

    params.push(productId);

    const result = await this.databaseService.query<Day30ReviewRow>(
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

  private mapRow(row: Day30ReviewRow | undefined): Day30ReviewRecord {
    if (!row) {
      throw new Error('Expected a day 30 review row but received none.');
    }

    return {
      actionPlan: row.action_plan,
      actualRevenue: row.actual_revenue,
      actualSellThroughUnits: row.actual_sell_through_units,
      channelGp: row.channel_gp ?? [],
      createdAt: row.created_at,
      flags: row.flags ?? [],
      id: row.id,
      productId: row.product_id,
      reviewSummary: row.review_summary,
      targetRevenue: row.target_revenue,
      targetSellThroughUnits: row.target_sell_through_units,
      updatedAt: row.updated_at,
      verdict: row.verdict,
    };
  }
}
