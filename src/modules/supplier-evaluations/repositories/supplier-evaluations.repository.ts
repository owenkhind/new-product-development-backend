import { Injectable } from '@nestjs/common';
import type { PoolClient, QueryResultRow } from 'pg';
import { randomUUID } from 'node:crypto';

import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type {
  SupplierEvaluationRecord,
  SupplierEvaluationSupplierRecord,
} from '../types/supplier-evaluation-record.type';

type SupplierEvaluationRow = QueryResultRow & {
  created_at: Date;
  id: string;
  product_id: string;
  scoring_methodology: string;
  summary: string | null;
  updated_at: Date;
};

type SupplierRow = QueryResultRow & {
  factory_name: string;
  id: string;
  is_qualified: boolean;
  lead_time_days: number;
  moq: number;
  origin_country: string;
  payment_terms: string;
  remarks: string | null;
  spare_parts_support_notes: string | null;
  supplier_name: string;
  tooling_notes: string | null;
  weighted_score: string;
};

type CreateSupplierEvaluationInput = Omit<SupplierEvaluationRecord, 'createdAt' | 'updatedAt'>;
type UpdateSupplierEvaluationInput = Partial<Omit<CreateSupplierEvaluationInput, 'id' | 'productId'>>;

@Injectable()
export class SupplierEvaluationsRepository {
  private readonly parentTableName = qualifyTableName('supplier_evaluations');
  private readonly childTableName = qualifyTableName('supplier_evaluation_suppliers');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateSupplierEvaluationInput): Promise<SupplierEvaluationRecord> {
    const client = await this.databaseService.getClient();

    try {
      await client.query('BEGIN');
      const parent = await this.insertParent(client, input);
      await this.replaceSuppliers(client, parent.id, input.suppliers);
      await client.query('COMMIT');

      return {
        ...parent,
        suppliers: input.suppliers,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findByProductId(productId: string): Promise<SupplierEvaluationRecord | null> {
    const parentResult = await this.databaseService.query<SupplierEvaluationRow>(
      `
        SELECT *
        FROM ${this.parentTableName}
        WHERE product_id = $1
        LIMIT 1
      `,
      [productId],
    );

    const parentRow = parentResult.rows[0];

    if (!parentRow) {
      return null;
    }

    const suppliersResult = await this.databaseService.query<SupplierRow>(
      `
        SELECT
          id,
          supplier_name,
          factory_name,
          origin_country,
          moq,
          lead_time_days,
          payment_terms,
          tooling_notes,
          spare_parts_support_notes,
          weighted_score,
          is_qualified,
          remarks
        FROM ${this.childTableName}
        WHERE supplier_evaluation_id = $1
        ORDER BY display_order ASC
      `,
      [parentRow.id],
    );

    return {
      ...this.mapParentRow(parentRow),
      suppliers: suppliersResult.rows.map((row) => this.mapSupplierRow(row)),
    };
  }

  async update(
    productId: string,
    input: UpdateSupplierEvaluationInput,
  ): Promise<SupplierEvaluationRecord | null> {
    const existingRecord = await this.findByProductId(productId);

    if (!existingRecord) {
      return null;
    }

    const client = await this.databaseService.getClient();

    try {
      await client.query('BEGIN');
      const result = await client.query<SupplierEvaluationRow>(
        `
          UPDATE ${this.parentTableName}
          SET
            scoring_methodology = $1,
            summary = $2,
            updated_at = NOW()
          WHERE product_id = $3
          RETURNING *
        `,
        [
          input.scoringMethodology ?? existingRecord.scoringMethodology,
          input.summary === undefined ? existingRecord.summary : input.summary,
          productId,
        ],
      );

      const parentRow = result.rows[0];

      if (!parentRow) {
        throw new Error('Supplier evaluation update did not return a row.');
      }

      const suppliers = input.suppliers ?? existingRecord.suppliers;
      await this.replaceSuppliers(client, parentRow.id, suppliers);
      await client.query('COMMIT');

      return {
        ...this.mapParentRow(parentRow),
        suppliers,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async insertParent(
    client: PoolClient,
    input: CreateSupplierEvaluationInput,
  ): Promise<Omit<SupplierEvaluationRecord, 'suppliers'>> {
    const result = await client.query<SupplierEvaluationRow>(
      `
        INSERT INTO ${this.parentTableName} (
          id,
          product_id,
          summary,
          scoring_methodology,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *
      `,
      [input.id, input.productId, input.summary, input.scoringMethodology],
    );

    const row = result.rows[0];

    if (!row) {
      throw new Error('Supplier evaluation insert did not return a row.');
    }

    return this.mapParentRow(row);
  }

  private async replaceSuppliers(
    client: PoolClient,
    supplierEvaluationId: string,
    suppliers: SupplierEvaluationSupplierRecord[],
  ): Promise<void> {
    await client.query(
      `DELETE FROM ${this.childTableName} WHERE supplier_evaluation_id = $1`,
      [supplierEvaluationId],
    );

    for (const [index, supplier] of suppliers.entries()) {
      await client.query(
        `
          INSERT INTO ${this.childTableName} (
            id,
            supplier_evaluation_id,
            display_order,
            supplier_name,
            factory_name,
            origin_country,
            moq,
            lead_time_days,
            payment_terms,
            tooling_notes,
            spare_parts_support_notes,
            weighted_score,
            is_qualified,
            remarks
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        `,
        [
          supplier.id || randomUUID(),
          supplierEvaluationId,
          index + 1,
          supplier.supplierName,
          supplier.factoryName,
          supplier.originCountry,
          supplier.moq,
          supplier.leadTimeDays,
          supplier.paymentTerms,
          supplier.toolingNotes,
          supplier.sparePartsSupportNotes,
          supplier.weightedScore,
          supplier.isQualified,
          supplier.remarks,
        ],
      );
    }
  }

  private mapParentRow(
    row: SupplierEvaluationRow,
  ): Omit<SupplierEvaluationRecord, 'suppliers'> {
    return {
      createdAt: row.created_at,
      id: row.id,
      productId: row.product_id,
      scoringMethodology: row.scoring_methodology,
      summary: row.summary,
      updatedAt: row.updated_at,
    };
  }

  private mapSupplierRow(row: SupplierRow): SupplierEvaluationSupplierRecord {
    return {
      factoryName: row.factory_name,
      id: row.id,
      isQualified: row.is_qualified,
      leadTimeDays: row.lead_time_days,
      moq: row.moq,
      originCountry: row.origin_country,
      paymentTerms: row.payment_terms,
      remarks: row.remarks,
      sparePartsSupportNotes: row.spare_parts_support_notes,
      supplierName: row.supplier_name,
      toolingNotes: row.tooling_notes,
      weightedScore: row.weighted_score,
    };
  }
}
