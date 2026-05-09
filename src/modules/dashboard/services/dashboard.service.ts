import { Injectable } from '@nestjs/common';

import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductStatus } from '../../../enums/product-status.enum';
import type { AuthenticatedUser } from '../../../types/authenticated-user.type';
import { DashboardRepository } from '../repositories/dashboard.repository';
import type {
  DashboardData,
  DashboardGateReview,
  DashboardPortfolioMix,
  DashboardProductCard,
  DashboardProductHealth,
  DashboardProductRecord,
  DashboardProductStage,
  DashboardStageHealth,
  DashboardStageStatusCount,
  DashboardSummary,
} from '../types/dashboard.type';

const STAGE_DEFINITIONS: Array<{
  department: string;
  description: string;
  stage: ProductStage;
  title: string;
}> = [
  {
    department: 'Product',
    description: 'T1-T3, ART score, market proof',
    stage: ProductStage.STAGE_1,
    title: 'Spot & Screen',
  },
  {
    department: 'Finance',
    description: 'Supplier matrix and business case',
    stage: ProductStage.STAGE_2,
    title: 'Feasibility',
  },
  {
    department: 'Commercial',
    description: 'Channel, pricing, GTM',
    stage: ProductStage.STAGE_3,
    title: 'Launch Readiness',
  },
  {
    department: 'Marketing',
    description: 'Listing, sell-in, feedback, Day 30',
    stage: ProductStage.STAGE_4,
    title: 'Launch Execution',
  },
  {
    department: 'Portfolio',
    description: '90-day scorecard and classification',
    stage: ProductStage.STAGE_5,
    title: 'Portfolio Review',
  },
  {
    department: 'Operations',
    description: 'Execution plan and clearance tracker',
    stage: ProductStage.STAGE_6,
    title: 'EOL / Clearance',
  },
];

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getDashboard(actor: AuthenticatedUser): Promise<DashboardData> {
    const result = await this.dashboardRepository.getDashboard({
      actorId: actor.id,
      actorRole: actor.role,
    });
    const products = result.products.map((product) =>
      this.mapProductCard(product, actor.id),
    );
    const gateReviews = products
      .filter(
        (product) => product.health === 'ready' || product.health === 'blocked',
      )
      .map((product) => this.mapGateReview(product));

    return {
      gateReviews,
      portfolioMix: this.buildPortfolioMix(products),
      products,
      stageHealth: this.buildStageHealth(result.stageStatusCounts),
      summary: this.buildSummary(products, gateReviews, result.products),
    };
  }

  private mapProductCard(
    product: DashboardProductRecord,
    actorId: string,
  ): DashboardProductCard {
    const progress = this.getStageProgress(product.stage, product.status);
    const health = this.getHealth(product.status, progress);
    const stage = this.formatStage(product.stage);
    const statusTag = this.formatStatus(product.status);

    return {
      blockers: this.getBlockers(product.status),
      department: this.getDepartment(product.stage),
      due: this.getDue(product.status, product.updatedAt),
      health,
      id: product.id,
      myWork:
        product.status === ProductStatus.IN_REVIEW ||
        product.status === ProductStatus.BLOCKED ||
        product.ownerUserId === actorId,
      name: product.workingName,
      owner: product.ownerName ?? product.productCode ?? 'Product owner',
      progress,
      stage,
      summary: this.getNextAction(product.stage, product.status),
      tags: [stage, statusTag],
    };
  }

  private mapGateReview(product: DashboardProductCard): DashboardGateReview {
    return {
      due: product.health === 'ready' ? 'Ready' : product.due,
      gate: product.stage.replace('Stage ', 'Gate '),
      id: `gate-review-${product.id}`,
      note: product.blockers[0] ?? product.summary,
      owner: product.owner,
      productName: product.name,
      state:
        product.health === 'ready'
          ? 'ready'
          : product.health === 'blocked'
            ? 'risk'
            : 'waiting',
    };
  }

  private buildStageHealth(
    stageStatusCounts: DashboardStageStatusCount[],
  ): DashboardStageHealth[] {
    return STAGE_DEFINITIONS.map(({ description, stage, title }) => {
      const stageCounts = stageStatusCounts.filter(
        (item) => item.stage === stage,
      );
      const count = stageCounts.reduce((total, item) => total + item.count, 0);
      const weightedProgress = stageCounts.reduce(
        (total, item) =>
          total + this.getStageProgress(item.stage, item.status) * item.count,
        0,
      );
      const completion = count ? Math.round(weightedProgress / count) : 0;

      return {
        completion,
        count,
        description,
        stage: this.formatStage(stage),
        status:
          completion >= 80 ? 'complete' : completion > 0 ? 'active' : 'queued',
        title,
      };
    });
  }

  private buildPortfolioMix(
    products: DashboardProductCard[],
  ): DashboardPortfolioMix {
    if (products.length === 0) {
      return {
        aClass: 0,
        bClass: 0,
        cClass: 0,
      };
    }

    const counts = products.reduce(
      (total, product) => {
        if (product.progress >= 80) total.aClass += 1;
        else if (product.progress >= 55) total.bClass += 1;
        else total.cClass += 1;

        return total;
      },
      { aClass: 0, bClass: 0, cClass: 0 },
    );

    return {
      aClass: Math.round((counts.aClass / products.length) * 100),
      bClass: Math.round((counts.bClass / products.length) * 100),
      cClass: Math.max(
        0,
        100 -
          Math.round((counts.aClass / products.length) * 100) -
          Math.round((counts.bClass / products.length) * 100),
      ),
    };
  }

  private buildSummary(
    products: DashboardProductCard[],
    gateReviews: DashboardGateReview[],
    sourceProducts: DashboardProductRecord[],
  ): DashboardSummary {
    return {
      activeProducts: products.length,
      averageCycleDays: this.getAverageCycleDays(sourceProducts),
      blockedActions: products.reduce(
        (total, product) => total + product.blockers.length,
        0,
      ),
      gateQueue: gateReviews.length,
      readyForGate: products.filter((product) => product.health === 'ready')
        .length,
    };
  }

  private getAverageCycleDays(products: DashboardProductRecord[]): number {
    if (products.length === 0) return 0;

    const cycleDays = products.map((product) => {
      const durationMs =
        product.updatedAt.getTime() - product.createdAt.getTime();

      return Math.max(1, Math.round(durationMs / 86_400_000));
    });

    return Math.round(
      cycleDays.reduce((total, days) => total + days, 0) / cycleDays.length,
    );
  }

  private getHealth(
    status: ProductStatus,
    progress: number,
  ): DashboardProductHealth {
    if (status === ProductStatus.BLOCKED || status === ProductStatus.REJECTED) {
      return 'blocked';
    }

    if (progress >= 80) return 'ready';
    if (progress >= 55) return 'watch';

    return 'progress';
  }

  private getStageProgress(stage: ProductStage, status: ProductStatus): number {
    if ([ProductStatus.ARCHIVED, ProductStatus.KILLED].includes(status)) {
      return 100;
    }

    const stageNumber = Number(stage.replace('STAGE_', ''));
    const baseProgress = Math.round(((stageNumber - 1) / 6) * 100);

    if (status === ProductStatus.APPROVED)
      return Math.min(100, baseProgress + 18);
    if (status === ProductStatus.IN_REVIEW)
      return Math.min(100, baseProgress + 12);
    if ([ProductStatus.BLOCKED, ProductStatus.REJECTED].includes(status)) {
      return Math.min(100, baseProgress + 8);
    }

    return Math.min(100, baseProgress + 5);
  }

  private getBlockers(status: ProductStatus): string[] {
    switch (status) {
      case ProductStatus.BLOCKED:
        return ['Workflow is blocked pending owner action'];
      case ProductStatus.REJECTED:
        return ['Rework required before the next gate'];
      case ProductStatus.KILLED:
        return ['Product has been killed by gate decision'];
      case ProductStatus.ARCHIVED:
        return ['Product is archived'];
      default:
        return [];
    }
  }

  private getNextAction(stage: ProductStage, status: ProductStatus): string {
    if (status === ProductStatus.BLOCKED) return 'Resolve blocker';
    if (status === ProductStatus.REJECTED) return 'Complete rework';
    if (status === ProductStatus.APPROVED) return 'Continue next stage';
    if ([ProductStatus.ARCHIVED, ProductStatus.KILLED].includes(status)) {
      return 'Review lifecycle record';
    }

    const stageNumber = Number(stage.replace('STAGE_', ''));

    return `Prepare Gate ${stageNumber}`;
  }

  private getDue(status: ProductStatus, updatedAt: Date): string {
    if (status === ProductStatus.BLOCKED) return 'Blocked';
    if (status === ProductStatus.IN_REVIEW) return 'In review';

    return updatedAt.toISOString().slice(0, 10);
  }

  private formatStage(stage: ProductStage): DashboardProductStage {
    return `Stage ${stage.replace('STAGE_', '')}` as DashboardProductStage;
  }

  private formatStatus(status: ProductStatus): string {
    return status
      .toLowerCase()
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private getDepartment(stage: ProductStage): string {
    return (
      STAGE_DEFINITIONS.find((definition) => definition.stage === stage)
        ?.department ?? 'Product'
    );
  }
}
