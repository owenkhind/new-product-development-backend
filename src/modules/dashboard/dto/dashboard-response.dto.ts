import type {
  DashboardData,
  DashboardGateReview,
  DashboardPortfolioMix,
  DashboardProductCard,
  DashboardProductHealth,
  DashboardProductStage,
  DashboardStageHealth,
  DashboardSummary,
} from '../types/dashboard.type';

export class DashboardProductCardResponseDto {
  blockers!: string[];
  department!: string;
  due!: string;
  health!: DashboardProductHealth;
  id!: string;
  myWork!: boolean;
  name!: string;
  owner!: string;
  progress!: number;
  stage!: DashboardProductStage;
  summary!: string;
  tags!: string[];

  static fromRecord(
    record: DashboardProductCard,
  ): DashboardProductCardResponseDto {
    return {
      blockers: record.blockers,
      department: record.department,
      due: record.due,
      health: record.health,
      id: record.id,
      myWork: record.myWork,
      name: record.name,
      owner: record.owner,
      progress: record.progress,
      stage: record.stage,
      summary: record.summary,
      tags: record.tags,
    };
  }
}

export class DashboardGateReviewResponseDto {
  due!: string;
  gate!: string;
  id!: string;
  note!: string;
  owner!: string;
  productName!: string;
  state!: 'ready' | 'risk' | 'waiting';

  static fromRecord(
    record: DashboardGateReview,
  ): DashboardGateReviewResponseDto {
    return {
      due: record.due,
      gate: record.gate,
      id: record.id,
      note: record.note,
      owner: record.owner,
      productName: record.productName,
      state: record.state,
    };
  }
}

export class DashboardStageHealthResponseDto {
  completion!: number;
  count!: number;
  description!: string;
  stage!: DashboardProductStage;
  status!: 'active' | 'complete' | 'queued';
  title!: string;

  static fromRecord(
    record: DashboardStageHealth,
  ): DashboardStageHealthResponseDto {
    return {
      completion: record.completion,
      count: record.count,
      description: record.description,
      stage: record.stage,
      status: record.status,
      title: record.title,
    };
  }
}

export class DashboardPortfolioMixResponseDto {
  aClass!: number;
  bClass!: number;
  cClass!: number;

  static fromRecord(
    record: DashboardPortfolioMix,
  ): DashboardPortfolioMixResponseDto {
    return {
      aClass: record.aClass,
      bClass: record.bClass,
      cClass: record.cClass,
    };
  }
}

export class DashboardSummaryResponseDto {
  activeProducts!: number;
  averageCycleDays!: number;
  blockedActions!: number;
  gateQueue!: number;
  readyForGate!: number;

  static fromRecord(record: DashboardSummary): DashboardSummaryResponseDto {
    return {
      activeProducts: record.activeProducts,
      averageCycleDays: record.averageCycleDays,
      blockedActions: record.blockedActions,
      gateQueue: record.gateQueue,
      readyForGate: record.readyForGate,
    };
  }
}

export class DashboardResponseDto {
  gateReviews!: DashboardGateReviewResponseDto[];
  portfolioMix!: DashboardPortfolioMixResponseDto;
  products!: DashboardProductCardResponseDto[];
  stageHealth!: DashboardStageHealthResponseDto[];
  summary!: DashboardSummaryResponseDto;

  static fromRecord(record: DashboardData): DashboardResponseDto {
    return {
      gateReviews: record.gateReviews.map((review) =>
        DashboardGateReviewResponseDto.fromRecord(review),
      ),
      portfolioMix: DashboardPortfolioMixResponseDto.fromRecord(
        record.portfolioMix,
      ),
      products: record.products.map((product) =>
        DashboardProductCardResponseDto.fromRecord(product),
      ),
      stageHealth: record.stageHealth.map((stage) =>
        DashboardStageHealthResponseDto.fromRecord(stage),
      ),
      summary: DashboardSummaryResponseDto.fromRecord(record.summary),
    };
  }
}
