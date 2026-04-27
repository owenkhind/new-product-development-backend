import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type { GtmPlanChecklistItemRecord, GtmPlanRecord } from '../types/gtm-plan-record.type';

type GtmPlanRow = QueryResultRow & {
  activation_plan: string;
  budget: string;
  campaign_end_date: string | null;
  campaign_start_date: string | null;
  checklist_items: GtmPlanChecklistItemRecord[] | null;
  communications_plan: string;
  created_at: Date;
  id: string;
  launch_objectives: string;
  product_id: string;
  updated_at: Date;
};

type CreateGtmPlanInput = Omit<GtmPlanRecord, 'createdAt' | 'updatedAt'>;
type UpdateGtmPlanInput = Partial<Omit<CreateGtmPlanInput, 'id' | 'productId'>>;

@Injectable()
export class GtmPlansRepository {
  private readonly tableName = qualifyTableName('gtm_plans');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateGtmPlanInput): Promise<GtmPlanRecord> {
    const result = await this.databaseService.query<GtmPlanRow>(
      `
        INSERT INTO ${this.tableName} (
          id,
          product_id,
          launch_objectives,
          activation_plan,
          communications_plan,
          budget,
          campaign_start_date,
          campaign_end_date,
          checklist_items,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, NOW(), NOW())
        RETURNING *
      `,
      [
        input.id,
        input.productId,
        input.launchObjectives,
        input.activationPlan,
        input.communicationsPlan,
        input.budget,
        input.campaignStartDate,
        input.campaignEndDate,
        JSON.stringify(input.checklistItems),
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  async findByProductId(productId: string): Promise<GtmPlanRecord | null> {
    const result = await this.databaseService.query<GtmPlanRow>(
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

  async update(productId: string, input: UpdateGtmPlanInput): Promise<GtmPlanRecord | null> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.launchObjectives !== undefined) {
      params.push(input.launchObjectives);
      updates.push(`launch_objectives = $${params.length}`);
    }

    if (input.activationPlan !== undefined) {
      params.push(input.activationPlan);
      updates.push(`activation_plan = $${params.length}`);
    }

    if (input.communicationsPlan !== undefined) {
      params.push(input.communicationsPlan);
      updates.push(`communications_plan = $${params.length}`);
    }

    if (input.budget !== undefined) {
      params.push(input.budget);
      updates.push(`budget = $${params.length}`);
    }

    if (input.campaignStartDate !== undefined) {
      params.push(input.campaignStartDate);
      updates.push(`campaign_start_date = $${params.length}`);
    }

    if (input.campaignEndDate !== undefined) {
      params.push(input.campaignEndDate);
      updates.push(`campaign_end_date = $${params.length}`);
    }

    if (input.checklistItems !== undefined) {
      params.push(JSON.stringify(input.checklistItems));
      updates.push(`checklist_items = $${params.length}::jsonb`);
    }

    if (updates.length === 0) {
      return this.findByProductId(productId);
    }

    params.push(productId);

    const result = await this.databaseService.query<GtmPlanRow>(
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

  private mapRow(row: GtmPlanRow | undefined): GtmPlanRecord {
    if (!row) {
      throw new Error('Expected a GTM plan row but received none.');
    }

    return {
      activationPlan: row.activation_plan,
      budget: row.budget,
      campaignEndDate: row.campaign_end_date,
      campaignStartDate: row.campaign_start_date,
      checklistItems: row.checklist_items ?? [],
      communicationsPlan: row.communications_plan,
      createdAt: row.created_at,
      id: row.id,
      launchObjectives: row.launch_objectives,
      productId: row.product_id,
      updatedAt: row.updated_at,
    };
  }
}
