import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import type { DatabaseQueryable } from '../../../database/database-queryable.type';
import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import { RevampEolDecision } from '../../../enums/revamp-eol-decision.enum';
import { RevampEolRecommendationOutcome } from '../../../enums/revamp-eol-recommendation-outcome.enum';
import type { RevampEolRecommendationRecord } from '../types/revamp-eol-recommendation-record.type';

type RevampEolRecommendationRow = QueryResultRow & {
  coo_decision: RevampEolDecision | null;
  coo_decision_at: Date | null;
  coo_decision_by_user_id: string | null;
  coo_decision_comment: string | null;
  created_at: Date;
  eol_option: string | null;
  gm_commercial_input: string | null;
  gm_input_at: Date | null;
  gm_input_by_user_id: string | null;
  hold_option: string | null;
  id: string;
  product_id: string;
  recommendation_outcome: RevampEolRecommendationOutcome;
  recommendation_summary: string;
  revamp_option: string | null;
  root_cause_analysis: string;
  trigger_reasons: string[] | null;
  updated_at: Date;
};

type CreateRevampEolRecommendationInput = Omit<RevampEolRecommendationRecord, 'createdAt' | 'updatedAt'>;
type UpdateRevampEolRecommendationInput = Partial<Omit<CreateRevampEolRecommendationInput, 'id' | 'productId'>>;

@Injectable()
export class RevampEolRecommendationsRepository {
  private readonly tableName = qualifyTableName('revamp_eol_recommendations');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateRevampEolRecommendationInput): Promise<RevampEolRecommendationRecord> {
    const result = await this.databaseService.query<RevampEolRecommendationRow>(
      `
        INSERT INTO ${this.tableName} (
          id,
          product_id,
          trigger_reasons,
          root_cause_analysis,
          revamp_option,
          eol_option,
          hold_option,
          recommendation_outcome,
          recommendation_summary,
          gm_commercial_input,
          gm_input_by_user_id,
          gm_input_at,
          coo_decision,
          coo_decision_by_user_id,
          coo_decision_at,
          coo_decision_comment,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
        RETURNING *
      `,
      [
        input.id,
        input.productId,
        JSON.stringify(input.triggerReasons),
        input.rootCauseAnalysis,
        input.revampOption,
        input.eolOption,
        input.holdOption,
        input.recommendationOutcome,
        input.recommendationSummary,
        input.gmCommercialInput,
        input.gmInputByUserId,
        input.gmInputAt,
        input.cooDecision,
        input.cooDecisionByUserId,
        input.cooDecisionAt,
        input.cooDecisionComment,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  async findByProductId(productId: string): Promise<RevampEolRecommendationRecord | null> {
    const result = await this.databaseService.query<RevampEolRecommendationRow>(
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

  async update(
    productId: string,
    input: UpdateRevampEolRecommendationInput,
    executor?: DatabaseQueryable,
  ): Promise<RevampEolRecommendationRecord | null> {
    const queryable = executor ?? this.databaseService;
    const updates: string[] = [];
    const params: unknown[] = [];

    const add = (column: string, value: unknown): void => {
      params.push(value);
      updates.push(`${column} = $${params.length}`);
    };

    if (input.triggerReasons !== undefined) {
      params.push(JSON.stringify(input.triggerReasons));
      updates.push(`trigger_reasons = $${params.length}::jsonb`);
    }
    if (input.rootCauseAnalysis !== undefined) add('root_cause_analysis', input.rootCauseAnalysis);
    if (input.revampOption !== undefined) add('revamp_option', input.revampOption);
    if (input.eolOption !== undefined) add('eol_option', input.eolOption);
    if (input.holdOption !== undefined) add('hold_option', input.holdOption);
    if (input.recommendationOutcome !== undefined) add('recommendation_outcome', input.recommendationOutcome);
    if (input.recommendationSummary !== undefined) add('recommendation_summary', input.recommendationSummary);
    if (input.gmCommercialInput !== undefined) add('gm_commercial_input', input.gmCommercialInput);
    if (input.gmInputByUserId !== undefined) add('gm_input_by_user_id', input.gmInputByUserId);
    if (input.gmInputAt !== undefined) add('gm_input_at', input.gmInputAt);
    if (input.cooDecision !== undefined) add('coo_decision', input.cooDecision);
    if (input.cooDecisionByUserId !== undefined) add('coo_decision_by_user_id', input.cooDecisionByUserId);
    if (input.cooDecisionAt !== undefined) add('coo_decision_at', input.cooDecisionAt);
    if (input.cooDecisionComment !== undefined) add('coo_decision_comment', input.cooDecisionComment);

    if (updates.length === 0) {
      return this.findByProductId(productId);
    }

    params.push(productId);

    const result = await queryable.query<RevampEolRecommendationRow>(
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

  private mapRow(row: RevampEolRecommendationRow | undefined): RevampEolRecommendationRecord {
    if (!row) {
      throw new Error('Expected a revamp/EOL recommendation row but received none.');
    }

    return {
      cooDecision: row.coo_decision,
      cooDecisionAt: row.coo_decision_at,
      cooDecisionByUserId: row.coo_decision_by_user_id,
      cooDecisionComment: row.coo_decision_comment,
      createdAt: row.created_at,
      eolOption: row.eol_option,
      gmCommercialInput: row.gm_commercial_input,
      gmInputAt: row.gm_input_at,
      gmInputByUserId: row.gm_input_by_user_id,
      holdOption: row.hold_option,
      id: row.id,
      productId: row.product_id,
      recommendationOutcome: row.recommendation_outcome,
      recommendationSummary: row.recommendation_summary,
      revampOption: row.revamp_option,
      rootCauseAnalysis: row.root_cause_analysis,
      triggerReasons: row.trigger_reasons ?? [],
      updatedAt: row.updated_at,
    };
  }
}
