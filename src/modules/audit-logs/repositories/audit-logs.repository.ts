import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import type { DatabaseQueryable } from '../../../database/database-queryable.type';
import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type { AuditAction } from '../../../enums/audit-action.enum';
import type { AuditEntityType } from '../../../enums/audit-entity-type.enum';
import { UserRole } from '../../../enums/user-role.enum';
import type {
  AuditDashboardRecord,
  AuditLogRecord,
} from '../types/audit-log-record.type';

type AuditLogRow = QueryResultRow & {
  acting_as_user_id: string | null;
  action: AuditAction;
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

type AuditDashboardRow = AuditLogRow & {
  actor_name: string | null;
  actor_role: string | null;
  product_name: string | null;
};

type CreateAuditLogInput = {
  actingAsUserId: string | null;
  action: AuditAction;
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

type ListAuditDashboardFilters = {
  actorId: string;
  actorRole: UserRole;
  limit: number;
  offset: number;
};

@Injectable()
export class AuditLogsRepository {
  private readonly tableName = qualifyTableName('audit_logs');
  private readonly clusterAssignmentsTableName = qualifyTableName(
    'product_cluster_assignments',
  );
  private readonly productsTableName = qualifyTableName('products');
  private readonly usersTableName = qualifyTableName('users');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(
    input: CreateAuditLogInput,
    executor?: DatabaseQueryable,
  ): Promise<AuditLogRecord> {
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

  async listByProductId(
    filters: ListAuditLogsFilters,
  ): Promise<{ rows: AuditLogRecord[]; total: number }> {
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

  async listDashboard(
    filters: ListAuditDashboardFilters,
  ): Promise<{ rows: AuditDashboardRecord[]; total: number }> {
    const params: unknown[] = [];
    const accessClause = this.buildDashboardAccessClause(filters, params);

    const [countResult, rowsResult] = await Promise.all([
      this.databaseService.query<{ total: string }>(
        `
          SELECT COUNT(*)::text AS total
          FROM ${this.tableName} audit_log
          LEFT JOIN ${this.productsTableName} product
            ON product.id = audit_log.product_id
          WHERE ${accessClause}
        `,
        params,
      ),
      this.databaseService.query<AuditDashboardRow>(
        `
          SELECT
            audit_log.id,
            audit_log.entity_type,
            audit_log.entity_id,
            audit_log.product_id,
            audit_log.actor_user_id,
            audit_log.acting_as_user_id,
            audit_log.action,
            audit_log.from_state,
            audit_log.to_state,
            audit_log.metadata,
            audit_log.created_at,
            product.working_name AS product_name,
            actor.full_name AS actor_name,
            actor.role AS actor_role
          FROM ${this.tableName} audit_log
          LEFT JOIN ${this.productsTableName} product
            ON product.id = audit_log.product_id
          LEFT JOIN ${this.usersTableName} actor
            ON actor.id = audit_log.actor_user_id
          WHERE ${accessClause}
          ORDER BY audit_log.created_at DESC
          LIMIT $${params.length + 1}
          OFFSET $${params.length + 2}
        `,
        [...params, filters.limit, filters.offset],
      ),
    ]);

    return {
      rows: rowsResult.rows.map((row) => this.mapDashboardRow(row)),
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  }

  private buildDashboardAccessClause(
    filters: ListAuditDashboardFilters,
    params: unknown[],
  ): string {
    if (this.hasGlobalAuditAccess(filters.actorRole)) {
      return 'TRUE';
    }

    params.push(filters.actorId);

    return `
      audit_log.product_id IS NOT NULL
      AND (
        product.product_owner_user_id = $${params.length}
        OR product.commercial_owner_user_id = $${params.length}
        OR product.finance_owner_user_id = $${params.length}
        OR product.marketing_owner_user_id = $${params.length}
        OR EXISTS (
          SELECT 1
          FROM ${this.clusterAssignmentsTableName} access_cluster_assignment
          WHERE access_cluster_assignment.product_id = product.id
            AND access_cluster_assignment.user_id = $${params.length}
        )
      )
    `;
  }

  private hasGlobalAuditAccess(role: UserRole): boolean {
    return [
      UserRole.ADMIN,
      UserRole.HEAD_OF_PRODUCT,
      UserRole.QA_TSD_REVIEWER,
      UserRole.COO_EXECUTIVE_APPROVER,
    ].includes(role);
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

  private mapDashboardRow(row: AuditDashboardRow): AuditDashboardRecord {
    return {
      ...this.mapRow(row),
      actorName: row.actor_name,
      actorRole: row.actor_role,
      productName: row.product_name,
    };
  }
}
