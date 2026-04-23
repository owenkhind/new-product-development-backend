import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import type { DatabaseQueryable } from '../../../database/database-queryable.type';
import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type { GateTwoReviewRecord } from '../types/gate-two-review-record.type';

type GateTwoReviewRow = QueryResultRow & {
  created_at: Date;
  finance_comment: string | null;
  finance_confirmed_at: Date | null;
  finance_confirmed_by_user_id: string | null;
  gm_approved_at: Date | null;
  gm_approved_by_user_id: string | null;
  gm_comment: string | null;
  product_id: string;
  qa_comment: string | null;
  qa_review_completed_at: Date | null;
  qa_reviewed_by_user_id: string | null;
  updated_at: Date;
};

type UpsertGateTwoReviewInput = {
  financeComment?: string | null;
  financeConfirmedAt?: Date | null;
  financeConfirmedByUserId?: string | null;
  gmApprovedAt?: Date | null;
  gmApprovedByUserId?: string | null;
  gmComment?: string | null;
  productId: string;
  qaComment?: string | null;
  qaReviewCompletedAt?: Date | null;
  qaReviewedByUserId?: string | null;
};

@Injectable()
export class GateTwoReviewsRepository {
  private readonly tableName = qualifyTableName('gate_two_reviews');

  constructor(private readonly databaseService: DatabaseService) {}

  async findByProductId(productId: string): Promise<GateTwoReviewRecord | null> {
    const result = await this.databaseService.query<GateTwoReviewRow>(
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
    input: UpsertGateTwoReviewInput,
    executor?: DatabaseQueryable,
  ): Promise<GateTwoReviewRecord> {
    const queryable = executor ?? this.databaseService;

    const result = await queryable.query<GateTwoReviewRow>(
      `
        INSERT INTO ${this.tableName} (
          product_id,
          qa_review_completed_at,
          qa_reviewed_by_user_id,
          qa_comment,
          finance_confirmed_at,
          finance_confirmed_by_user_id,
          finance_comment,
          gm_approved_at,
          gm_approved_by_user_id,
          gm_comment,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        ON CONFLICT (product_id)
        DO UPDATE SET
          qa_review_completed_at = COALESCE(EXCLUDED.qa_review_completed_at, ${this.tableName}.qa_review_completed_at),
          qa_reviewed_by_user_id = COALESCE(EXCLUDED.qa_reviewed_by_user_id, ${this.tableName}.qa_reviewed_by_user_id),
          qa_comment = COALESCE(EXCLUDED.qa_comment, ${this.tableName}.qa_comment),
          finance_confirmed_at = COALESCE(EXCLUDED.finance_confirmed_at, ${this.tableName}.finance_confirmed_at),
          finance_confirmed_by_user_id = COALESCE(EXCLUDED.finance_confirmed_by_user_id, ${this.tableName}.finance_confirmed_by_user_id),
          finance_comment = COALESCE(EXCLUDED.finance_comment, ${this.tableName}.finance_comment),
          gm_approved_at = COALESCE(EXCLUDED.gm_approved_at, ${this.tableName}.gm_approved_at),
          gm_approved_by_user_id = COALESCE(EXCLUDED.gm_approved_by_user_id, ${this.tableName}.gm_approved_by_user_id),
          gm_comment = COALESCE(EXCLUDED.gm_comment, ${this.tableName}.gm_comment),
          updated_at = NOW()
        RETURNING *
      `,
      [
        input.productId,
        input.qaReviewCompletedAt ?? null,
        input.qaReviewedByUserId ?? null,
        input.qaComment ?? null,
        input.financeConfirmedAt ?? null,
        input.financeConfirmedByUserId ?? null,
        input.financeComment ?? null,
        input.gmApprovedAt ?? null,
        input.gmApprovedByUserId ?? null,
        input.gmComment ?? null,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  private mapRow(row: GateTwoReviewRow | undefined): GateTwoReviewRecord {
    if (!row) {
      throw new Error('Expected a gate two review row but received none.');
    }

    return {
      createdAt: row.created_at,
      financeComment: row.finance_comment,
      financeConfirmedAt: row.finance_confirmed_at,
      financeConfirmedByUserId: row.finance_confirmed_by_user_id,
      gmApprovedAt: row.gm_approved_at,
      gmApprovedByUserId: row.gm_approved_by_user_id,
      gmComment: row.gm_comment,
      productId: row.product_id,
      qaComment: row.qa_comment,
      qaReviewCompletedAt: row.qa_review_completed_at,
      qaReviewedByUserId: row.qa_reviewed_by_user_id,
      updatedAt: row.updated_at,
    };
  }
}
