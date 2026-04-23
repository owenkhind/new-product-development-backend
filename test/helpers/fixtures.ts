import { AuditAction } from '../../src/enums/audit-action.enum';
import { AuditEntityType } from '../../src/enums/audit-entity-type.enum';
import { GateDecisionOutcome } from '../../src/enums/gate-decision-outcome.enum';
import { ProductBrand } from '../../src/enums/product-brand.enum';
import { ProductCategory } from '../../src/enums/product-category.enum';
import { ProductStage } from '../../src/enums/product-stage.enum';
import { ProductStatus } from '../../src/enums/product-status.enum';
import { UserRole } from '../../src/enums/user-role.enum';
import type { AuditLogRecord } from '../../src/modules/audit-logs/types/audit-log-record.type';
import type { BusinessCaseRecord } from '../../src/modules/business-cases/types/business-case-record.type';
import type { GateDecisionRecord } from '../../src/modules/gate-decisions/types/gate-decision-record.type';
import type { CompetitorMatrixRecord } from '../../src/modules/competitor-matrices/types/competitor-matrix-record.type';
import type { MarketSizingRecord } from '../../src/modules/market-sizing/types/market-sizing-record.type';
import type { OpportunityBriefRecord } from '../../src/modules/opportunity-briefs/types/opportunity-brief-record.type';
import type { ProductRecord } from '../../src/modules/products/types/product-record.type';
import type { SupplierEvaluationRecord } from '../../src/modules/supplier-evaluations/types/supplier-evaluation-record.type';
import type { UserRecord } from '../../src/modules/users/types/user-record.type';
import type { GateTwoReviewRecord } from '../../src/modules/workflow/types/gate-two-review-record.type';

export const testIds = {
  actingAsUser: '00000000-0000-4000-8000-000000000012',
  admin: '00000000-0000-4000-8000-000000000001',
  auditLog: '00000000-0000-4000-8000-000000000010',
  clusterManager: '00000000-0000-4000-8000-000000000006',
  commercialOwner: '00000000-0000-4000-8000-000000000003',
  cooApprover: '00000000-0000-4000-8000-000000000019',
  financeOwner: '00000000-0000-4000-8000-000000000004',
  gateDecision: '00000000-0000-4000-8000-000000000009',
  gateTwoReview: '00000000-0000-4000-8000-000000000020',
  headOfProduct: '00000000-0000-4000-8000-000000000002',
  marketingOwner: '00000000-0000-4000-8000-000000000005',
  product: '00000000-0000-4000-8000-000000000008',
  productOwner: '00000000-0000-4000-8000-000000000007',
  qaReviewer: '00000000-0000-4000-8000-000000000021',
  sourcingManager: '00000000-0000-4000-8000-000000000022',
};

export function createUserRecord(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    createdAt: new Date('2026-04-15T00:00:00.000Z'),
    email: 'owner@example.com',
    fullName: 'Owner User',
    id: testIds.productOwner,
    isActive: true,
    lastLoginAt: null,
    role: UserRole.PRODUCT_MANAGER,
    updatedAt: new Date('2026-04-15T00:00:00.000Z'),
    ...overrides,
  };
}

export function createProductRecord(overrides: Partial<ProductRecord> = {}): ProductRecord {
  return {
    brand: ProductBrand.KHIND,
    category: ProductCategory.FANS,
    clusterOwnerUserIds: [testIds.clusterManager],
    commercialOwnerUserId: testIds.commercialOwner,
    createdAt: new Date('2026-04-20T00:00:00.000Z'),
    currentStage: ProductStage.STAGE_1,
    description: 'Initial product draft',
    financeOwnerUserId: testIds.financeOwner,
    id: testIds.product,
    marketingOwnerUserId: testIds.marketingOwner,
    productCode: 'KPD-001',
    productOwnerUserId: testIds.productOwner,
    status: ProductStatus.DRAFT,
    updatedAt: new Date('2026-04-20T00:00:00.000Z'),
    workingName: 'Desk Fan Revamp',
    ...overrides,
  };
}

export function createGateDecisionRecord(
  overrides: Partial<GateDecisionRecord> = {},
): GateDecisionRecord {
  return {
    actingAsUserId: null,
    actorUserId: testIds.headOfProduct,
    comment: 'Approved for feasibility.',
    createdAt: new Date('2026-04-22T00:00:00.000Z'),
    gateStage: ProductStage.STAGE_1,
    id: testIds.gateDecision,
    isAdminSupportAction: false,
    outcome: GateDecisionOutcome.APPROVED,
    overrideReason: null,
    productId: testIds.product,
    ...overrides,
  };
}

export function createAuditLogRecord(overrides: Partial<AuditLogRecord> = {}): AuditLogRecord {
  return {
    actingAsUserId: null,
    action: AuditAction.SUBMIT,
    actorUserId: testIds.productOwner,
    createdAt: new Date('2026-04-22T00:00:00.000Z'),
    entityId: testIds.product,
    entityType: AuditEntityType.PRODUCT,
    fromState: {
      currentStage: ProductStage.STAGE_1,
      status: ProductStatus.DRAFT,
    },
    id: testIds.auditLog,
    metadata: {
      comment: 'Ready for Gate 1',
    },
    productId: testIds.product,
    toState: {
      currentStage: ProductStage.STAGE_1,
      status: ProductStatus.IN_REVIEW,
    },
    ...overrides,
  };
}

export function createSupplierEvaluationRecord(
  overrides: Partial<SupplierEvaluationRecord> = {},
): SupplierEvaluationRecord {
  return {
    createdAt: new Date('2026-04-23T00:00:00.000Z'),
    id: '00000000-0000-4000-8000-000000000023',
    productId: testIds.product,
    scoringMethodology: 'Weighted commercial and technical review',
    summary: 'Two suppliers can support the initial target launch window.',
    suppliers: [
      {
        factoryName: 'Factory A',
        id: '00000000-0000-4000-8000-000000000024',
        isQualified: true,
        leadTimeDays: 45,
        moq: 1000,
        originCountry: 'Malaysia',
        paymentTerms: '30% deposit, 70% on shipment',
        remarks: 'Strong tooling support.',
        sparePartsSupportNotes: 'Keeps fan motor spare stock.',
        supplierName: 'Supplier A',
        toolingNotes: 'Existing mould available.',
        weightedScore: '88.50',
      },
      {
        factoryName: 'Factory B',
        id: '00000000-0000-4000-8000-000000000025',
        isQualified: true,
        leadTimeDays: 55,
        moq: 1200,
        originCountry: 'Thailand',
        paymentTerms: 'LC at sight',
        remarks: 'Slightly longer lead time.',
        sparePartsSupportNotes: 'Quarterly spare parts replenishment.',
        supplierName: 'Supplier B',
        toolingNotes: 'Minor tooling refresh required.',
        weightedScore: '84.00',
      },
    ],
    updatedAt: new Date('2026-04-23T00:00:00.000Z'),
    ...overrides,
  };
}

export function createBusinessCaseRecord(
  overrides: Partial<BusinessCaseRecord> = {},
): BusinessCaseRecord {
  return {
    channelGpSummary: [
      {
        channelName: 'MTO',
        expectedGpPercent: '27.50',
        notes: 'Base direct channel assumption.',
      },
      {
        channelName: 'ITO Retailers',
        expectedGpPercent: '24.00',
        notes: 'Supported by launch price architecture.',
      },
    ],
    commercialNotes: 'Launch should prioritize premium urban retail.',
    createdAt: new Date('2026-04-23T00:00:00.000Z'),
    financeNotes: 'Initial tooling recovered inside year one plan.',
    id: '00000000-0000-4000-8000-000000000026',
    investmentNeeded: '450000.00',
    marketOpportunitySummary: 'Premium desk fan category continues to expand in e-commerce and specialty retail.',
    productId: testIds.product,
    productSummary: 'Compact premium desk fan with quieter motor and upgraded finish.',
    recommendation: 'Proceed to development',
    riskSummary: 'Primary risk is supplier lead time during initial launch window.',
    updatedAt: new Date('2026-04-23T00:00:00.000Z'),
    yearOneRevenue: '1800000.00',
    yearThreeRevenue: '2600000.00',
    yearTwoRevenue: '2200000.00',
    ...overrides,
  };
}

export function createGateTwoReviewRecord(
  overrides: Partial<GateTwoReviewRecord> = {},
): GateTwoReviewRecord {
  return {
    createdAt: new Date('2026-04-23T00:00:00.000Z'),
    financeComment: 'Margins validated.',
    financeConfirmedAt: new Date('2026-04-23T01:00:00.000Z'),
    financeConfirmedByUserId: testIds.financeOwner,
    gmApprovedAt: new Date('2026-04-23T02:00:00.000Z'),
    gmApprovedByUserId: testIds.commercialOwner,
    gmComment: 'Commercially viable.',
    productId: testIds.product,
    qaComment: 'Compliance path confirmed.',
    qaReviewCompletedAt: new Date('2026-04-23T00:30:00.000Z'),
    qaReviewedByUserId: testIds.qaReviewer,
    updatedAt: new Date('2026-04-23T02:00:00.000Z'),
    ...overrides,
  };
}

export function createOpportunityBriefRecord(
  overrides: Partial<OpportunityBriefRecord> = {},
): OpportunityBriefRecord {
  return {
    affordableCostScore: 1,
    affordablePriceScore: 2,
    affordableValueScore: 1,
    artTotalScore: 13,
    complianceNotes: 'Requires SIRIM confirmation before launch.',
    createdAt: new Date('2026-04-22T00:00:00.000Z'),
    id: '00000000-0000-4000-8000-000000000013',
    opportunitySource: 'Dealer feedback',
    problemStatement: 'Existing desk fan range lacks a compact premium option.',
    productId: testIds.product,
    reliableComplianceScore: 1,
    reliableDurabilityScore: 2,
    reliableServiceScore: 1,
    requiredDocumentsComplete: true,
    targetCustomer: 'Urban apartment owners',
    targetMarket: 'Malaysia premium desk fan',
    trendyCategoryScore: 1,
    trendyColourScore: 2,
    trendyDesignScore: 2,
    uniqueSellingPoints: ['Compact footprint', 'Premium grille finish'],
    updatedAt: new Date('2026-04-22T00:00:00.000Z'),
    ...overrides,
  };
}

export function createMarketSizingRecord(
  overrides: Partial<MarketSizingRecord> = {},
): MarketSizingRecord {
  return {
    annualMarketSizeUnits: 250000,
    annualMarketSizeValue: '35000000.00',
    assumptions: 'Assumes continued replacement cycle in urban channels.',
    categoryName: 'Premium Desk Fans',
    createdAt: new Date('2026-04-22T00:00:00.000Z'),
    dataSources: ['Nielsen retail panel', 'Shopee category scan'],
    id: '00000000-0000-4000-8000-000000000014',
    productId: testIds.product,
    targetPriceBand: 'RM149-RM199',
    targetSegment: 'Urban premium',
    updatedAt: new Date('2026-04-22T00:00:00.000Z'),
    yearOneSalesUnits: 12000,
    yearThreeSalesUnits: 18000,
    yearTwoSalesUnits: 15000,
    ...overrides,
  };
}

export function createCompetitorMatrixRecord(
  overrides: Partial<CompetitorMatrixRecord> = {},
): CompetitorMatrixRecord {
  return {
    createdAt: new Date('2026-04-22T00:00:00.000Z'),
    entries: [
      {
        brandName: 'Brand A',
        competitorName: 'Competitor A',
        designScore: 4,
        featureScore: 4,
        id: '00000000-0000-4000-8000-000000000015',
        modelName: 'A100',
        overallScore: 4,
        price: '159.00',
        strengths: ['Oscillation range'],
        valueScore: 3,
        weaknesses: ['No remote'],
      },
      {
        brandName: 'Brand B',
        competitorName: 'Competitor B',
        designScore: 3,
        featureScore: 4,
        id: '00000000-0000-4000-8000-000000000016',
        modelName: 'B200',
        overallScore: 4,
        price: '169.00',
        strengths: ['Quiet motor'],
        valueScore: 4,
        weaknesses: ['Plastic housing'],
      },
      {
        brandName: 'Brand C',
        competitorName: 'Competitor C',
        designScore: 5,
        featureScore: 3,
        id: '00000000-0000-4000-8000-000000000017',
        modelName: 'C300',
        overallScore: 4,
        price: '189.00',
        strengths: ['Metal finish'],
        valueScore: 3,
        weaknesses: ['Higher price'],
      },
    ],
    id: '00000000-0000-4000-8000-000000000018',
    productId: testIds.product,
    scoringMethodology: '5-point weighted commercial comparison',
    summary: 'The market is premiumizing around finish and low-noise positioning.',
    updatedAt: new Date('2026-04-22T00:00:00.000Z'),
    ...overrides,
  };
}
