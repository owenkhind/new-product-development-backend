import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import type { DatabaseQueryable } from '../../../database/database-queryable.type';
import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type { OpportunityBriefRecord } from '../types/opportunity-brief-record.type';

type OpportunityBriefRow = QueryResultRow & {
  affordable_cost_score: number;
  affordable_price_score: number;
  affordable_value_score: number;
  art_total_score: number;
  compliance_notes: string | null;
  created_at: Date;
  id: string;
  opportunity_source: string;
  problem_statement: string;
  product_id: string;
  reliable_compliance_score: number;
  reliable_durability_score: number;
  reliable_service_score: number;
  required_documents_complete: boolean;
  target_customer: string;
  target_market: string;
  trendy_category_score: number;
  trendy_colour_score: number;
  trendy_design_score: number;
  unique_selling_points: string[] | null;
  updated_at: Date;
};

type CreateOpportunityBriefInput = Omit<
  OpportunityBriefRecord,
  'createdAt' | 'updatedAt'
>;

type UpdateOpportunityBriefInput = Partial<Omit<CreateOpportunityBriefInput, 'id' | 'productId'>>;

@Injectable()
export class OpportunityBriefsRepository {
  private readonly tableName = qualifyTableName('opportunity_briefs');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateOpportunityBriefInput): Promise<OpportunityBriefRecord> {
    const result = await this.databaseService.query<OpportunityBriefRow>(
      `
        INSERT INTO ${this.tableName} (
          id,
          product_id,
          opportunity_source,
          problem_statement,
          target_market,
          target_customer,
          unique_selling_points,
          compliance_notes,
          required_documents_complete,
          affordable_price_score,
          affordable_cost_score,
          affordable_value_score,
          reliable_durability_score,
          reliable_service_score,
          reliable_compliance_score,
          trendy_design_score,
          trendy_colour_score,
          trendy_category_score,
          art_total_score,
          created_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9,
          $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW(), NOW()
        )
        RETURNING *
      `,
      [
        input.id,
        input.productId,
        input.opportunitySource,
        input.problemStatement,
        input.targetMarket,
        input.targetCustomer,
        input.uniqueSellingPoints,
        input.complianceNotes,
        input.requiredDocumentsComplete,
        input.affordablePriceScore,
        input.affordableCostScore,
        input.affordableValueScore,
        input.reliableDurabilityScore,
        input.reliableServiceScore,
        input.reliableComplianceScore,
        input.trendyDesignScore,
        input.trendyColourScore,
        input.trendyCategoryScore,
        input.artTotalScore,
      ],
    );

    const row = result.rows[0];

    if (!row) {
      throw new Error('Opportunity brief insert did not return a row.');
    }

    return this.mapRow(row);
  }

  async findByProductId(productId: string): Promise<OpportunityBriefRecord | null> {
    const result = await this.databaseService.query<OpportunityBriefRow>(
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
    input: UpdateOpportunityBriefInput,
    executor?: DatabaseQueryable,
  ): Promise<OpportunityBriefRecord | null> {
    const client = executor ?? this.databaseService;
    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.opportunitySource !== undefined) {
      params.push(input.opportunitySource);
      updates.push(`opportunity_source = $${params.length}`);
    }

    if (input.problemStatement !== undefined) {
      params.push(input.problemStatement);
      updates.push(`problem_statement = $${params.length}`);
    }

    if (input.targetMarket !== undefined) {
      params.push(input.targetMarket);
      updates.push(`target_market = $${params.length}`);
    }

    if (input.targetCustomer !== undefined) {
      params.push(input.targetCustomer);
      updates.push(`target_customer = $${params.length}`);
    }

    if (input.uniqueSellingPoints !== undefined) {
      params.push(input.uniqueSellingPoints);
      updates.push(`unique_selling_points = $${params.length}`);
    }

    if (input.complianceNotes !== undefined) {
      params.push(input.complianceNotes);
      updates.push(`compliance_notes = $${params.length}`);
    }

    if (input.requiredDocumentsComplete !== undefined) {
      params.push(input.requiredDocumentsComplete);
      updates.push(`required_documents_complete = $${params.length}`);
    }

    if (input.affordablePriceScore !== undefined) {
      params.push(input.affordablePriceScore);
      updates.push(`affordable_price_score = $${params.length}`);
    }

    if (input.affordableCostScore !== undefined) {
      params.push(input.affordableCostScore);
      updates.push(`affordable_cost_score = $${params.length}`);
    }

    if (input.affordableValueScore !== undefined) {
      params.push(input.affordableValueScore);
      updates.push(`affordable_value_score = $${params.length}`);
    }

    if (input.reliableDurabilityScore !== undefined) {
      params.push(input.reliableDurabilityScore);
      updates.push(`reliable_durability_score = $${params.length}`);
    }

    if (input.reliableServiceScore !== undefined) {
      params.push(input.reliableServiceScore);
      updates.push(`reliable_service_score = $${params.length}`);
    }

    if (input.reliableComplianceScore !== undefined) {
      params.push(input.reliableComplianceScore);
      updates.push(`reliable_compliance_score = $${params.length}`);
    }

    if (input.trendyDesignScore !== undefined) {
      params.push(input.trendyDesignScore);
      updates.push(`trendy_design_score = $${params.length}`);
    }

    if (input.trendyColourScore !== undefined) {
      params.push(input.trendyColourScore);
      updates.push(`trendy_colour_score = $${params.length}`);
    }

    if (input.trendyCategoryScore !== undefined) {
      params.push(input.trendyCategoryScore);
      updates.push(`trendy_category_score = $${params.length}`);
    }

    if (input.artTotalScore !== undefined) {
      params.push(input.artTotalScore);
      updates.push(`art_total_score = $${params.length}`);
    }

    if (updates.length === 0) {
      return this.findByProductId(productId);
    }

    params.push(productId);

    const result = await client.query<OpportunityBriefRow>(
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

  private mapRow(row: OpportunityBriefRow): OpportunityBriefRecord {
    return {
      affordableCostScore: row.affordable_cost_score,
      affordablePriceScore: row.affordable_price_score,
      affordableValueScore: row.affordable_value_score,
      artTotalScore: row.art_total_score,
      complianceNotes: row.compliance_notes,
      createdAt: row.created_at,
      id: row.id,
      opportunitySource: row.opportunity_source,
      problemStatement: row.problem_statement,
      productId: row.product_id,
      reliableComplianceScore: row.reliable_compliance_score,
      reliableDurabilityScore: row.reliable_durability_score,
      reliableServiceScore: row.reliable_service_score,
      requiredDocumentsComplete: row.required_documents_complete,
      targetCustomer: row.target_customer,
      targetMarket: row.target_market,
      trendyCategoryScore: row.trendy_category_score,
      trendyColourScore: row.trendy_colour_score,
      trendyDesignScore: row.trendy_design_score,
      uniqueSellingPoints: row.unique_selling_points ?? [],
      updatedAt: row.updated_at,
    };
  }
}
