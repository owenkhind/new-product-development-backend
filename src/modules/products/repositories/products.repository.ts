import { Injectable } from '@nestjs/common';
import type { PoolClient, QueryResultRow } from 'pg';

import type { DatabaseQueryable } from '../../../database/database-queryable.type';
import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type { ProductBrand } from '../../../enums/product-brand.enum';
import type { ProductCategory } from '../../../enums/product-category.enum';
import type { ProductStage } from '../../../enums/product-stage.enum';
import type { ProductStatus } from '../../../enums/product-status.enum';
import { UserRole } from '../../../enums/user-role.enum';
import type { ProductRecord } from '../types/product-record.type';

type ProductRow = QueryResultRow & {
  brand: ProductBrand;
  category: ProductCategory;
  cluster_owner_user_ids: string[] | null;
  commercial_owner_user_id: string | null;
  created_at: Date;
  current_stage: ProductStage;
  description: string | null;
  finance_owner_user_id: string | null;
  id: string;
  marketing_owner_user_id: string | null;
  product_code: string | null;
  product_owner_user_id: string;
  status: ProductStatus;
  updated_at: Date;
  working_name: string;
};

type CreateProductInput = {
  brand: ProductBrand;
  category: ProductCategory;
  clusterOwnerUserIds: string[];
  commercialOwnerUserId: string | null;
  currentStage: ProductStage;
  description: string | null;
  financeOwnerUserId: string | null;
  id: string;
  marketingOwnerUserId: string | null;
  productCode: string | null;
  productOwnerUserId: string;
  status: ProductStatus;
  workingName: string;
};

type ListProductsFilters = {
  actorId: string;
  actorRole: UserRole;
  brand?: ProductBrand;
  category?: ProductCategory;
  limit: number;
  offset: number;
  productOwnerUserId?: string;
  stage?: ProductStage;
  status?: ProductStatus;
};

type UpdateProductInput = Partial<Omit<CreateProductInput, 'id'>> & {
  clusterOwnerUserIds?: string[];
};

@Injectable()
export class ProductsRepository {
  private readonly productsTableName = qualifyTableName('products');
  private readonly clusterAssignmentsTableName = qualifyTableName('product_cluster_assignments');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateProductInput): Promise<ProductRecord> {
    const client = await this.databaseService.getClient();

    try {
      await client.query('BEGIN');

      const result = await client.query<ProductRow>(
        `
          INSERT INTO ${this.productsTableName} (
            id,
            product_code,
            working_name,
            brand,
            category,
            description,
            current_stage,
            status,
            product_owner_user_id,
            commercial_owner_user_id,
            finance_owner_user_id,
            marketing_owner_user_id,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
          RETURNING id, product_code, working_name, brand, category, description, current_stage,
            status, product_owner_user_id, commercial_owner_user_id, finance_owner_user_id,
            marketing_owner_user_id, created_at, updated_at
        `,
        [
          input.id,
          input.productCode,
          input.workingName,
          input.brand,
          input.category,
          input.description,
          input.currentStage,
          input.status,
          input.productOwnerUserId,
          input.commercialOwnerUserId,
          input.financeOwnerUserId,
          input.marketingOwnerUserId,
        ],
      );

      await this.replaceClusterAssignments(client, input.id, input.clusterOwnerUserIds);
      await client.query('COMMIT');

      return {
        ...this.mapRow(result.rows[0]),
        clusterOwnerUserIds: [...input.clusterOwnerUserIds],
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<ProductRecord | null> {
    const result = await this.databaseService.query<ProductRow>(
      this.buildSelectQuery(`
        WHERE product.id = $1
        GROUP BY product.id
        LIMIT 1
      `),
      [id],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findByProductCode(productCode: string): Promise<ProductRecord | null> {
    const result = await this.databaseService.query<ProductRow>(
      this.buildSelectQuery(`
        WHERE product.product_code = $1
        GROUP BY product.id
        LIMIT 1
      `),
      [productCode],
    );

    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async list(filters: ListProductsFilters): Promise<{ rows: ProductRecord[]; total: number }> {
    const whereClauses: string[] = [];
    const params: unknown[] = [];

    if (!this.hasGlobalProductViewAccess(filters.actorRole)) {
      params.push(filters.actorId);
      whereClauses.push(`
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
      `);
    }

    if (filters.brand) {
      params.push(filters.brand);
      whereClauses.push(`product.brand = $${params.length}`);
    }

    if (filters.category) {
      params.push(filters.category);
      whereClauses.push(`product.category = $${params.length}`);
    }

    if (filters.productOwnerUserId) {
      params.push(filters.productOwnerUserId);
      whereClauses.push(`product.product_owner_user_id = $${params.length}`);
    }

    if (filters.stage) {
      params.push(filters.stage);
      whereClauses.push(`product.current_stage = $${params.length}`);
    }

    if (filters.status) {
      params.push(filters.status);
      whereClauses.push(`product.status = $${params.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const countParams = [...params];

    params.push(filters.limit, filters.offset);

    const [countResult, rowsResult] = await Promise.all([
      this.databaseService.query<{ total: string }>(
        `
          SELECT COUNT(*)::text AS total
          FROM ${this.productsTableName} product
          ${whereSql}
        `,
        countParams,
      ),
      this.databaseService.query<ProductRow>(
        this.buildSelectQuery(`
          ${whereSql}
          GROUP BY product.id
          ORDER BY product.created_at DESC
          LIMIT $${params.length - 1}
          OFFSET $${params.length}
        `),
        params,
      ),
    ]);

    return {
      rows: rowsResult.rows.map((row) => this.mapRow(row)),
      total: Number(countResult.rows[0]?.total ?? 0),
    };
  }

  async update(
    id: string,
    input: UpdateProductInput,
    executor?: DatabaseQueryable,
  ): Promise<ProductRecord | null> {
    const client = executor ?? (await this.databaseService.getClient());
    const shouldReleaseClient = !executor;
    const shouldManageTransaction = !executor;

    try {
      if (shouldManageTransaction) {
        await client.query('BEGIN');
      }

      const updates: string[] = [];
      const params: unknown[] = [];

      if (input.productCode !== undefined) {
        params.push(input.productCode);
        updates.push(`product_code = $${params.length}`);
      }

      if (input.workingName !== undefined) {
        params.push(input.workingName);
        updates.push(`working_name = $${params.length}`);
      }

      if (input.brand !== undefined) {
        params.push(input.brand);
        updates.push(`brand = $${params.length}`);
      }

      if (input.category !== undefined) {
        params.push(input.category);
        updates.push(`category = $${params.length}`);
      }

      if (input.description !== undefined) {
        params.push(input.description);
        updates.push(`description = $${params.length}`);
      }

      if (input.currentStage !== undefined) {
        params.push(input.currentStage);
        updates.push(`current_stage = $${params.length}`);
      }

      if (input.status !== undefined) {
        params.push(input.status);
        updates.push(`status = $${params.length}`);
      }

      if (input.productOwnerUserId !== undefined) {
        params.push(input.productOwnerUserId);
        updates.push(`product_owner_user_id = $${params.length}`);
      }

      if (input.commercialOwnerUserId !== undefined) {
        params.push(input.commercialOwnerUserId);
        updates.push(`commercial_owner_user_id = $${params.length}`);
      }

      if (input.financeOwnerUserId !== undefined) {
        params.push(input.financeOwnerUserId);
        updates.push(`finance_owner_user_id = $${params.length}`);
      }

      if (input.marketingOwnerUserId !== undefined) {
        params.push(input.marketingOwnerUserId);
        updates.push(`marketing_owner_user_id = $${params.length}`);
      }

      if (updates.length > 0) {
        params.push(id);

        const updateResult = await client.query<ProductRow>(
          `
            UPDATE ${this.productsTableName}
            SET ${updates.join(', ')}, updated_at = NOW()
            WHERE id = $${params.length}
            RETURNING id
          `,
          params,
        );

        if (updateResult.rows.length === 0) {
          if (shouldManageTransaction) {
            await client.query('ROLLBACK');
          }
          return null;
        }
      } else {
        const existingResult = await client.query<{ id: string }>(
          `SELECT id FROM ${this.productsTableName} WHERE id = $1 LIMIT 1`,
          [id],
        );

        if (existingResult.rows.length === 0) {
          if (shouldManageTransaction) {
            await client.query('ROLLBACK');
          }
          return null;
        }
      }

      if (input.clusterOwnerUserIds !== undefined) {
        await this.replaceClusterAssignments(client as PoolClient, id, input.clusterOwnerUserIds);
      }

      const result = await client.query<ProductRow>(
        this.buildSelectQuery(`
          WHERE product.id = $1
          GROUP BY product.id
          LIMIT 1
        `),
        [id],
      );

      if (shouldManageTransaction) {
        await client.query('COMMIT');
      }

      return result.rows[0] ? this.mapRow(result.rows[0]) : null;
    } catch (error) {
      if (shouldManageTransaction) {
        await client.query('ROLLBACK');
      }
      throw error;
    } finally {
      if (shouldReleaseClient && 'release' in client && typeof client.release === 'function') {
        client.release();
      }
    }
  }

  private hasGlobalProductViewAccess(role: UserRole): boolean {
    return [
      UserRole.ADMIN,
      UserRole.HEAD_OF_PRODUCT,
      UserRole.QA_TSD_REVIEWER,
      UserRole.COO_EXECUTIVE_APPROVER,
    ].includes(role);
  }

  private buildSelectQuery(suffix: string): string {
    return `
      SELECT
        product.id,
        product.product_code,
        product.working_name,
        product.brand,
        product.category,
        product.description,
        product.current_stage,
        product.status,
        product.product_owner_user_id,
        product.commercial_owner_user_id,
        product.finance_owner_user_id,
        product.marketing_owner_user_id,
        product.created_at,
        product.updated_at,
        COALESCE(
          ARRAY_AGG(cluster_assignment.user_id ORDER BY cluster_assignment.user_id)
            FILTER (WHERE cluster_assignment.user_id IS NOT NULL),
          ARRAY[]::uuid[]
        ) AS cluster_owner_user_ids
      FROM ${this.productsTableName} product
      LEFT JOIN ${this.clusterAssignmentsTableName} cluster_assignment
        ON cluster_assignment.product_id = product.id
      ${suffix}
    `;
  }

  private async replaceClusterAssignments(
    client: PoolClient,
    productId: string,
    clusterOwnerUserIds: string[],
  ): Promise<void> {
    await client.query(
      `DELETE FROM ${this.clusterAssignmentsTableName} WHERE product_id = $1`,
      [productId],
    );

    if (clusterOwnerUserIds.length === 0) {
      return;
    }

    const valuesSql = clusterOwnerUserIds
      .map((_, index) => `($1, $${index + 2}, NOW())`)
      .join(', ');

    await client.query(
      `
        INSERT INTO ${this.clusterAssignmentsTableName} (product_id, user_id, created_at)
        VALUES ${valuesSql}
      `,
      [productId, ...clusterOwnerUserIds],
    );
  }

  private mapRow(row: ProductRow | undefined): ProductRecord {
    if (!row) {
      throw new Error('Expected a product row but received none.');
    }

    return {
      brand: row.brand,
      category: row.category,
      clusterOwnerUserIds: row.cluster_owner_user_ids ?? [],
      commercialOwnerUserId: row.commercial_owner_user_id,
      createdAt: row.created_at,
      currentStage: row.current_stage,
      description: row.description,
      financeOwnerUserId: row.finance_owner_user_id,
      id: row.id,
      marketingOwnerUserId: row.marketing_owner_user_id,
      productCode: row.product_code,
      productOwnerUserId: row.product_owner_user_id,
      status: row.status,
      updatedAt: row.updated_at,
      workingName: row.working_name,
    };
  }
}
