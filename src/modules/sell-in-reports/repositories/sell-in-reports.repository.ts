import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type { SellInReportAccountRecord, SellInReportRecord } from '../types/sell-in-report-record.type';

type SellInReportRow = QueryResultRow & {
  accounts: SellInReportAccountRecord[] | null;
  created_at: Date;
  id: string;
  notes: string | null;
  product_id: string;
  report_period_end: string;
  report_period_start: string;
  total_sell_in_units: number;
  total_sell_in_value: string;
  updated_at: Date;
};

type CreateSellInReportInput = Omit<SellInReportRecord, 'createdAt' | 'updatedAt'>;
type UpdateSellInReportInput = Partial<Omit<CreateSellInReportInput, 'id' | 'productId'>>;

@Injectable()
export class SellInReportsRepository {
  private readonly tableName = qualifyTableName('sell_in_reports');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateSellInReportInput): Promise<SellInReportRecord> {
    const result = await this.databaseService.query<SellInReportRow>(
      `
        INSERT INTO ${this.tableName} (
          id,
          product_id,
          report_period_start,
          report_period_end,
          notes,
          total_sell_in_units,
          total_sell_in_value,
          accounts,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW(), NOW())
        RETURNING *
      `,
      [
        input.id,
        input.productId,
        input.reportPeriodStart,
        input.reportPeriodEnd,
        input.notes,
        input.totalSellInUnits,
        input.totalSellInValue,
        JSON.stringify(input.accounts),
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  async listByProductId(productId: string): Promise<SellInReportRecord[]> {
    const result = await this.databaseService.query<SellInReportRow>(
      `
        SELECT *
        FROM ${this.tableName}
        WHERE product_id = $1
        ORDER BY report_period_start DESC, created_at DESC
      `,
      [productId],
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  async findById(productId: string, reportId: string): Promise<SellInReportRecord | null> {
    const result = await this.databaseService.query<SellInReportRow>(
      `
        SELECT *
        FROM ${this.tableName}
        WHERE product_id = $1
          AND id = $2
        LIMIT 1
      `,
      [productId, reportId],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async update(
    productId: string,
    reportId: string,
    input: UpdateSellInReportInput,
  ): Promise<SellInReportRecord | null> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.reportPeriodStart !== undefined) {
      params.push(input.reportPeriodStart);
      updates.push(`report_period_start = $${params.length}`);
    }

    if (input.reportPeriodEnd !== undefined) {
      params.push(input.reportPeriodEnd);
      updates.push(`report_period_end = $${params.length}`);
    }

    if (input.notes !== undefined) {
      params.push(input.notes);
      updates.push(`notes = $${params.length}`);
    }

    if (input.totalSellInUnits !== undefined) {
      params.push(input.totalSellInUnits);
      updates.push(`total_sell_in_units = $${params.length}`);
    }

    if (input.totalSellInValue !== undefined) {
      params.push(input.totalSellInValue);
      updates.push(`total_sell_in_value = $${params.length}`);
    }

    if (input.accounts !== undefined) {
      params.push(JSON.stringify(input.accounts));
      updates.push(`accounts = $${params.length}::jsonb`);
    }

    if (updates.length === 0) {
      return this.findById(productId, reportId);
    }

    params.push(productId, reportId);

    const result = await this.databaseService.query<SellInReportRow>(
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

  private mapRow(row: SellInReportRow | undefined): SellInReportRecord {
    if (!row) {
      throw new Error('Expected a sell-in report row but received none.');
    }

    return {
      accounts: row.accounts ?? [],
      createdAt: row.created_at,
      id: row.id,
      notes: row.notes,
      productId: row.product_id,
      reportPeriodEnd: row.report_period_end,
      reportPeriodStart: row.report_period_start,
      totalSellInUnits: row.total_sell_in_units,
      totalSellInValue: row.total_sell_in_value,
      updatedAt: row.updated_at,
    };
  }
}
