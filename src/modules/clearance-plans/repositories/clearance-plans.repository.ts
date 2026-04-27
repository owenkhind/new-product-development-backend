import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type {
  ClearanceAllocationRecord,
  ClearancePlanRecord,
  ClearancePricingRecord,
  ClearanceWeeklyTrackerRecord,
} from '../types/clearance-plan-record.type';

type ClearancePlanRow = QueryResultRow & {
  allocations: ClearanceAllocationRecord[] | null;
  created_at: Date;
  execution_instructions: string;
  id: string;
  pricing_rows: ClearancePricingRecord[] | null;
  product_id: string;
  summary: string;
  updated_at: Date;
  weekly_trackers: ClearanceWeeklyTrackerRecord[] | null;
};

type CreateClearancePlanInput = Omit<ClearancePlanRecord, 'createdAt' | 'updatedAt'>;
type UpdateClearancePlanInput = Partial<Omit<CreateClearancePlanInput, 'id' | 'productId'>>;

@Injectable()
export class ClearancePlansRepository {
  private readonly tableName = qualifyTableName('clearance_plans');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateClearancePlanInput): Promise<ClearancePlanRecord> {
    const result = await this.databaseService.query<ClearancePlanRow>(
      `
        INSERT INTO ${this.tableName} (
          id,
          product_id,
          summary,
          pricing_rows,
          allocations,
          execution_instructions,
          weekly_trackers,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7::jsonb, NOW(), NOW())
        RETURNING *
      `,
      [
        input.id,
        input.productId,
        input.summary,
        JSON.stringify(input.pricingRows),
        JSON.stringify(input.allocations),
        input.executionInstructions,
        JSON.stringify(input.weeklyTrackers),
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  async findByProductId(productId: string): Promise<ClearancePlanRecord | null> {
    const result = await this.databaseService.query<ClearancePlanRow>(
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

  async update(productId: string, input: UpdateClearancePlanInput): Promise<ClearancePlanRecord | null> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.summary !== undefined) {
      params.push(input.summary);
      updates.push(`summary = $${params.length}`);
    }

    if (input.pricingRows !== undefined) {
      params.push(JSON.stringify(input.pricingRows));
      updates.push(`pricing_rows = $${params.length}::jsonb`);
    }

    if (input.allocations !== undefined) {
      params.push(JSON.stringify(input.allocations));
      updates.push(`allocations = $${params.length}::jsonb`);
    }

    if (input.executionInstructions !== undefined) {
      params.push(input.executionInstructions);
      updates.push(`execution_instructions = $${params.length}`);
    }

    if (input.weeklyTrackers !== undefined) {
      params.push(JSON.stringify(input.weeklyTrackers));
      updates.push(`weekly_trackers = $${params.length}::jsonb`);
    }

    if (updates.length === 0) {
      return this.findByProductId(productId);
    }

    params.push(productId);

    const result = await this.databaseService.query<ClearancePlanRow>(
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

  private mapRow(row: ClearancePlanRow | undefined): ClearancePlanRecord {
    if (!row) {
      throw new Error('Expected a clearance plan row but received none.');
    }

    return {
      allocations: row.allocations ?? [],
      createdAt: row.created_at,
      executionInstructions: row.execution_instructions,
      id: row.id,
      pricingRows: row.pricing_rows ?? [],
      productId: row.product_id,
      summary: row.summary,
      updatedAt: row.updated_at,
      weeklyTrackers: row.weekly_trackers ?? [],
    };
  }
}
