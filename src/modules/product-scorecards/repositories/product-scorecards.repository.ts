import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import { ProductScorecardClass } from '../../../enums/product-scorecard-class.enum';
import type { ProductScorecardRecord } from '../types/product-scorecard-record.type';

type ProductScorecardRow = QueryResultRow & {
  classification: ProductScorecardClass;
  classification_reason: string;
  complaint_count: number;
  created_at: Date;
  gross_profit_percent: string;
  id: string;
  is_escalation_required: boolean;
  margin: string;
  market_feedback_summary: string;
  notes: string | null;
  product_id: string;
  revenue: string;
  review_date: string;
  sell_through_percent: string;
  updated_at: Date;
};

type CreateProductScorecardInput = Omit<ProductScorecardRecord, 'createdAt' | 'updatedAt'>;
type ListProductScorecardsFilters = {
  limit: number;
  offset: number;
  productId: string;
};
type UpdateProductScorecardInput = Partial<Omit<CreateProductScorecardInput, 'id' | 'productId'>>;

@Injectable()
export class ProductScorecardsRepository {
  private readonly tableName = qualifyTableName('product_scorecards');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateProductScorecardInput): Promise<ProductScorecardRecord> {
    const result = await this.databaseService.query<ProductScorecardRow>(
      `
        INSERT INTO ${this.tableName} (
          id,
          product_id,
          review_date,
          sell_through_percent,
          gross_profit_percent,
          revenue,
          margin,
          complaint_count,
          market_feedback_summary,
          notes,
          classification,
          classification_reason,
          is_escalation_required,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        RETURNING *
      `,
      [
        input.id,
        input.productId,
        input.reviewDate,
        input.sellThroughPercent,
        input.grossProfitPercent,
        input.revenue,
        input.margin,
        input.complaintCount,
        input.marketFeedbackSummary,
        input.notes,
        input.classification,
        input.classificationReason,
        input.isEscalationRequired,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  async listByProductId(filters: ListProductScorecardsFilters): Promise<{ rows: ProductScorecardRecord[]; total: number }> {
    const [countResult, rowsResult] = await Promise.all([
      this.databaseService.query<{ total: string }>(
        `
          SELECT COUNT(*)::text AS total
          FROM ${this.tableName}
          WHERE product_id = $1
        `,
        [filters.productId],
      ),
      this.databaseService.query<ProductScorecardRow>(
        `
          SELECT *
          FROM ${this.tableName}
          WHERE product_id = $1
          ORDER BY review_date DESC, created_at DESC
          LIMIT $2
          OFFSET $3
        `,
        [filters.productId, filters.limit, filters.offset],
      ),
    ]);

    return {
      rows: rowsResult.rows.map((row) => this.mapRow(row)),
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  }

  async listLatestByProductId(productId: string, limit: number): Promise<ProductScorecardRecord[]> {
    const result = await this.databaseService.query<ProductScorecardRow>(
      `
        SELECT *
        FROM ${this.tableName}
        WHERE product_id = $1
        ORDER BY review_date DESC, created_at DESC
        LIMIT $2
      `,
      [productId, limit],
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  async findById(productId: string, scorecardId: string): Promise<ProductScorecardRecord | null> {
    const result = await this.databaseService.query<ProductScorecardRow>(
      `
        SELECT *
        FROM ${this.tableName}
        WHERE product_id = $1
          AND id = $2
        LIMIT 1
      `,
      [productId, scorecardId],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async update(
    productId: string,
    scorecardId: string,
    input: UpdateProductScorecardInput,
  ): Promise<ProductScorecardRecord | null> {
    const updates: string[] = [];
    const params: unknown[] = [];

    const add = (column: string, value: unknown): void => {
      params.push(value);
      updates.push(`${column} = $${params.length}`);
    };

    if (input.reviewDate !== undefined) add('review_date', input.reviewDate);
    if (input.sellThroughPercent !== undefined) add('sell_through_percent', input.sellThroughPercent);
    if (input.grossProfitPercent !== undefined) add('gross_profit_percent', input.grossProfitPercent);
    if (input.revenue !== undefined) add('revenue', input.revenue);
    if (input.margin !== undefined) add('margin', input.margin);
    if (input.complaintCount !== undefined) add('complaint_count', input.complaintCount);
    if (input.marketFeedbackSummary !== undefined) add('market_feedback_summary', input.marketFeedbackSummary);
    if (input.notes !== undefined) add('notes', input.notes);
    if (input.classification !== undefined) add('classification', input.classification);
    if (input.classificationReason !== undefined) add('classification_reason', input.classificationReason);
    if (input.isEscalationRequired !== undefined) add('is_escalation_required', input.isEscalationRequired);

    if (updates.length === 0) {
      return this.findById(productId, scorecardId);
    }

    params.push(productId, scorecardId);

    const result = await this.databaseService.query<ProductScorecardRow>(
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

  private mapRow(row: ProductScorecardRow | undefined): ProductScorecardRecord {
    if (!row) {
      throw new Error('Expected a product scorecard row but received none.');
    }

    return {
      classification: row.classification,
      classificationReason: row.classification_reason,
      complaintCount: row.complaint_count,
      createdAt: row.created_at,
      grossProfitPercent: row.gross_profit_percent,
      id: row.id,
      isEscalationRequired: row.is_escalation_required,
      margin: row.margin,
      marketFeedbackSummary: row.market_feedback_summary,
      notes: row.notes,
      productId: row.product_id,
      revenue: row.revenue,
      reviewDate: row.review_date,
      sellThroughPercent: row.sell_through_percent,
      updatedAt: row.updated_at,
    };
  }
}
