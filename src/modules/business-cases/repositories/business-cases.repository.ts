import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type {
  BusinessCaseChannelGpSummaryRecord,
  BusinessCaseRecord,
} from '../types/business-case-record.type';

type BusinessCaseRow = QueryResultRow & {
  channel_gp_summary: BusinessCaseChannelGpSummaryRecord[] | null;
  commercial_notes: string | null;
  created_at: Date;
  finance_notes: string | null;
  id: string;
  investment_needed: string;
  market_opportunity_summary: string;
  product_id: string;
  product_summary: string;
  recommendation: string;
  risk_summary: string;
  updated_at: Date;
  year_one_revenue: string;
  year_three_revenue: string;
  year_two_revenue: string;
};

type CreateBusinessCaseInput = Omit<BusinessCaseRecord, 'createdAt' | 'updatedAt'>;
type UpdateBusinessCaseInput = Partial<Omit<CreateBusinessCaseInput, 'id' | 'productId'>>;

@Injectable()
export class BusinessCasesRepository {
  private readonly tableName = qualifyTableName('business_cases');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateBusinessCaseInput): Promise<BusinessCaseRecord> {
    const result = await this.databaseService.query<BusinessCaseRow>(
      `
        INSERT INTO ${this.tableName} (
          id,
          product_id,
          market_opportunity_summary,
          product_summary,
          year_one_revenue,
          year_two_revenue,
          year_three_revenue,
          investment_needed,
          risk_summary,
          recommendation,
          channel_gp_summary,
          finance_notes,
          commercial_notes,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, NOW(), NOW())
        RETURNING *
      `,
      [
        input.id,
        input.productId,
        input.marketOpportunitySummary,
        input.productSummary,
        input.yearOneRevenue,
        input.yearTwoRevenue,
        input.yearThreeRevenue,
        input.investmentNeeded,
        input.riskSummary,
        input.recommendation,
        JSON.stringify(input.channelGpSummary),
        input.financeNotes,
        input.commercialNotes,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  async findByProductId(productId: string): Promise<BusinessCaseRecord | null> {
    const result = await this.databaseService.query<BusinessCaseRow>(
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

  async update(productId: string, input: UpdateBusinessCaseInput): Promise<BusinessCaseRecord | null> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.marketOpportunitySummary !== undefined) {
      params.push(input.marketOpportunitySummary);
      updates.push(`market_opportunity_summary = $${params.length}`);
    }

    if (input.productSummary !== undefined) {
      params.push(input.productSummary);
      updates.push(`product_summary = $${params.length}`);
    }

    if (input.yearOneRevenue !== undefined) {
      params.push(input.yearOneRevenue);
      updates.push(`year_one_revenue = $${params.length}`);
    }

    if (input.yearTwoRevenue !== undefined) {
      params.push(input.yearTwoRevenue);
      updates.push(`year_two_revenue = $${params.length}`);
    }

    if (input.yearThreeRevenue !== undefined) {
      params.push(input.yearThreeRevenue);
      updates.push(`year_three_revenue = $${params.length}`);
    }

    if (input.investmentNeeded !== undefined) {
      params.push(input.investmentNeeded);
      updates.push(`investment_needed = $${params.length}`);
    }

    if (input.riskSummary !== undefined) {
      params.push(input.riskSummary);
      updates.push(`risk_summary = $${params.length}`);
    }

    if (input.recommendation !== undefined) {
      params.push(input.recommendation);
      updates.push(`recommendation = $${params.length}`);
    }

    if (input.channelGpSummary !== undefined) {
      params.push(JSON.stringify(input.channelGpSummary));
      updates.push(`channel_gp_summary = $${params.length}::jsonb`);
    }

    if (input.financeNotes !== undefined) {
      params.push(input.financeNotes);
      updates.push(`finance_notes = $${params.length}`);
    }

    if (input.commercialNotes !== undefined) {
      params.push(input.commercialNotes);
      updates.push(`commercial_notes = $${params.length}`);
    }

    if (updates.length === 0) {
      return this.findByProductId(productId);
    }

    params.push(productId);

    const result = await this.databaseService.query<BusinessCaseRow>(
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

  private mapRow(row: BusinessCaseRow | undefined): BusinessCaseRecord {
    if (!row) {
      throw new Error('Expected a business case row but received none.');
    }

    return {
      channelGpSummary: row.channel_gp_summary ?? [],
      commercialNotes: row.commercial_notes,
      createdAt: row.created_at,
      financeNotes: row.finance_notes,
      id: row.id,
      investmentNeeded: row.investment_needed,
      marketOpportunitySummary: row.market_opportunity_summary,
      productId: row.product_id,
      productSummary: row.product_summary,
      recommendation: row.recommendation,
      riskSummary: row.risk_summary,
      updatedAt: row.updated_at,
      yearOneRevenue: row.year_one_revenue,
      yearThreeRevenue: row.year_three_revenue,
      yearTwoRevenue: row.year_two_revenue,
    };
  }
}
