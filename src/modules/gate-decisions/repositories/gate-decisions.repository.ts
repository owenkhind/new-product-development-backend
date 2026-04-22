import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import type { DatabaseQueryable } from '../../../database/database-queryable.type';
import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type { ProductStage } from '../../../enums/product-stage.enum';
import type { WorkflowTransitionAction } from '../../../enums/workflow-transition-action.enum';
import type { GateDecisionRecord } from '../types/gate-decision-record.type';

type GateDecisionRow = QueryResultRow & {
  acting_as_user_id: string | null;
  actor_user_id: string;
  comment: string | null;
  created_at: Date;
  gate_stage: ProductStage;
  id: string;
  is_admin_support_action: boolean;
  outcome: WorkflowTransitionAction;
  override_reason: string | null;
  product_id: string;
};

type CreateGateDecisionInput = {
  actingAsUserId: string | null;
  actorUserId: string;
  comment: string | null;
  gateStage: ProductStage;
  id: string;
  isAdminSupportAction: boolean;
  outcome: WorkflowTransitionAction;
  overrideReason: string | null;
  productId: string;
};

@Injectable()
export class GateDecisionsRepository {
  private readonly tableName = qualifyTableName('gate_decisions');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    input: CreateGateDecisionInput,
    executor?: DatabaseQueryable,
  ): Promise<GateDecisionRecord> {
    const queryable = executor ?? this.databaseService;

    const result = await queryable.query<GateDecisionRow>(
      `
        INSERT INTO ${this.tableName} (
          id,
          product_id,
          gate_stage,
          outcome,
          actor_user_id,
          acting_as_user_id,
          comment,
          override_reason,
          is_admin_support_action,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING
          id,
          product_id,
          gate_stage,
          outcome,
          actor_user_id,
          acting_as_user_id,
          comment,
          override_reason,
          is_admin_support_action,
          created_at
      `,
      [
        input.id,
        input.productId,
        input.gateStage,
        input.outcome,
        input.actorUserId,
        input.actingAsUserId,
        input.comment,
        input.overrideReason,
        input.isAdminSupportAction,
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  async listByProductId(productId: string): Promise<GateDecisionRecord[]> {
    const result = await this.databaseService.query<GateDecisionRow>(
      `
        SELECT
          id,
          product_id,
          gate_stage,
          outcome,
          actor_user_id,
          acting_as_user_id,
          comment,
          override_reason,
          is_admin_support_action,
          created_at
        FROM ${this.tableName}
        WHERE product_id = $1
        ORDER BY created_at DESC
      `,
      [productId],
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  private mapRow(row: GateDecisionRow | undefined): GateDecisionRecord {
    if (!row) {
      throw new Error('Expected a gate decision row but received none.');
    }

    return {
      actingAsUserId: row.acting_as_user_id,
      actorUserId: row.actor_user_id,
      comment: row.comment,
      createdAt: row.created_at,
      gateStage: row.gate_stage,
      id: row.id,
      isAdminSupportAction: row.is_admin_support_action,
      outcome: row.outcome,
      overrideReason: row.override_reason,
      productId: row.product_id,
    };
  }
}
