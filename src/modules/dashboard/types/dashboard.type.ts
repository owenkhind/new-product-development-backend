import type { ProductCategory } from '../../../enums/product-category.enum';
import type { ProductStage } from '../../../enums/product-stage.enum';
import type { ProductStatus } from '../../../enums/product-status.enum';

export type DashboardProductRecord = {
  category: ProductCategory;
  createdAt: Date;
  id: string;
  ownerName: string | null;
  ownerUserId: string;
  productCode: string | null;
  stage: ProductStage;
  status: ProductStatus;
  updatedAt: Date;
  workingName: string;
};

export type DashboardStageStatusCount = {
  count: number;
  stage: ProductStage;
  status: ProductStatus;
};

export type DashboardRepositoryResult = {
  products: DashboardProductRecord[];
  stageStatusCounts: DashboardStageStatusCount[];
};

export type DashboardProductHealth = 'blocked' | 'progress' | 'ready' | 'watch';
export type DashboardProductStage =
  | 'Stage 1'
  | 'Stage 2'
  | 'Stage 3'
  | 'Stage 4'
  | 'Stage 5'
  | 'Stage 6';

export type DashboardProductCard = {
  blockers: string[];
  department: string;
  due: string;
  health: DashboardProductHealth;
  id: string;
  myWork: boolean;
  name: string;
  owner: string;
  progress: number;
  stage: DashboardProductStage;
  summary: string;
  tags: string[];
};

export type DashboardGateReview = {
  due: string;
  gate: string;
  id: string;
  note: string;
  owner: string;
  productName: string;
  state: 'ready' | 'risk' | 'waiting';
};

export type DashboardStageHealth = {
  completion: number;
  count: number;
  description: string;
  stage: DashboardProductStage;
  status: 'active' | 'complete' | 'queued';
  title: string;
};

export type DashboardPortfolioMix = {
  aClass: number;
  bClass: number;
  cClass: number;
};

export type DashboardSummary = {
  activeProducts: number;
  averageCycleDays: number;
  blockedActions: number;
  gateQueue: number;
  readyForGate: number;
};

export type DashboardData = {
  gateReviews: DashboardGateReview[];
  portfolioMix: DashboardPortfolioMix;
  products: DashboardProductCard[];
  stageHealth: DashboardStageHealth[];
  summary: DashboardSummary;
};
