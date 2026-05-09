import type { ProductStage } from '../../../enums/product-stage.enum';

export type TemplateStatus =
  | 'APPROVED'
  | 'BLOCKED'
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'NOT_STARTED'
  | 'SUBMITTED';

export type TemplateOwnerRole =
  | 'After Sales'
  | 'Finance'
  | 'Marketing'
  | 'Product'
  | 'QA/TSD'
  | 'Sourcing'
  | 'SPDM';

export type TemplateCatalogDefinition = {
  description: string;
  id: string;
  ownerRole: TemplateOwnerRole;
  requiredForGate: string;
  stage: ProductStage;
  title: string;
};

export type TemplateMetric = {
  label: string;
  tone:
    | 'amber'
    | 'blue'
    | 'cyan'
    | 'green'
    | 'ink'
    | 'neutral'
    | 'purple'
    | 'red';
  value: number;
};

export type TemplateStageSummary = {
  blockedCount: number;
  completionPercent: number;
  label: string;
  stage: ProductStage;
  templateCount: number;
};

export type LifecycleTemplate = TemplateCatalogDefinition & {
  blocker?: string;
  completionPercent: number;
  lastUpdated: string;
  status: TemplateStatus;
};

export type TemplateLibraryDashboard = {
  metrics: TemplateMetric[];
  stageSummaries: TemplateStageSummary[];
  templates: LifecycleTemplate[];
};

export type TemplateProductScope = {
  byStage: Record<ProductStage, number>;
  blockedByStage: Record<ProductStage, number>;
  total: number;
};

export type TemplateRecordStats = {
  latestUpdated: Date | null;
  recordCount: number;
  templateId: string;
};

export type TemplateLibraryStats = {
  productScope: TemplateProductScope;
  templateStats: TemplateRecordStats[];
};
