import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import type { DatabaseQueryable } from '../../../database/database-queryable.type';
import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type { GateThreeReviewRecord } from '../types/gate-three-review-record.type';

type GateThreeReviewRow = QueryResultRow & {
  created_at: Date;
  finance_comment: string | null;
  finance_confirmed_at: Date | null;
  finance_confirmed_by_user_id: string | null;
  gm_approved_at: Date | null;
  gm_approved_by_user_id: string | null;
  gm_comment: string | null;
  marketing_comment: string | null;
  marketing_reviewed_at: Date | null;
  marketing_reviewed_by_user_id: string | null;
  product_id: string;
  updated_at: Date;
};

type UpsertGateThreeReviewInput = {
  financeComment?: string | null;
  financeConfirmedAt?: Date | null;
  financeConfirmedByUserId?: string | null;
  gmApprovedAt?: Date | null;
  gmApprovedByUserId?: string | null;
  gmComment?: string | null;
  marketingComment?: string | null;
  marketingReviewedAt?: Date | null;
  marketingReviewedByUserId?: string | null;
  productId: string;
};

@Injectable()
export class GateThreeReviewsRepository {
  private readonly tableName = qualifyTableName('gate_three_reviews');

  constructor(private readonly databaseService: DatabaseService) {}

  async findByProductId(productId: string): Promise<GateThreeReviewRecord | null> {
    const result = await this.databaseService.query<GateThreeReviewRow>(
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

  async upsert(
    input: UpsertGateThreeReviewInput,
    executor?: DatabaseQueryable,
  ): Promise<GateThreeReviewRecord> {
    const queryable = executor ?? this.databaseService;

    const result = await queryable.query<GateThreeReviewRow>(
      `
        INSERT INTO ${this.tableName} (
          product_id,
          finance_confirmed_at,
          finance_confirmed_by_user_id,
          finance_comment,
          marketing_reviewed_at,
          marketing_reviewed_by_user_id,
          marketing_comment,
          gm_approved_at,
          gm_approved_by_user_id,
          gm_comment,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        ON CONFLICT (product_id)
        DO UPDATE SET
          finance_confirmed_at = COALESCE(EXCLUDED.finance_confirmed_at, ${this.tableName}.finance_confirmed_at),
          finance_confirmed_by_user_id = COALESCE(EXCLUDED.finance_confirmed_by_user_id, ${this.tableName}.finance_confirmed_by_user_id),
          finance_comment = COALESCE(EXCLUDED.finance_comment, ${this.tableName}.finance_comment),
          marketing_reviewed_at = COALESCE(EXCLUDED.marketing_reviewed_at, ${this.tableName}.marketing_reviewed_at),
          marketing_reviewed_by_user_id = COALESCE(EXCLUDED.marketing_reviewed_by_user_id, ${this.tableName}.marketing_reviewed_by_user_id),
          marketing_comment = COALESCE(EXCLUDED.marketing_comment, ${this.tableName}.marketing_comment),
          gm_approved_at = COALESCE(EXCLUDED.gm_approved_at, ${this.tableName}.gm_approved_at),
          gm_approved_by_user_id = COALESCE(EXCLUDED.gm_approved_by_user_id, ${this.tableName}.gm_approved_by_user_id),
          gm_comment = COALESCE(EXCLUDED.gm_comment, ${this.tableName}.gm_comment),
          updated_at = NOW()
        RETURNING *
      `,
      [
        input.productId,
        input.financeConfirmedAt ?? null,
        input.financeConfirmedByUserId ?? null,
        input.financeComment ?? null,
        input.marketingReviewedAt ?? null,
        input.marketingReviewedByUserId ?? null,
        input.marketingComment ?? null,
        input.gmApprovedAt ?? null,
        input.gmApprovedByUserId ?? null,
        input.gmComment ?? null,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  private mapRow(row: GateThreeReviewRow | undefined): GateThreeReviewRecord {
    if (!row) {
      throw new Error('Expected a gate three review row but received none.');
    }

    return {
      createdAt: row.created_at,
      financeComment: row.finance_comment,
      financeConfirmedAt: row.finance_confirmed_at,
      financeConfirmedByUserId: row.finance_confirmed_by_user_id,
      gmApprovedAt: row.gm_approved_at,
      gmApprovedByUserId: row.gm_approved_by_user_id,
      gmComment: row.gm_comment,
      marketingComment: row.marketing_comment,
      marketingReviewedAt: row.marketing_reviewed_at,
      marketingReviewedByUserId: row.marketing_reviewed_by_user_id,
      productId: row.product_id,
      updatedAt: row.updated_at,
    };
  }
}
