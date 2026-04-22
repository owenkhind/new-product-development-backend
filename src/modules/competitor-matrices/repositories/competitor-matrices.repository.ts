import { Injectable } from '@nestjs/common';
import type { PoolClient, QueryResultRow } from 'pg';
import { randomUUID } from 'node:crypto';

import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import type {
  CompetitorMatrixEntryRecord,
  CompetitorMatrixRecord,
} from '../types/competitor-matrix-record.type';

type CompetitorMatrixRow = QueryResultRow & {
  created_at: Date;
  id: string;
  product_id: string;
  scoring_methodology: string;
  summary: string | null;
  updated_at: Date;
};

type CompetitorMatrixEntryRow = QueryResultRow & {
  brand_name: string;
  competitor_name: string;
  design_score: number;
  feature_score: number;
  id: string;
  model_name: string;
  overall_score: number;
  price: string;
  strengths: string[] | null;
  value_score: number;
  weaknesses: string[] | null;
};

type CreateCompetitorMatrixInput = Omit<CompetitorMatrixRecord, 'createdAt' | 'updatedAt'>;
type UpdateCompetitorMatrixInput = Partial<Omit<CreateCompetitorMatrixInput, 'id' | 'productId'>>;

@Injectable()
export class CompetitorMatricesRepository {
  private readonly matrixTableName = qualifyTableName('competitor_matrices');
  private readonly entryTableName = qualifyTableName('competitor_matrix_entries');

  constructor(private readonly databaseService: DatabaseService) {}

  async create(input: CreateCompetitorMatrixInput): Promise<CompetitorMatrixRecord> {
    const client = await this.databaseService.getClient();

    try {
      await client.query('BEGIN');
      const matrix = await this.insertMatrix(client, input);
      await this.replaceEntries(client, matrix.id, input.entries);
      await client.query('COMMIT');

      return {
        ...matrix,
        entries: input.entries,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findByProductId(productId: string): Promise<CompetitorMatrixRecord | null> {
    const matrixResult = await this.databaseService.query<CompetitorMatrixRow>(
      `
        SELECT *
        FROM ${this.matrixTableName}
        WHERE product_id = $1
        LIMIT 1
      `,
      [productId],
    );

    const matrixRow = matrixResult.rows[0];

    if (!matrixRow) {
      return null;
    }

    const entriesResult = await this.databaseService.query<CompetitorMatrixEntryRow>(
      `
        SELECT id, competitor_name, brand_name, model_name, price, strengths, weaknesses,
          feature_score, value_score, design_score, overall_score
        FROM ${this.entryTableName}
        WHERE matrix_id = $1
        ORDER BY display_order ASC
      `,
      [matrixRow.id],
    );

    return {
      ...this.mapMatrixRow(matrixRow),
      entries: entriesResult.rows.map((entryRow) => this.mapEntryRow(entryRow)),
    };
  }

  async update(productId: string, input: UpdateCompetitorMatrixInput): Promise<CompetitorMatrixRecord | null> {
    const existingRecord = await this.findByProductId(productId);

    if (!existingRecord) {
      return null;
    }

    const client = await this.databaseService.getClient();

    try {
      await client.query('BEGIN');

      const result = await client.query<CompetitorMatrixRow>(
        `
          UPDATE ${this.matrixTableName}
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

      const matrixRow = result.rows[0];

      if (!matrixRow) {
        throw new Error('Competitor matrix update did not return a row.');
      }

      const nextEntries = input.entries ?? existingRecord.entries;

      await this.replaceEntries(client, matrixRow.id, nextEntries);
      await client.query('COMMIT');

      return {
        ...this.mapMatrixRow(matrixRow),
        entries: nextEntries,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async insertMatrix(
    client: PoolClient,
    input: CreateCompetitorMatrixInput,
  ): Promise<Omit<CompetitorMatrixRecord, 'entries'>> {
    const result = await client.query<CompetitorMatrixRow>(
      `
        INSERT INTO ${this.matrixTableName} (
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
      throw new Error('Competitor matrix insert did not return a row.');
    }

    return this.mapMatrixRow(row);
  }

  private async replaceEntries(
    client: PoolClient,
    matrixId: string,
    entries: CompetitorMatrixEntryRecord[],
  ): Promise<void> {
    await client.query(`DELETE FROM ${this.entryTableName} WHERE matrix_id = $1`, [matrixId]);

    for (const [index, entry] of entries.entries()) {
      await client.query(
        `
          INSERT INTO ${this.entryTableName} (
            id,
            matrix_id,
            display_order,
            competitor_name,
            brand_name,
            model_name,
            price,
            strengths,
            weaknesses,
            feature_score,
            value_score,
            design_score,
            overall_score
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `,
        [
          entry.id || randomUUID(),
          matrixId,
          index + 1,
          entry.competitorName,
          entry.brandName,
          entry.modelName,
          entry.price,
          entry.strengths,
          entry.weaknesses,
          entry.featureScore,
          entry.valueScore,
          entry.designScore,
          entry.overallScore,
        ],
      );
    }
  }

  private mapMatrixRow(row: CompetitorMatrixRow): Omit<CompetitorMatrixRecord, 'entries'> {
    return {
      createdAt: row.created_at,
      id: row.id,
      productId: row.product_id,
      scoringMethodology: row.scoring_methodology,
      summary: row.summary,
      updatedAt: row.updated_at,
    };
  }

  private mapEntryRow(row: CompetitorMatrixEntryRow): CompetitorMatrixEntryRecord {
    return {
      brandName: row.brand_name,
      competitorName: row.competitor_name,
      designScore: row.design_score,
      featureScore: row.feature_score,
      id: row.id,
      modelName: row.model_name,
      overallScore: row.overall_score,
      price: row.price,
      strengths: row.strengths ?? [],
      valueScore: row.value_score,
      weaknesses: row.weaknesses ?? [],
    };
  }
}
