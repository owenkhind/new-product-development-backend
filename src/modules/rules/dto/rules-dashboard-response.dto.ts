import type {
  GpFloorRule,
  RuleMetric,
  RulesDashboard,
  RuleSeverity,
  RuleStatus,
  WorkflowRule,
  RuleCategory,
} from '../types/rules-dashboard.type';

export class WorkflowRuleResponseDto {
  category!: RuleCategory;
  condition!: string;
  description!: string;
  id!: string;
  lastChangedAt!: string;
  ownerRole!: string;
  outcome!: string;
  severity!: RuleSeverity;
  stage!: string;
  status!: RuleStatus;
  title!: string;

  static fromRecord(record: WorkflowRule): WorkflowRuleResponseDto {
    return {
      category: record.category,
      condition: record.condition,
      description: record.description,
      id: record.id,
      lastChangedAt: record.lastChangedAt,
      ownerRole: record.ownerRole,
      outcome: record.outcome,
      severity: record.severity,
      stage: record.stage,
      status: record.status,
      title: record.title,
    };
  }
}

export class RuleMetricResponseDto {
  label!: string;
  tone!: string;
  value!: number;

  static fromRecord(record: RuleMetric): RuleMetricResponseDto {
    return {
      label: record.label,
      tone: record.tone,
      value: record.value,
    };
  }
}

export class GpFloorRuleResponseDto {
  channel!: string;
  floorPercent!: number;
  ownerRole!: string;
  stage!: string;
  status!: RuleStatus;

  static fromRecord(record: GpFloorRule): GpFloorRuleResponseDto {
    return {
      channel: record.channel,
      floorPercent: record.floorPercent,
      ownerRole: record.ownerRole,
      stage: record.stage,
      status: record.status,
    };
  }
}

export class RulesDashboardResponseDto {
  gpFloors!: GpFloorRuleResponseDto[];
  metrics!: RuleMetricResponseDto[];
  rules!: WorkflowRuleResponseDto[];

  static fromRecord(record: RulesDashboard): RulesDashboardResponseDto {
    return {
      gpFloors: record.gpFloors.map((floor) =>
        GpFloorRuleResponseDto.fromRecord(floor),
      ),
      metrics: record.metrics.map((metric) =>
        RuleMetricResponseDto.fromRecord(metric),
      ),
      rules: record.rules.map((rule) =>
        WorkflowRuleResponseDto.fromRecord(rule),
      ),
    };
  }
}
