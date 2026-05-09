import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type { ProductCategory } from '../../../enums/product-category.enum';
import { ProductStage } from '../../../enums/product-stage.enum';
import type { ProductStatus } from '../../../enums/product-status.enum';
import { UserRole } from '../../../enums/user-role.enum';
import type {
  DashboardProductRecord,
  DashboardRepositoryResult,
  DashboardStageStatusCount,
} from '../types/dashboard.type';

type DashboardProductRow = QueryResultRow & {
  category: ProductCategory;
  created_at: Date;
  id: string;
  owner_name: string | null;
  product_owner_user_id: string;
  product_code: string | null;
  stage: ProductStage;
  status: ProductStatus;
  updated_at: Date;
  working_name: string;
};

type DashboardStageStatusRow = QueryResultRow & {
  product_count: number | string;
  stage: ProductStage;
  status: ProductStatus;
};

const DASHBOARD_PRODUCT_LIMIT = 100;

@Injectable()
export class DashboardRepository {
  private readonly clusterAssignmentsTableName = qualifyTableName(
    'product_cluster_assignments',
  );
  private readonly productsTableName = qualifyTableName('products');
  private readonly usersTableName = qualifyTableName('users');

  constructor(private readonly databaseService: DatabaseService) {}

  async getDashboard(input: {
    actorId: string;
    actorRole: UserRole;
  }): Promise<DashboardRepositoryResult> {
    const params: unknown[] = [];
    const accessClause = this.buildAccessClause(input, params);

    const [productsResult, stageStatusResult] = await Promise.all([
      this.databaseService.query<DashboardProductRow>(
        `
          SELECT
            product.id,
            product.product_code,
            product.product_owner_user_id,
            product.working_name,
            product.category,
            product.created_at,
            product.current_stage AS stage,
            product.status,
            product.updated_at,
            owner.full_name AS owner_name
          FROM ${this.productsTableName} product
          LEFT JOIN ${this.usersTableName} owner
            ON owner.id = product.product_owner_user_id
          WHERE ${accessClause}
          ORDER BY product.updated_at DESC
          LIMIT $${params.length + 1}
        `,
        [...params, DASHBOARD_PRODUCT_LIMIT],
      ),
      this.databaseService.query<DashboardStageStatusRow>(
        `
          SELECT
            product.current_stage AS stage,
            product.status,
            COUNT(*)::int AS product_count
          FROM ${this.productsTableName} product
          WHERE ${accessClause}
          GROUP BY product.current_stage, product.status
        `,
        params,
      ),
    ]);

    return {
      products: productsResult.rows.map((row) => this.mapProductRow(row)),
      stageStatusCounts: stageStatusResult.rows.map((row) =>
        this.mapStageStatusRow(row),
      ),
    };
  }

  private buildAccessClause(
    input: { actorId: string; actorRole: UserRole },
    params: unknown[],
  ): string {
    if (this.hasGlobalProductViewAccess(input.actorRole)) {
      return 'TRUE';
    }

    params.push(input.actorId);

    return `
      (
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

  private hasGlobalProductViewAccess(role: UserRole): boolean {
    return [
      UserRole.ADMIN,
      UserRole.HEAD_OF_PRODUCT,
      UserRole.QA_TSD_REVIEWER,
      UserRole.COO_EXECUTIVE_APPROVER,
    ].includes(role);
  }

  private mapProductRow(row: DashboardProductRow): DashboardProductRecord {
    return {
      category: row.category,
      createdAt: row.created_at,
      id: row.id,
      ownerName: row.owner_name,
      ownerUserId: row.product_owner_user_id,
      productCode: row.product_code,
      stage: row.stage,
      status: row.status,
      updatedAt: row.updated_at,
      workingName: row.working_name,
    };
  }

  private mapStageStatusRow(
    row: DashboardStageStatusRow,
  ): DashboardStageStatusCount {
    return {
      count: Number(row.product_count),
      stage: row.stage,
      status: row.status,
    };
  }
}
