import type { GpFloorRule, WorkflowRule } from '../types/rules-dashboard.type';

export const GP_FLOOR_RULES: GpFloorRule[] = [
  {
    channel: 'MTO',
    floorPercent: 25,
    ownerRole: 'Finance Manager',
    stage: 'Stage 3 - T7',
    status: 'ACTIVE',
  },
  {
    channel: 'ITO Retailers',
    floorPercent: 22,
    ownerRole: 'Finance Manager',
    stage: 'Stage 3 - T7',
    status: 'ACTIVE',
  },
  {
    channel: 'ITO Wholesale',
    floorPercent: 20,
    ownerRole: 'Finance Manager',
    stage: 'Stage 3 - T7',
    status: 'ACTIVE',
  },
  {
    channel: 'MM',
    floorPercent: 28,
    ownerRole: 'Finance Manager',
    stage: 'Stage 3 - T7',
    status: 'ACTIVE',
  },
  {
    channel: 'Projects',
    floorPercent: 18,
    ownerRole: 'Finance Manager',
    stage: 'Stage 3 - T7',
    status: 'ACTIVE',
  },
  {
    channel: 'CS',
    floorPercent: 30,
    ownerRole: 'Finance Manager',
    stage: 'Stage 3 - T7',
    status: 'ACTIVE',
  },
  {
    channel: 'Export / KME',
    floorPercent: 20,
    ownerRole: 'Finance Manager',
    stage: 'Stage 3 - T7',
    status: 'ACTIVE',
  },
  {
    channel: 'Clearance markdown',
    floorPercent: 30,
    ownerRole: 'COO Executive Approver',
    stage: 'Stage 6 - T17',
    status: 'NEEDS_REVIEW',
  },
];

export const WORKFLOW_RULES: WorkflowRule[] = [
  {
    category: 'STAGE_TRANSITION',
    condition: 'T1, T2, and T3 records must exist before Gate 1 submission.',
    description:
      'Product Manager completes opportunity, market sizing, competitor evidence, and ART scoring before review.',
    id: 'backend-policy-gate-1-required-templates',
    lastChangedAt: 'Backend policy',
    ownerRole: 'Head of Product',
    outcome: 'Gate 1 can be submitted for Head of Product review.',
    severity: 'HIGH',
    stage: 'Stage 1',
    status: 'ACTIVE',
    title: 'Gate 1 required templates',
  },
  {
    category: 'STAGE_TRANSITION',
    condition:
      'Template 1 ART score uses normalized 12/18 while stakeholders confirm the source threshold.',
    description:
      'The source template says max 18 and Min 6/9 to proceed; backend policy normalizes but keeps the ambiguity visible.',
    id: 'backend-policy-art-threshold-review',
    lastChangedAt: 'Backend policy',
    ownerRole: 'Head of Product',
    outcome:
      'Gate 1 scoring remains explicit instead of hidden in frontend copy.',
    severity: 'MEDIUM',
    stage: 'Stage 1',
    status: 'NEEDS_REVIEW',
    title: 'ART score threshold',
  },
  {
    category: 'STAGE_TRANSITION',
    condition:
      'T4 supplier evaluation and T5 business case must exist before Gate 2 submission.',
    description:
      'Supplier and finance evidence is required before QA, Finance, GM, or COO can make Gate 2 decisions.',
    id: 'backend-policy-gate-2-required-templates',
    lastChangedAt: 'Backend policy',
    ownerRole: 'Finance Manager',
    outcome: 'Gate 2 can be submitted for feasibility review.',
    severity: 'HIGH',
    stage: 'Stage 2',
    status: 'ACTIVE',
    title: 'Gate 2 feasibility evidence',
  },
  {
    category: 'STAGE_TRANSITION',
    condition:
      'T4 Supplier Evaluation requires at least two qualified suppliers.',
    description:
      'Gate 2 cannot proceed when sourcing has fewer than two qualified suppliers available for comparison.',
    id: 'backend-policy-gate-2-supplier-minimum',
    lastChangedAt: 'Backend policy',
    ownerRole: 'Sourcing Manager',
    outcome: 'Block Gate 2 until supplier minimum is met.',
    severity: 'HIGH',
    stage: 'Stage 2',
    status: 'ACTIVE',
    title: 'Gate 2 supplier minimum',
  },
  {
    category: 'STAGE_TRANSITION',
    condition:
      'T6 Channel Listing Plan requires at least three confirmed launch channels.',
    description:
      'Stage 3 launch readiness expects confirmed channels plus Shopee and Lazada e-commerce readiness.',
    id: 'backend-policy-gate-3-channel-readiness',
    lastChangedAt: 'Backend policy',
    ownerRole: 'GM Commercial Owner',
    outcome:
      'Gate 3 launch approval can proceed when channel readiness is complete.',
    severity: 'HIGH',
    stage: 'Stage 3',
    status: 'ACTIVE',
    title: 'Gate 3 channel readiness',
  },
  {
    category: 'GP_FLOOR',
    condition:
      'T7 projected GP should stay at or above the configured channel floor.',
    description:
      'Finance must resolve below-floor channels or document exceptions before launch approval.',
    id: 'backend-policy-stage-3-gp-floor',
    lastChangedAt: 'Backend policy',
    ownerRole: 'Finance Manager',
    outcome: 'Below-floor channels surface as finance exceptions.',
    severity: 'HIGH',
    stage: 'Stage 3',
    status: 'ACTIVE',
    title: 'Stage 3 GP floor',
  },
  {
    category: 'ESCALATION',
    condition: 'Day 30 verdict or GP failure triggers executive attention.',
    description:
      'Stage 4 launch execution highlights halted or escalated Day 30 outcomes.',
    id: 'backend-policy-day-30-escalation',
    lastChangedAt: 'Backend policy',
    ownerRole: 'COO Executive Approver',
    outcome: 'COO/GM escalation is visible in the workspace.',
    severity: 'HIGH',
    stage: 'Stage 4',
    status: 'ACTIVE',
    title: 'Day 30 escalation',
  },
  {
    category: 'ESCALATION',
    condition:
      'C-class or underperforming products require revamp or EOL recommendation.',
    description:
      'Stage 5 portfolio review must not hide lifecycle action risk.',
    id: 'backend-policy-portfolio-escalation',
    lastChangedAt: 'Backend policy',
    ownerRole: 'GM Commercial Owner',
    outcome: 'Revamp/EOL decision is prepared.',
    severity: 'MEDIUM',
    stage: 'Stage 5',
    status: 'ACTIVE',
    title: 'Portfolio escalation',
  },
  {
    category: 'STAGE_TRANSITION',
    condition: 'Stage 6 requires an approved EOL recommendation from T15.',
    description:
      'EOL execution and clearance planning depend on approved lifecycle decisioning.',
    id: 'backend-policy-eol-dependency',
    lastChangedAt: 'Backend policy',
    ownerRole: 'COO Executive Approver',
    outcome: 'EOL execution and clearance can proceed.',
    severity: 'HIGH',
    stage: 'Stage 6',
    status: 'ACTIVE',
    title: 'Approved EOL dependency',
  },
  {
    category: 'APPROVAL_AUTHORITY',
    condition:
      'Frontend route access is UX only; backend policies guard each protected endpoint.',
    description:
      'The backend remains authoritative for role, assignment, admin support override, and workflow permissions.',
    id: 'backend-policy-authoritative-rbac',
    lastChangedAt: 'Backend policy',
    ownerRole: 'Admin',
    outcome: 'Unauthorized users receive backend policy errors.',
    severity: 'HIGH',
    stage: 'All stages',
    status: 'ACTIVE',
    title: 'Backend-authoritative RBAC',
  },
];
