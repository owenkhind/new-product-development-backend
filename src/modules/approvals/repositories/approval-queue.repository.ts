import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type { GateDecisionOutcome } from '../../../enums/gate-decision-outcome.enum';
import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductStatus } from '../../../enums/product-status.enum';
import { UserRole } from '../../../enums/user-role.enum';

export type ApprovalQueueRecord = {
  category: string;
  id: string;
  latestDecisionActorUserId: string | null;
  latestDecisionComment: string | null;
  latestDecisionCreatedAt: Date | null;
  latestDecisionIsAdminSupportAction: boolean | null;
  latestDecisionOutcome: GateDecisionOutcome | null;
  latestDecisionOverrideReason: string | null;
  ownerName: string | null;
  productCode: string | null;
  stage: ProductStage;
  status: ProductStatus;
  updatedAt: Date;
  workingName: string;
};

type ApprovalQueueRow = QueryResultRow & {
  category: string;
  id: string;
  latest_decision_actor_user_id: string | null;
  latest_decision_comment: string | null;
  latest_decision_created_at: Date | null;
  latest_decision_is_admin_support_action: boolean | null;
  latest_decision_outcome: GateDecisionOutcome | null;
  latest_decision_override_reason: string | null;
  owner_name: string | null;
  product_code: string | null;
  stage: ProductStage;
  status: ProductStatus;
  updated_at: Date;
  working_name: string;
};

@Injectable()
export class ApprovalQueueRepository {
  private readonly gateDecisionsTableName = qualifyTableName('gate_decisions');
  private readonly productsTableName = qualifyTableName('products');
  private readonly usersTableName = qualifyTableName('users');

  constructor(private readonly databaseService: DatabaseService) {}

  async listForActor(input: {
    actorId: string;
    actorRole: UserRole;
    limit: number;
  }): Promise<ApprovalQueueRecord[]> {
    const params: unknown[] = [];
    const roleClause = this.buildRoleClause(
      input.actorRole,
      input.actorId,
      params,
    );

    params.push(input.limit);

    const result = await this.databaseService.query<ApprovalQueueRow>(
      `
        SELECT
          product.id,
          product.product_code,
          product.working_name,
          product.category,
          product.current_stage AS stage,
          product.status,
          product.updated_at,
          owner.full_name AS owner_name,
          latest_decision.outcome AS latest_decision_outcome,
          latest_decision.actor_user_id AS latest_decision_actor_user_id,
          latest_decision.comment AS latest_decision_comment,
          latest_decision.override_reason AS latest_decision_override_reason,
          latest_decision.is_admin_support_action AS latest_decision_is_admin_support_action,
          latest_decision.created_at AS latest_decision_created_at
        FROM ${this.productsTableName} product
        LEFT JOIN ${this.usersTableName} owner
          ON owner.id = product.product_owner_user_id
        LEFT JOIN LATERAL (
          SELECT
            decision.outcome,
            decision.actor_user_id,
            decision.comment,
            decision.override_reason,
            decision.is_admin_support_action,
            decision.created_at
          FROM ${this.gateDecisionsTableName} decision
          WHERE decision.product_id = product.id
            AND decision.gate_stage = product.current_stage
          ORDER BY decision.created_at DESC
          LIMIT 1
        ) latest_decision ON TRUE
        WHERE product.status IN ($${params.length + 1}, $${params.length + 2}, $${params.length + 3})
          AND ${roleClause}
        ORDER BY
          CASE product.status
            WHEN $${params.length + 2} THEN 0
            WHEN $${params.length + 1} THEN 1
            ELSE 2
          END,
          product.updated_at DESC
        LIMIT $${params.length}
      `,
      [
        ...params,
        ProductStatus.IN_REVIEW,
        ProductStatus.BLOCKED,
        ProductStatus.REJECTED,
      ],
    );

    return result.rows.map((row) => this.mapRow(row));
  }

  private buildRoleClause(
    actorRole: UserRole,
    actorId: string,
    params: unknown[],
  ): string {
    if (actorRole === UserRole.ADMIN) {
      return 'TRUE';
    }

    if (actorRole === UserRole.HEAD_OF_PRODUCT) {
      return `product.current_stage = '${ProductStage.STAGE_1}'`;
    }

    if (actorRole === UserRole.COO_EXECUTIVE_APPROVER) {
      return `product.current_stage IN ('${ProductStage.STAGE_2}', '${ProductStage.STAGE_3}', '${ProductStage.STAGE_4}', '${ProductStage.STAGE_5}', '${ProductStage.STAGE_6}')`;
    }

    if (actorRole === UserRole.GM_COMMERCIAL_OWNER) {
      return `product.current_stage IN ('${ProductStage.STAGE_4}', '${ProductStage.STAGE_5}')`;
    }

    return 'FALSE';
  }

  private mapRow(row: ApprovalQueueRow): ApprovalQueueRecord {
    return {
      category: row.category,
      id: row.id,
      latestDecisionActorUserId: row.latest_decision_actor_user_id,
      latestDecisionComment: row.latest_decision_comment,
      latestDecisionCreatedAt: row.latest_decision_created_at,
      latestDecisionIsAdminSupportAction:
        row.latest_decision_is_admin_support_action,
      latestDecisionOutcome: row.latest_decision_outcome,
      latestDecisionOverrideReason: row.latest_decision_override_reason,
      ownerName: row.owner_name,
      productCode: row.product_code,
      stage: row.stage,
      status: row.status,
      updatedAt: row.updated_at,
      workingName: row.working_name,
    };
  }
}
