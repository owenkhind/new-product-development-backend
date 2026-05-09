import type { ProductStage } from '../../../enums/product-stage.enum';
import type {
  LifecycleTemplate,
  TemplateLibraryDashboard,
  TemplateMetric,
  TemplateOwnerRole,
  TemplateStageSummary,
  TemplateStatus,
} from '../types/template-library.type';

export class TemplateMetricResponseDto {
  label!: string;
  tone!: string;
  value!: number;

  static fromRecord(record: TemplateMetric): TemplateMetricResponseDto {
    return {
      label: record.label,
      tone: record.tone,
      value: record.value,
    };
  }
}

export class TemplateStageSummaryResponseDto {
  blockedCount!: number;
  completionPercent!: number;
  label!: string;
  stage!: ProductStage;
  templateCount!: number;

  static fromRecord(
    record: TemplateStageSummary,
  ): TemplateStageSummaryResponseDto {
    return {
      blockedCount: record.blockedCount,
      completionPercent: record.completionPercent,
      label: record.label,
      stage: record.stage,
      templateCount: record.templateCount,
    };
  }
}

export class LifecycleTemplateResponseDto {
  blocker?: string;
  completionPercent!: number;
  description!: string;
  id!: string;
  lastUpdated!: string;
  ownerRole!: TemplateOwnerRole;
  requiredForGate!: string;
  stage!: ProductStage;
  status!: TemplateStatus;
  title!: string;

  static fromRecord(record: LifecycleTemplate): LifecycleTemplateResponseDto {
    return {
      blocker: record.blocker,
      completionPercent: record.completionPercent,
      description: record.description,
      id: record.id,
      lastUpdated: record.lastUpdated,
      ownerRole: record.ownerRole,
      requiredForGate: record.requiredForGate,
      stage: record.stage,
      status: record.status,
      title: record.title,
    };
  }
}

export class TemplateLibraryResponseDto {
  metrics!: TemplateMetricResponseDto[];
  stageSummaries!: TemplateStageSummaryResponseDto[];
  templates!: LifecycleTemplateResponseDto[];

  static fromRecord(
    record: TemplateLibraryDashboard,
  ): TemplateLibraryResponseDto {
    return {
      metrics: record.metrics.map((metric) =>
        TemplateMetricResponseDto.fromRecord(metric),
      ),
      stageSummaries: record.stageSummaries.map((summary) =>
        TemplateStageSummaryResponseDto.fromRecord(summary),
      ),
      templates: record.templates.map((template) =>
        LifecycleTemplateResponseDto.fromRecord(template),
      ),
    };
  }
}
