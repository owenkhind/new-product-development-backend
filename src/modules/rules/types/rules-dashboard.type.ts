export type RuleCategory =
  | 'APPROVAL_AUTHORITY'
  | 'ESCALATION'
  | 'GP_FLOOR'
  | 'STAGE_TRANSITION';

export type RuleStatus = 'ACTIVE' | 'DRAFT' | 'NEEDS_REVIEW';

export type RuleSeverity = 'HIGH' | 'LOW' | 'MEDIUM';

export type WorkflowRule = {
  category: RuleCategory;
  condition: string;
  description: string;
  id: string;
  lastChangedAt: string;
  ownerRole: string;
  outcome: string;
  severity: RuleSeverity;
  stage: string;
  status: RuleStatus;
  title: string;
};

export type RuleMetric = {
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

export type GpFloorRule = {
  channel: string;
  floorPercent: number;
  ownerRole: string;
  stage: string;
  status: RuleStatus;
};

export type RulesDashboard = {
  gpFloors: GpFloorRule[];
  metrics: RuleMetric[];
  rules: WorkflowRule[];
};
