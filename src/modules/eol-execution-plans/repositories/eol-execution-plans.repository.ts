import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type {
  EolExecutionPlanRecord,
  EolMilestoneRecord,
  EolStockPositionRecord,
} from '../types/eol-execution-plan-record.type';

type EolExecutionPlanRow = QueryResultRow & {
  created_at: Date;
  id: string;
  kd_handoff_notes: string;
  milestones: EolMilestoneRecord[] | null;
  product_id: string;
  service_continuity_plan: string;
  spare_parts_plan: string;
  stock_positions: EolStockPositionRecord[] | null;
  summary: string;
  updated_at: Date;
};

type CreateEolExecutionPlanInput = Omit<EolExecutionPlanRecord, 'createdAt' | 'updatedAt'>;
type UpdateEolExecutionPlanInput = Partial<Omit<CreateEolExecutionPlanInput, 'id' | 'productId'>>;

@Injectable()
export class EolExecutionPlansRepository {
  private readonly tableName = qualifyTableName('eol_execution_plans');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateEolExecutionPlanInput): Promise<EolExecutionPlanRecord> {
    const result = await this.databaseService.query<EolExecutionPlanRow>(
      `
        INSERT INTO ${this.tableName} (
          id,
          product_id,
          summary,
          stock_positions,
          milestones,
          kd_handoff_notes,
          service_continuity_plan,
          spare_parts_plan,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `,
      [
        input.id,
        input.productId,
        input.summary,
        JSON.stringify(input.stockPositions),
        JSON.stringify(input.milestones),
        input.kdHandoffNotes,
        input.serviceContinuityPlan,
        input.sparePartsPlan,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  async findByProductId(productId: string): Promise<EolExecutionPlanRecord | null> {
    const result = await this.databaseService.query<EolExecutionPlanRow>(
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
    input: UpdateEolExecutionPlanInput,
  ): Promise<EolExecutionPlanRecord | null> {
    const updates: string[] = [];
    const params: unknown[] = [];

    if (input.summary !== undefined) {
      params.push(input.summary);
      updates.push(`summary = $${params.length}`);
    }

    if (input.stockPositions !== undefined) {
      params.push(JSON.stringify(input.stockPositions));
      updates.push(`stock_positions = $${params.length}::jsonb`);
    }

    if (input.milestones !== undefined) {
      params.push(JSON.stringify(input.milestones));
      updates.push(`milestones = $${params.length}::jsonb`);
    }

    if (input.kdHandoffNotes !== undefined) {
      params.push(input.kdHandoffNotes);
      updates.push(`kd_handoff_notes = $${params.length}`);
    }

    if (input.serviceContinuityPlan !== undefined) {
      params.push(input.serviceContinuityPlan);
      updates.push(`service_continuity_plan = $${params.length}`);
    }

    if (input.sparePartsPlan !== undefined) {
      params.push(input.sparePartsPlan);
      updates.push(`spare_parts_plan = $${params.length}`);
    }

    if (updates.length === 0) {
      return this.findByProductId(productId);
    }

    params.push(productId);

    const result = await this.databaseService.query<EolExecutionPlanRow>(
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

  private mapRow(row: EolExecutionPlanRow | undefined): EolExecutionPlanRecord {
    if (!row) {
      throw new Error('Expected an EOL execution plan row but received none.');
    }

    return {
      createdAt: row.created_at,
      id: row.id,
      kdHandoffNotes: row.kd_handoff_notes,
      milestones: row.milestones ?? [],
      productId: row.product_id,
      serviceContinuityPlan: row.service_continuity_plan,
      sparePartsPlan: row.spare_parts_plan,
      stockPositions: row.stock_positions ?? [],
      summary: row.summary,
      updatedAt: row.updated_at,
    };
  }
}
