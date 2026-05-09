import { ProductStage } from '../../../enums/product-stage.enum';
import type { TemplateCatalogDefinition } from '../types/template-library.type';

export const TEMPLATE_STAGE_DEFINITIONS: Array<{
  label: string;
  stage: ProductStage;
}> = [
  { label: 'Stage 1 - Register / Spot & Screen', stage: ProductStage.STAGE_1 },
  {
    label: 'Stage 2 - Feasibility / Business Case',
    stage: ProductStage.STAGE_2,
  },
  { label: 'Stage 3 - Launch Readiness', stage: ProductStage.STAGE_3 },
  { label: 'Stage 4 - Launch Execution', stage: ProductStage.STAGE_4 },
  { label: 'Stage 5 - Portfolio Review', stage: ProductStage.STAGE_5 },
  { label: 'Stage 6 - EOL / Clearance', stage: ProductStage.STAGE_6 },
];

export const TEMPLATE_CATALOG: TemplateCatalogDefinition[] = [
  {
    description:
      'Capture the product opportunity, ART score, customer problem, and evidence for Gate 1.',
    id: 'T1',
    ownerRole: 'Product',
    requiredForGate: 'Gate 1',
    stage: ProductStage.STAGE_1,
    title: 'Opportunity Brief',
  },
  {
    description:
      'Size the target market, category growth, channel assumptions, and demand signals.',
    id: 'T2',
    ownerRole: 'Product',
    requiredForGate: 'Gate 1',
    stage: ProductStage.STAGE_1,
    title: 'Market Sizing',
  },
  {
    description:
      'Compare competitor pricing, feature gaps, and differentiation for screening.',
    id: 'T3',
    ownerRole: 'Product',
    requiredForGate: 'Gate 1',
    stage: ProductStage.STAGE_1,
    title: 'Competitor Matrix',
  },
  {
    description:
      'Validate suppliers, QA status, MOQ, lead time, and sourcing risk for feasibility.',
    id: 'T4',
    ownerRole: 'Sourcing',
    requiredForGate: 'Gate 2',
    stage: ProductStage.STAGE_2,
    title: 'Supplier Evaluation',
  },
  {
    description:
      'Confirm forecast, RSP, launch investment, payback, and finance viability.',
    id: 'T5',
    ownerRole: 'Finance',
    requiredForGate: 'Gate 2',
    stage: ProductStage.STAGE_2,
    title: 'Business Case',
  },
  {
    description:
      'Confirm at least 3 launch channels, Shopee/Lazada readiness, and listing ownership.',
    id: 'T6',
    ownerRole: 'Marketing',
    requiredForGate: 'Gate 3',
    stage: ProductStage.STAGE_3,
    title: 'Channel Listing Plan',
  },
  {
    description:
      'Validate RSP by channel against GP floor and exception handling.',
    id: 'T7',
    ownerRole: 'Finance',
    requiredForGate: 'Gate 3',
    stage: ProductStage.STAGE_3,
    title: 'RSP by Channel',
  },
  {
    description:
      'Plan GTM budget, campaign calendar, launch claims, assets, and risks.',
    id: 'T8',
    ownerRole: 'Marketing',
    requiredForGate: 'Gate 3',
    stage: ProductStage.STAGE_3,
    title: 'GTM Plan',
  },
  {
    description:
      'Confirm launch date, stock, live listing URLs, and channel proof.',
    id: 'T9',
    ownerRole: 'Marketing',
    requiredForGate: 'Stage 4',
    stage: ProductStage.STAGE_4,
    title: 'Launch Confirmation',
  },
  {
    description:
      'Track account sell-in commitments, targets, actuals, and variance actions.',
    id: 'T10',
    ownerRole: 'SPDM',
    requiredForGate: 'Stage 4',
    stage: ProductStage.STAGE_4,
    title: 'Sell-in Report',
  },
  {
    description:
      'Capture weekly launch feedback, customer signals, GP, and open issues.',
    id: 'T11',
    ownerRole: 'After Sales',
    requiredForGate: 'Stage 4',
    stage: ProductStage.STAGE_4,
    title: 'Weekly Feedback Log',
  },
  {
    description:
      'Review 30-day sell-through, GP floor, launch learnings, and halt recommendation.',
    id: 'T12',
    ownerRole: 'Finance',
    requiredForGate: 'Stage 4',
    stage: ProductStage.STAGE_4,
    title: 'Day 30 Review',
  },
  {
    description:
      'Score 90-day performance, GP, complaints, customer rating, and portfolio class.',
    id: 'T13',
    ownerRole: 'Product',
    requiredForGate: 'Stage 5',
    stage: ProductStage.STAGE_5,
    title: 'Product Scorecard',
  },
  {
    description:
      'Summarize portfolio classification changes and COO review actions.',
    id: 'T14',
    ownerRole: 'Finance',
    requiredForGate: 'Stage 5',
    stage: ProductStage.STAGE_5,
    title: 'Portfolio Update',
  },
  {
    description:
      'Recommend revamp, EOL, or hold actions with GM and COO decision trace.',
    id: 'T15',
    ownerRole: 'Product',
    requiredForGate: 'Stage 5',
    stage: ProductStage.STAGE_5,
    title: 'Revamp / EOL Recommendation',
  },
  {
    description:
      'Plan approved EOL execution, stock positions, milestones, and service continuity.',
    id: 'T16',
    ownerRole: 'SPDM',
    requiredForGate: 'Stage 6',
    stage: ProductStage.STAGE_6,
    title: 'EOL Execution Plan',
  },
  {
    description:
      'Control clearance pricing, allocations, markdown approvals, and weekly sell-down.',
    id: 'T17',
    ownerRole: 'Finance',
    requiredForGate: 'Stage 6',
    stage: ProductStage.STAGE_6,
    title: 'Clearance Plan',
  },
];
