import { Injectable } from '@nestjs/common';
import type { QueryResultRow } from 'pg';

import { DatabaseService } from '../../../database/database.service';
import { qualifyTableName } from '../../../database/database-schema.util';
import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductStatus } from '../../../enums/product-status.enum';
import type {
  TemplateLibraryStats,
  TemplateProductScope,
  TemplateRecordStats,
} from '../types/template-library.type';

type ProductScopeRow = QueryResultRow & {
  product_count: number | string;
  stage: ProductStage;
  status: ProductStatus;
};

type TemplateStatsRow = QueryResultRow & {
  latest_updated: Date | null;
  record_count: number | string;
  template_id: string;
};

@Injectable()
export class TemplateLibraryRepository {
  private readonly businessCasesTableName = qualifyTableName('business_cases');
  private readonly channelListingPlansTableName = qualifyTableName(
    'channel_listing_plans',
  );
  private readonly channelPricingTableName =
    qualifyTableName('channel_pricing');
  private readonly clearancePlansTableName =
    qualifyTableName('clearance_plans');
  private readonly competitorMatricesTableName = qualifyTableName(
    'competitor_matrices',
  );
  private readonly day30ReviewsTableName = qualifyTableName('day_30_reviews');
  private readonly eolExecutionPlansTableName = qualifyTableName(
    'eol_execution_plans',
  );
  private readonly gtmPlansTableName = qualifyTableName('gtm_plans');
  private readonly launchConfirmationsTableName = qualifyTableName(
    'launch_confirmations',
  );
  private readonly marketSizingRecordsTableName = qualifyTableName(
    'market_sizing_records',
  );
  private readonly opportunityBriefsTableName =
    qualifyTableName('opportunity_briefs');
  private readonly portfolioUpdatesTableName =
    qualifyTableName('portfolio_updates');
  private readonly productScorecardsTableName =
    qualifyTableName('product_scorecards');
  private readonly productsTableName = qualifyTableName('products');
  private readonly revampEolRecommendationsTableName = qualifyTableName(
    'revamp_eol_recommendations',
  );
  private readonly sellInReportsTableName = qualifyTableName('sell_in_reports');
  private readonly supplierEvaluationsTableName = qualifyTableName(
    'supplier_evaluations',
  );
  private readonly weeklyFeedbackLogsTableName = qualifyTableName(
    'weekly_feedback_logs',
  );

  constructor(private readonly databaseService: DatabaseService) {}

  async getLibraryStats(): Promise<TemplateLibraryStats> {
    const [productScopeResult, templateStatsResult] = await Promise.all([
      this.databaseService.query<ProductScopeRow>(
        `
          SELECT
            product.current_stage AS stage,
            product.status,
            COUNT(*)::int AS product_count
          FROM ${this.productsTableName} product
          GROUP BY product.current_stage, product.status
        `,
      ),
      this.databaseService.query<TemplateStatsRow>(
        `
          SELECT 'T1' AS template_id, COUNT(DISTINCT product_id)::int AS record_count, MAX(updated_at) AS latest_updated FROM ${this.opportunityBriefsTableName}
          UNION ALL
          SELECT 'T2' AS template_id, COUNT(DISTINCT product_id)::int AS record_count, MAX(updated_at) AS latest_updated FROM ${this.marketSizingRecordsTableName}
          UNION ALL
          SELECT 'T3' AS template_id, COUNT(DISTINCT product_id)::int AS record_count, MAX(updated_at) AS latest_updated FROM ${this.competitorMatricesTableName}
          UNION ALL
          SELECT 'T4' AS template_id, COUNT(DISTINCT product_id)::int AS record_count, MAX(updated_at) AS latest_updated FROM ${this.supplierEvaluationsTableName}
          UNION ALL
          SELECT 'T5' AS template_id, COUNT(DISTINCT product_id)::int AS record_count, MAX(updated_at) AS latest_updated FROM ${this.businessCasesTableName}
          UNION ALL
          SELECT 'T6' AS template_id, COUNT(DISTINCT product_id)::int AS record_count, MAX(updated_at) AS latest_updated FROM ${this.channelListingPlansTableName}
          UNION ALL
          SELECT 'T7' AS template_id, COUNT(DISTINCT product_id)::int AS record_count, MAX(updated_at) AS latest_updated FROM ${this.channelPricingTableName}
          UNION ALL
          SELECT 'T8' AS template_id, COUNT(DISTINCT product_id)::int AS record_count, MAX(updated_at) AS latest_updated FROM ${this.gtmPlansTableName}
          UNION ALL
          SELECT 'T9' AS template_id, COUNT(DISTINCT product_id)::int AS record_count, MAX(updated_at) AS latest_updated FROM ${this.launchConfirmationsTableName}
          UNION ALL
          SELECT 'T10' AS template_id, COUNT(DISTINCT product_id)::int AS record_count, MAX(updated_at) AS latest_updated FROM ${this.sellInReportsTableName}
          UNION ALL
          SELECT 'T11' AS template_id, COUNT(DISTINCT product_id)::int AS record_count, MAX(updated_at) AS latest_updated FROM ${this.weeklyFeedbackLogsTableName}
          UNION ALL
          SELECT 'T12' AS template_id, COUNT(DISTINCT product_id)::int AS record_count, MAX(updated_at) AS latest_updated FROM ${this.day30ReviewsTableName}
          UNION ALL
          SELECT 'T13' AS template_id, COUNT(DISTINCT product_id)::int AS record_count, MAX(updated_at) AS latest_updated FROM ${this.productScorecardsTableName}
          UNION ALL
          SELECT 'T14' AS template_id, COUNT(DISTINCT portfolio_row.product_id)::int AS record_count, MAX(portfolio_update.updated_at) AS latest_updated
          FROM ${this.portfolioUpdatesTableName} portfolio_update
          LEFT JOIN LATERAL (
            SELECT NULLIF(row_item->>'productId', '') AS product_id
            FROM jsonb_array_elements(portfolio_update.rows) row_item
          ) portfolio_row ON TRUE
          UNION ALL
          SELECT 'T15' AS template_id, COUNT(DISTINCT product_id)::int AS record_count, MAX(updated_at) AS latest_updated FROM ${this.revampEolRecommendationsTableName}
          UNION ALL
          SELECT 'T16' AS template_id, COUNT(DISTINCT product_id)::int AS record_count, MAX(updated_at) AS latest_updated FROM ${this.eolExecutionPlansTableName}
          UNION ALL
          SELECT 'T17' AS template_id, COUNT(DISTINCT product_id)::int AS record_count, MAX(updated_at) AS latest_updated FROM ${this.clearancePlansTableName}
        `,
      ),
    ]);

    return {
      productScope: this.mapProductScope(productScopeResult.rows),
      templateStats: templateStatsResult.rows.map((row) =>
        this.mapTemplateStats(row),
      ),
    };
  }

  private mapProductScope(rows: ProductScopeRow[]): TemplateProductScope {
    const stageCounts = this.createStageCounter();
    const blockedCounts = this.createStageCounter();

    for (const row of rows) {
      const count = Number(row.product_count);
      stageCounts[row.stage] += count;

      if (
        [ProductStatus.BLOCKED, ProductStatus.REJECTED].includes(row.status)
      ) {
        blockedCounts[row.stage] += count;
      }
    }

    return {
      byStage: stageCounts,
      blockedByStage: blockedCounts,
      total: Object.values(stageCounts).reduce(
        (total, count) => total + count,
        0,
      ),
    };
  }

  private mapTemplateStats(row: TemplateStatsRow): TemplateRecordStats {
    return {
      latestUpdated: row.latest_updated,
      recordCount: Number(row.record_count),
      templateId: row.template_id,
    };
  }

  private createStageCounter(): Record<ProductStage, number> {
    return {
      [ProductStage.STAGE_1]: 0,
      [ProductStage.STAGE_2]: 0,
      [ProductStage.STAGE_3]: 0,
      [ProductStage.STAGE_4]: 0,
      [ProductStage.STAGE_5]: 0,
      [ProductStage.STAGE_6]: 0,
    };
  }
}
