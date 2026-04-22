import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import type { DatabaseQueryable } from '../../../database/database-queryable.type';
import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type { AuditEntityType } from '../../../enums/audit-entity-type.enum';
import type { WorkflowTransitionAction } from '../../../enums/workflow-transition-action.enum';
import type { AuditLogRecord } from '../types/audit-log-record.type';

type AuditLogRow = QueryResultRow & {
  acting_as_user_id: string | null;
  action: WorkflowTransitionAction;
  actor_user_id: string;
  created_at: Date;
  entity_id: string;
  entity_type: AuditEntityType;
  from_state: Record<string, unknown> | null;
  id: string;
  metadata: Record<string, unknown> | null;
  product_id: string | null;
  to_state: Record<string, unknown> | null;
};

type CreateAuditLogInput = {
  actingAsUserId: string | null;
  action: WorkflowTransitionAction;
  actorUserId: string;
  entityId: string;
  entityType: AuditEntityType;
  fromState: Record<string, unknown> | null;
  id: string;
  metadata: Record<string, unknown>;
  productId: string | null;
  toState: Record<string, unknown> | null;
};

type ListAuditLogsFilters = {
  limit: number;
  offset: number;
  productId: string;
};

@Injectable()
export class AuditLogsRepository {
  private readonly tableName = qualifyTableName('audit_logs');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateAuditLogInput, executor?: DatabaseQueryable): Promise<AuditLogRecord> {
    const queryable = executor ?? this.databaseService;

    const result = await queryable.query<AuditLogRow>(
      `
        INSERT INTO ${this.tableName} (
          id,
          entity_type,
          entity_id,
          product_id,
          actor_user_id,
          acting_as_user_id,
          action,
          from_state,
          to_state,
          metadata,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, NOW())
        RETURNING
          id,
          entity_type,
          entity_id,
          product_id,
          actor_user_id,
          acting_as_user_id,
          action,
          from_state,
          to_state,
          metadata,
          created_at
      `,
      [
        input.id,
        input.entityType,
        input.entityId,
        input.productId,
        input.actorUserId,
        input.actingAsUserId,
        input.action,
        JSON.stringify(input.fromState),
        JSON.stringify(input.toState),
        JSON.stringify(input.metadata),
      ],
    );

    return this.mapRow(result.rows[0]);
  }

  async listByProductId(filters: ListAuditLogsFilters): Promise<{ rows: AuditLogRecord[]; total: number }> {
    const [countResult, rowsResult] = await Promise.all([
      this.databaseService.query<{ total: string }>(
        `
          SELECT COUNT(*)::text AS total
          FROM ${this.tableName}
          WHERE product_id = $1
        `,
        [filters.productId],
      ),
      this.databaseService.query<AuditLogRow>(
        `
          SELECT
            id,
            entity_type,
            entity_id,
            product_id,
            actor_user_id,
            acting_as_user_id,
            action,
            from_state,
            to_state,
            metadata,
            created_at
          FROM ${this.tableName}
          WHERE product_id = $1
          ORDER BY created_at DESC
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

  private mapRow(row: AuditLogRow | undefined): AuditLogRecord {
    if (!row) {
      throw new Error('Expected an audit log row but received none.');
    }

    return {
      actingAsUserId: row.acting_as_user_id,
      action: row.action,
      actorUserId: row.actor_user_id,
      createdAt: row.created_at,
      entityId: row.entity_id,
      entityType: row.entity_type,
      fromState: row.from_state,
      id: row.id,
      metadata: row.metadata ?? {},
      productId: row.product_id,
      toState: row.to_state,
    };
  }
}
