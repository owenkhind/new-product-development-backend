import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type { MarketSizingRecord } from '../types/market-sizing-record.type';

type MarketSizingRow = QueryResultRow & {
  annual_market_size_units: number;
  annual_market_size_value: string;
  assumptions: string | null;
  category_name: string;
  created_at: Date;
  data_sources: string[] | null;
  id: string;
  product_id: string;
  target_price_band: string;
  target_segment: string;
  updated_at: Date;
  year_one_sales_units: number;
  year_three_sales_units: number;
  year_two_sales_units: number;
};

type CreateMarketSizingInput = Omit<MarketSizingRecord, 'createdAt' | 'updatedAt'>;
type UpdateMarketSizingInput = Partial<Omit<CreateMarketSizingInput, 'id' | 'productId'>>;

@Injectable()
export class MarketSizingRepository {
  private readonly tableName = qualifyTableName('market_sizing_records');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateMarketSizingInput): Promise<MarketSizingRecord> {
    const result = await this.databaseService.query<MarketSizingRow>(
      `
        INSERT INTO ${this.tableName} (
          id,
          product_id,
          category_name,
          annual_market_size_units,
          annual_market_size_value,
          target_segment,
          target_price_band,
          year_one_sales_units,
          year_two_sales_units,
          year_three_sales_units,
          data_sources,
          assumptions,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
        RETURNING *
      `,
      [
        input.id,
        input.productId,
        input.categoryName,
        input.annualMarketSizeUnits,
        input.annualMarketSizeValue,
        input.targetSegment,
        input.targetPriceBand,
        input.yearOneSalesUnits,
        input.yearTwoSalesUnits,
        input.yearThreeSalesUnits,
        input.dataSources,
        input.assumptions,
      ],
    );

    const row = result.rows[0];

    if (!row) {
      throw new Error('Market sizing insert did not return a row.');
    }

    return this.mapRow(row);
  }

  async findByProductId(productId: string): Promise<MarketSizingRecord | null> {
    const result = await this.databaseService.query<MarketSizingRow>(
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

  async update(productId: string, input: UpdateMarketSizingInput): Promise<MarketSizingRecord | null> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.categoryName !== undefined) {
      params.push(input.categoryName);
      updates.push(`category_name = $${params.length}`);
    }

    if (input.annualMarketSizeUnits !== undefined) {
      params.push(input.annualMarketSizeUnits);
      updates.push(`annual_market_size_units = $${params.length}`);
    }

    if (input.annualMarketSizeValue !== undefined) {
      params.push(input.annualMarketSizeValue);
      updates.push(`annual_market_size_value = $${params.length}`);
    }

    if (input.targetSegment !== undefined) {
      params.push(input.targetSegment);
      updates.push(`target_segment = $${params.length}`);
    }

    if (input.targetPriceBand !== undefined) {
      params.push(input.targetPriceBand);
      updates.push(`target_price_band = $${params.length}`);
    }

    if (input.yearOneSalesUnits !== undefined) {
      params.push(input.yearOneSalesUnits);
      updates.push(`year_one_sales_units = $${params.length}`);
    }

    if (input.yearTwoSalesUnits !== undefined) {
      params.push(input.yearTwoSalesUnits);
      updates.push(`year_two_sales_units = $${params.length}`);
    }

    if (input.yearThreeSalesUnits !== undefined) {
      params.push(input.yearThreeSalesUnits);
      updates.push(`year_three_sales_units = $${params.length}`);
    }

    if (input.dataSources !== undefined) {
      params.push(input.dataSources);
      updates.push(`data_sources = $${params.length}`);
    }

    if (input.assumptions !== undefined) {
      params.push(input.assumptions);
      updates.push(`assumptions = $${params.length}`);
    }

    if (updates.length === 0) {
      return this.findByProductId(productId);
    }

    params.push(productId);

    const result = await this.databaseService.query<MarketSizingRow>(
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

  private mapRow(row: MarketSizingRow): MarketSizingRecord {
    return {
      annualMarketSizeUnits: row.annual_market_size_units,
      annualMarketSizeValue: row.annual_market_size_value,
      assumptions: row.assumptions,
      categoryName: row.category_name,
      createdAt: row.created_at,
      dataSources: row.data_sources ?? [],
      id: row.id,
      productId: row.product_id,
      targetPriceBand: row.target_price_band,
      targetSegment: row.target_segment,
      updatedAt: row.updated_at,
      yearOneSalesUnits: row.year_one_sales_units,
      yearThreeSalesUnits: row.year_three_sales_units,
      yearTwoSalesUnits: row.year_two_sales_units,
    };
  }
}
