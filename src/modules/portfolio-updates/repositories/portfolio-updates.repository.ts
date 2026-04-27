import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import { PortfolioReviewStatus } from '../../../enums/portfolio-review-status.enum';
import type { PortfolioUpdateRecord, PortfolioUpdateRowRecord } from '../types/portfolio-update-record.type';

type PortfolioUpdateRow = QueryResultRow & {
  coo_review_status: PortfolioReviewStatus;
  created_at: Date;
  id: string;
  review_quarter: string;
  rows: PortfolioUpdateRowRecord[] | null;
  summary: string;
  updated_at: Date;
};

type CreatePortfolioUpdateInput = Omit<PortfolioUpdateRecord, 'createdAt' | 'updatedAt'>;
type ListPortfolioUpdatesFilters = {
  limit: number;
  offset: number;
};
type UpdatePortfolioUpdateInput = Partial<Omit<CreatePortfolioUpdateInput, 'id'>>;

@Injectable()
export class PortfolioUpdatesRepository {
  private readonly tableName = qualifyTableName('portfolio_updates');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreatePortfolioUpdateInput): Promise<PortfolioUpdateRecord> {
    const result = await this.databaseService.query<PortfolioUpdateRow>(
      `
        INSERT INTO ${this.tableName} (
          id,
          review_quarter,
          summary,
          coo_review_status,
          rows,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5::jsonb, NOW(), NOW())
        RETURNING *
      `,
      [
        input.id,
        input.reviewQuarter,
        input.summary,
        input.cooReviewStatus,
        JSON.stringify(input.rows),
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  async list(filters: ListPortfolioUpdatesFilters): Promise<{ rows: PortfolioUpdateRecord[]; total: number }> {
    const [countResult, rowsResult] = await Promise.all([
      this.databaseService.query<{ total: string }>(
        `
          SELECT COUNT(*)::text AS total
          FROM ${this.tableName}
        `,
      ),
      this.databaseService.query<PortfolioUpdateRow>(
        `
          SELECT *
          FROM ${this.tableName}
          ORDER BY review_quarter DESC, created_at DESC
          LIMIT $1
          OFFSET $2
        `,
        [filters.limit, filters.offset],
      ),
    ]);

    return {
      rows: rowsResult.rows.map((row) => this.mapRow(row)),
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  }

  async findById(portfolioUpdateId: string): Promise<PortfolioUpdateRecord | null> {
    const result = await this.databaseService.query<PortfolioUpdateRow>(
      `
        SELECT *
        FROM ${this.tableName}
        WHERE id = $1
        LIMIT 1
      `,
      [portfolioUpdateId],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async update(
    portfolioUpdateId: string,
    input: UpdatePortfolioUpdateInput,
  ): Promise<PortfolioUpdateRecord | null> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.reviewQuarter !== undefined) {
      params.push(input.reviewQuarter);
      updates.push(`review_quarter = $${params.length}`);
    }

    if (input.summary !== undefined) {
      params.push(input.summary);
      updates.push(`summary = $${params.length}`);
    }

    if (input.cooReviewStatus !== undefined) {
      params.push(input.cooReviewStatus);
      updates.push(`coo_review_status = $${params.length}`);
    }

    if (input.rows !== undefined) {
      params.push(JSON.stringify(input.rows));
      updates.push(`rows = $${params.length}::jsonb`);
    }

    if (updates.length === 0) {
      return this.findById(portfolioUpdateId);
    }

    params.push(portfolioUpdateId);

    const result = await this.databaseService.query<PortfolioUpdateRow>(
      `
        UPDATE ${this.tableName}
        SET ${updates.join(', ')}, updated_at = NOW()
        WHERE id = $${params.length}
        RETURNING *
      `,
      params,
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  private mapRow(row: PortfolioUpdateRow | undefined): PortfolioUpdateRecord {
    if (!row) {
      throw new Error('Expected a portfolio update row but received none.');
    }

    return {
      cooReviewStatus: row.coo_review_status,
      createdAt: row.created_at,
      id: row.id,
      reviewQuarter: row.review_quarter,
      rows: row.rows ?? [],
      summary: row.summary,
      updatedAt: row.updated_at,
    };
  }
}
