import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type {
  WeeklyFeedbackItemRecord,
  WeeklyFeedbackLogRecord,
} from '../types/weekly-feedback-log-record.type';

type WeeklyFeedbackLogRow = QueryResultRow & {
  created_at: Date;
  id: string;
  items: WeeklyFeedbackItemRecord[] | null;
  product_id: string;
  summary: string;
  updated_at: Date;
  week_start_date: string;
};

type CreateWeeklyFeedbackLogInput = Omit<WeeklyFeedbackLogRecord, 'createdAt' | 'updatedAt'>;
type UpdateWeeklyFeedbackLogInput = Partial<Omit<CreateWeeklyFeedbackLogInput, 'id' | 'productId'>>;

@Injectable()
export class WeeklyFeedbackLogsRepository {
  private readonly tableName = qualifyTableName('weekly_feedback_logs');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateWeeklyFeedbackLogInput): Promise<WeeklyFeedbackLogRecord> {
    const result = await this.databaseService.query<WeeklyFeedbackLogRow>(
      `
        INSERT INTO ${this.tableName} (
          id,
          product_id,
          week_start_date,
          summary,
          items,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, NOW(), NOW())
        RETURNING *
      `,
      [input.id, input.productId, input.weekStartDate, input.summary, JSON.stringify(input.items)],
    );

    return this.mapRow(result.rows[0]);
  }

  async listByProductId(productId: string): Promise<WeeklyFeedbackLogRecord[]> {
    const result = await this.databaseService.query<WeeklyFeedbackLogRow>(
      `
        SELECT *
        FROM ${this.tableName}
        WHERE product_id = $1
        ORDER BY week_start_date DESC, created_at DESC
      `,
      [productId],
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  async findById(productId: string, logId: string): Promise<WeeklyFeedbackLogRecord | null> {
    const result = await this.databaseService.query<WeeklyFeedbackLogRow>(
      `
        SELECT *
        FROM ${this.tableName}
        WHERE product_id = $1
          AND id = $2
        LIMIT 1
      `,
      [productId, logId],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async update(
    productId: string,
    logId: string,
    input: UpdateWeeklyFeedbackLogInput,
  ): Promise<WeeklyFeedbackLogRecord | null> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.weekStartDate !== undefined) {
      params.push(input.weekStartDate);
      updates.push(`week_start_date = $${params.length}`);
    }

    if (input.summary !== undefined) {
      params.push(input.summary);
      updates.push(`summary = $${params.length}`);
    }

    if (input.items !== undefined) {
      params.push(JSON.stringify(input.items));
      updates.push(`items = $${params.length}::jsonb`);
    }

    if (updates.length === 0) {
      return this.findById(productId, logId);
    }

    params.push(productId, logId);

    const result = await this.databaseService.query<WeeklyFeedbackLogRow>(
      `
        UPDATE ${this.tableName}
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE product_id = $${params.length - 1}
          AND id = $${params.length}
        RETURNING *
      `,
      params,
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  private mapRow(row: WeeklyFeedbackLogRow | undefined): WeeklyFeedbackLogRecord {
    if (!row) {
      throw new Error('Expected a weekly feedback log row but received none.');
    }

    return {
      createdAt: row.created_at,
      id: row.id,
      items: row.items ?? [],
      productId: row.product_id,
      summary: row.summary,
      updatedAt: row.updated_at,
      weekStartDate: row.week_start_date,
    };
  }
}
