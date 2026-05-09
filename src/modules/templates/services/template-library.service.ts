import { Injectable } from '@nestjs/common';

import { ProductStage } from '../../../enums/product-stage.enum';
import {
  TEMPLATE_CATALOG,
  TEMPLATE_STAGE_DEFINITIONS,
} from '../constants/template-catalog.constants';
import { TemplateLibraryRepository } from '../repositories/template-library.repository';
import type {
  LifecycleTemplate,
  TemplateLibraryDashboard,
  TemplateProductScope,
  TemplateRecordStats,
  TemplateStatus,
} from '../types/template-library.type';

const STAGE_ORDER: ProductStage[] = [
  ProductStage.STAGE_1,
  ProductStage.STAGE_2,
  ProductStage.STAGE_3,
  ProductStage.STAGE_4,
  ProductStage.STAGE_5,
  ProductStage.STAGE_6,
];

@Injectable()
export class TemplateLibraryService {
  constructor(
    private readonly templateLibraryRepository: TemplateLibraryRepository,
  ) {}

  async getDashboard(): Promise<TemplateLibraryDashboard> {
    const stats = await this.templateLibraryRepository.getLibraryStats();
    const statsByTemplateId = new Map(
      stats.templateStats.map((templateStats) => [
        templateStats.templateId,
        templateStats,
      ]),
    );
    const templates = TEMPLATE_CATALOG.map((template) =>
      this.buildTemplate(template.id, statsByTemplateId, stats.productScope),
    );

    return {
      metrics: [
        {
          label: 'Lifecycle templates',
          tone: 'blue',
          value: templates.length,
        },
        {
          label: 'Submitted or approved',
          tone: 'green',
          value: templates.filter((template) =>
            ['APPROVED', 'SUBMITTED'].includes(template.status),
          ).length,
        },
        {
          label: 'Blocked templates',
          tone: 'red',
          value: templates.filter((template) => template.status === 'BLOCKED')
            .length,
        },
        {
          label: 'Average completion',
          tone: 'cyan',
          value: this.average(
            templates.map((template) => template.completionPercent),
          ),
        },
      ],
      stageSummaries: TEMPLATE_STAGE_DEFINITIONS.map(({ label, stage }) =>
        this.buildStageSummary(templates, stage, label),
      ),
      templates,
    };
  }

  private buildTemplate(
    templateId: string,
    statsByTemplateId: Map<string, TemplateRecordStats>,
    productScope: TemplateProductScope,
  ): LifecycleTemplate {
    const definition = TEMPLATE_CATALOG.find(
      (template) => template.id === templateId,
    );

    if (!definition) {
      throw new Error(
        `Template ${templateId} is not defined in the catalogue.`,
      );
    }

    const stats = statsByTemplateId.get(templateId);
    const eligibleProductCount = this.getEligibleProductCount(
      definition.stage,
      productScope,
    );
    const recordCount = stats?.recordCount ?? 0;
    const completionPercent = eligibleProductCount
      ? Math.min(100, Math.round((recordCount / eligibleProductCount) * 100))
      : 0;
    const stageBlockedCount = productScope.blockedByStage[definition.stage];
    const status = this.getTemplateStatus({
      completionPercent,
      recordCount,
      stageBlockedCount,
    });
    const blocker =
      status === 'BLOCKED'
        ? `${stageBlockedCount} product${stageBlockedCount === 1 ? '' : 's'} in ${definition.stage.replace(
            '_',
            ' ',
          )} need rework before this template set can be considered ready.`
        : undefined;

    return {
      ...definition,
      blocker,
      completionPercent,
      lastUpdated: this.formatLastUpdated(stats?.latestUpdated ?? null),
      status,
    };
  }

  private buildStageSummary(
    templates: LifecycleTemplate[],
    stage: ProductStage,
    label: string,
  ) {
    const stageTemplates = templates.filter(
      (template) => template.stage === stage,
    );

    return {
      blockedCount: stageTemplates.filter(
        (template) => template.status === 'BLOCKED',
      ).length,
      completionPercent: this.average(
        stageTemplates.map((template) => template.completionPercent),
      ),
      label,
      stage,
      templateCount: stageTemplates.length,
    };
  }

  private getTemplateStatus(input: {
    completionPercent: number;
    recordCount: number;
    stageBlockedCount: number;
  }): TemplateStatus {
    if (input.stageBlockedCount > 0 && input.completionPercent < 100) {
      return 'BLOCKED';
    }

    if (input.recordCount === 0) {
      return 'NOT_STARTED';
    }

    if (input.completionPercent >= 100) {
      return 'APPROVED';
    }

    if (input.completionPercent >= 75) {
      return 'IN_REVIEW';
    }

    return 'DRAFT';
  }

  private getEligibleProductCount(
    stage: ProductStage,
    productScope: TemplateProductScope,
  ): number {
    const minimumStageIndex = STAGE_ORDER.indexOf(stage);

    return STAGE_ORDER.slice(minimumStageIndex).reduce(
      (total, currentStage) => total + productScope.byStage[currentStage],
      0,
    );
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;

    return Math.round(
      values.reduce((total, value) => total + value, 0) / values.length,
    );
  }

  private formatLastUpdated(value: Date | null): string {
    if (!value) return 'No records yet';

    return value.toISOString().slice(0, 10);
  }
}
