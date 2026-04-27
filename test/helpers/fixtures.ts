import { AuditAction } from '../../src/enums/audit-action.enum';
import { AuditEntityType } from '../../src/enums/audit-entity-type.enum';
import { ChannelType } from '../../src/enums/channel-type.enum';
import { Day30PerformanceFlag } from '../../src/enums/day-30-performance-flag.enum';
import { Day30Verdict } from '../../src/enums/day-30-verdict.enum';
import { FeedbackSeverity } from '../../src/enums/feedback-severity.enum';
import { FeedbackSource } from '../../src/enums/feedback-source.enum';
import { GateDecisionOutcome } from '../../src/enums/gate-decision-outcome.enum';
import { GtmOwnerRole } from '../../src/enums/gtm-owner-role.enum';
import { LaunchIssueStatus } from '../../src/enums/launch-issue-status.enum';
import { ProductBrand } from '../../src/enums/product-brand.enum';
import { ProductCategory } from '../../src/enums/product-category.enum';
import { ProductStage } from '../../src/enums/product-stage.enum';
import { ProductStatus } from '../../src/enums/product-status.enum';
import { UserRole } from '../../src/enums/user-role.enum';
import type { AuditLogRecord } from '../../src/modules/audit-logs/types/audit-log-record.type';
import type { BusinessCaseRecord } from '../../src/modules/business-cases/types/business-case-record.type';
import type { ChannelListingPlanRecord } from '../../src/modules/channel-listing-plans/types/channel-listing-plan-record.type';
import type { ChannelPricingRecord } from '../../src/modules/channel-pricing/types/channel-pricing-record.type';
import type { Day30ReviewRecord } from '../../src/modules/day-30-reviews/types/day-30-review-record.type';
import type { GateDecisionRecord } from '../../src/modules/gate-decisions/types/gate-decision-record.type';
import type { GtmPlanRecord } from '../../src/modules/gtm-plans/types/gtm-plan-record.type';
import type { LaunchConfirmationRecord } from '../../src/modules/launch-confirmations/types/launch-confirmation-record.type';
import type { CompetitorMatrixRecord } from '../../src/modules/competitor-matrices/types/competitor-matrix-record.type';
import type { MarketSizingRecord } from '../../src/modules/market-sizing/types/market-sizing-record.type';
import type { OpportunityBriefRecord } from '../../src/modules/opportunity-briefs/types/opportunity-brief-record.type';
import type { ProductRecord } from '../../src/modules/products/types/product-record.type';
import type { SupplierEvaluationRecord } from '../../src/modules/supplier-evaluations/types/supplier-evaluation-record.type';
import type { SellInReportRecord } from '../../src/modules/sell-in-reports/types/sell-in-report-record.type';
import type { UserRecord } from '../../src/modules/users/types/user-record.type';
import type { WeeklyFeedbackLogRecord } from '../../src/modules/weekly-feedback-logs/types/weekly-feedback-log-record.type';
import type { GateTwoReviewRecord } from '../../src/modules/workflow/types/gate-two-review-record.type';
import type { GateThreeReviewRecord } from '../../src/modules/workflow/types/gate-three-review-record.type';

export const testIds = {
  actingAsUser: '00000000-0000-4000-8000-000000000012',
  admin: '00000000-0000-4000-8000-000000000001',
  auditLog: '00000000-0000-4000-8000-000000000010',
  clusterManager: '00000000-0000-4000-8000-000000000006',
  commercialOwner: '00000000-0000-4000-8000-000000000003',
  cooApprover: '00000000-0000-4000-8000-000000000019',
  financeOwner: '00000000-0000-4000-8000-000000000004',
  gateDecision: '00000000-0000-4000-8000-000000000009',
  gateThreeReview: '00000000-0000-4000-8000-000000000033',
  gateTwoReview: '00000000-0000-4000-8000-000000000020',
  headOfProduct: '00000000-0000-4000-8000-000000000002',
  marketingOwner: '00000000-0000-4000-8000-000000000005',
  product: '00000000-0000-4000-8000-000000000008',
  productOwner: '00000000-0000-4000-8000-000000000007',
  qaReviewer: '00000000-0000-4000-8000-000000000021',
  sourcingManager: '00000000-0000-4000-8000-000000000022',
};

export function createLaunchConfirmationRecord(
  overrides: Partial<LaunchConfirmationRecord> = {},
): LaunchConfirmationRecord {
  return {
    channels: [
      {
        accountName: 'Shopee Official Store',
        channelType: ChannelType.MTO,
        goLiveAt: '2026-05-15T09:00:00.000Z',
        id: '00000000-0000-4000-8000-000000000039',
        isLive: true,
        issueStatus: LaunchIssueStatus.NO_ISSUE,
        issueSummary: null,
        listingUrl: 'https://shopee.example.test/product',
      },
      {
        accountName: 'Lazada Flagship',
        channelType: ChannelType.ITO_RETAILERS,
        goLiveAt: '2026-05-15T10:00:00.000Z',
        id: '00000000-0000-4000-8000-000000000040',
        isLive: true,
        issueStatus: LaunchIssueStatus.MINOR_ISSUE,
        issueSummary: 'Banner pending final update.',
        listingUrl: 'https://lazada.example.test/product',
      },
    ],
    createdAt: new Date('2026-04-27T04:00:00.000Z'),
    id: '00000000-0000-4000-8000-000000000041',
    launchDate: '2026-05-15',
    notes: 'Launch is live across priority channels.',
    productId: testIds.product,
    updatedAt: new Date('2026-04-27T04:00:00.000Z'),
    ...overrides,
  };
}

export function createSellInReportRecord(
  overrides: Partial<SellInReportRecord> = {},
): SellInReportRecord {
  return {
    accounts: [
      {
        accountName: 'Shopee Official Store',
        channelType: ChannelType.MTO,
        declineReason: null,
        id: '00000000-0000-4000-8000-000000000042',
        sellInUnits: 120,
        sellInValue: '24000.00',
      },
      {
        accountName: 'Key Dealer Network',
        channelType: ChannelType.MM,
        declineReason: 'Some dealers waiting for display units.',
        id: '00000000-0000-4000-8000-000000000043',
        sellInUnits: 80,
        sellInValue: '14400.00',
      },
    ],
    createdAt: new Date('2026-04-27T05:00:00.000Z'),
    id: '00000000-0000-4000-8000-000000000044',
    notes: 'Week one sell-in is progressing.',
    productId: testIds.product,
    reportPeriodEnd: '2026-05-21',
    reportPeriodStart: '2026-05-15',
    totalSellInUnits: 200,
    totalSellInValue: '38400.00',
    updatedAt: new Date('2026-04-27T05:00:00.000Z'),
    ...overrides,
  };
}

export function createWeeklyFeedbackLogRecord(
  overrides: Partial<WeeklyFeedbackLogRecord> = {},
): WeeklyFeedbackLogRecord {
  return {
    createdAt: new Date('2026-04-27T06:00:00.000Z'),
    id: '00000000-0000-4000-8000-000000000045',
    items: [
      {
        actionOwner: 'Marketing',
        feedback: 'Hero image performs well.',
        id: '00000000-0000-4000-8000-000000000046',
        isResolved: true,
        notes: 'Keep asset live.',
        severity: FeedbackSeverity.LOW,
        source: FeedbackSource.MARKETING,
      },
      {
        actionOwner: 'KD',
        feedback: 'Two service questions about warranty terms.',
        id: '00000000-0000-4000-8000-000000000047',
        isResolved: false,
        notes: 'FAQ update needed.',
        severity: FeedbackSeverity.HIGH,
        source: FeedbackSource.KD_AFTER_SALES,
      },
    ],
    productId: testIds.product,
    summary: 'Launch week feedback is mostly positive.',
    updatedAt: new Date('2026-04-27T06:00:00.000Z'),
    weekStartDate: '2026-05-15',
    ...overrides,
  };
}

export function createDay30ReviewRecord(
  overrides: Partial<Day30ReviewRecord> = {},
): Day30ReviewRecord {
  return {
    actionPlan: 'Continue launch plan and monitor marketplace conversion.',
    actualRevenue: '120000.00',
    actualSellThroughUnits: 620,
    channelGp: [
      {
        actualGpPercent: '27.50',
        channelType: ChannelType.MTO,
        id: '00000000-0000-4000-8000-000000000048',
        notes: 'Above floor.',
      },
      {
        actualGpPercent: '23.00',
        channelType: ChannelType.ITO_RETAILERS,
        id: '00000000-0000-4000-8000-000000000049',
        notes: 'Above retail floor.',
      },
    ],
    createdAt: new Date('2026-04-27T07:00:00.000Z'),
    flags: [Day30PerformanceFlag.ON_TRACK],
    id: '00000000-0000-4000-8000-000000000050',
    productId: testIds.product,
    reviewSummary: 'Day 30 launch performance is on track.',
    targetRevenue: '100000.00',
    targetSellThroughUnits: 600,
    updatedAt: new Date('2026-04-27T07:00:00.000Z'),
    verdict: Day30Verdict.CONTINUE,
    ...overrides,
  };
}

export function createChannelListingPlanRecord(
  overrides: Partial<ChannelListingPlanRecord> = {},
): ChannelListingPlanRecord {
  return {
    channels: [
      {
        accountName: 'Shopee Official Store',
        channelType: ChannelType.MTO,
        id: '00000000-0000-4000-8000-000000000027',
        isConfirmed: true,
        launchOwner: 'Cluster A',
        readinessNotes: 'Hero listing ready.',
        targetGoLiveDate: '2026-05-15',
      },
      {
        accountName: 'Lazada Flagship',
        channelType: ChannelType.ITO_RETAILERS,
        id: '00000000-0000-4000-8000-000000000028',
        isConfirmed: true,
        launchOwner: 'Cluster B',
        readinessNotes: 'Listing copy approved.',
        targetGoLiveDate: '2026-05-15',
      },
      {
        accountName: 'Key Dealer Network',
        channelType: ChannelType.MM,
        id: '00000000-0000-4000-8000-000000000029',
        isConfirmed: true,
        launchOwner: 'Cluster C',
        readinessNotes: 'Sell-in list confirmed.',
        targetGoLiveDate: '2026-05-20',
      },
    ],
    createdAt: new Date('2026-04-27T00:00:00.000Z'),
    id: '00000000-0000-4000-8000-000000000030',
    lazadaConfirmed: true,
    productId: testIds.product,
    shopeeConfirmed: true,
    summary: 'Launch listing is ready across priority channels.',
    updatedAt: new Date('2026-04-27T00:00:00.000Z'),
    ...overrides,
  };
}

export function createChannelPricingRecord(
  overrides: Partial<ChannelPricingRecord> = {},
): ChannelPricingRecord {
  return {
    createdAt: new Date('2026-04-27T00:00:00.000Z'),
    currency: 'MYR',
    id: '00000000-0000-4000-8000-000000000031',
    notes: 'Launch pricing meets channel guardrails.',
    pricingRows: [
      {
        calculatedGpPercent: '30.00',
        channelType: ChannelType.MTO,
        id: '00000000-0000-4000-8000-000000000034',
        landedCost: '140.00',
        notes: 'Direct official store.',
        rsp: '200.00',
      },
      {
        calculatedGpPercent: '25.00',
        channelType: ChannelType.ITO_RETAILERS,
        id: '00000000-0000-4000-8000-000000000035',
        landedCost: '135.00',
        notes: 'Retail launch price.',
        rsp: '180.00',
      },
      {
        calculatedGpPercent: '30.00',
        channelType: ChannelType.MM,
        id: '00000000-0000-4000-8000-000000000036',
        landedCost: '126.00',
        notes: 'Dealer bundle.',
        rsp: '180.00',
      },
    ],
    productId: testIds.product,
    updatedAt: new Date('2026-04-27T00:00:00.000Z'),
    ...overrides,
  };
}

export function createGtmPlanRecord(overrides: Partial<GtmPlanRecord> = {}): GtmPlanRecord {
  return {
    activationPlan: 'Hero banner, dealer blast, and launch bundle.',
    budget: '50000.00',
    campaignEndDate: '2026-06-15',
    campaignStartDate: '2026-05-15',
    checklistItems: [
      {
        dueDate: '2026-05-01',
        id: '00000000-0000-4000-8000-000000000037',
        isComplete: true,
        isCritical: true,
        itemName: 'Product photography completed',
        notes: 'Images approved.',
        ownerRole: GtmOwnerRole.MARKETING_GTM_OWNER,
      },
      {
        dueDate: '2026-05-05',
        id: '00000000-0000-4000-8000-000000000038',
        isComplete: true,
        isCritical: true,
        itemName: 'Dealer blast scheduled',
        notes: 'Blast list loaded.',
        ownerRole: GtmOwnerRole.CLUSTER_MANAGER,
      },
    ],
    communicationsPlan: 'Dealer, marketplace, and social launch communications.',
    createdAt: new Date('2026-04-27T00:00:00.000Z'),
    id: '00000000-0000-4000-8000-000000000032',
    launchObjectives: 'Reach confirmed launch listings and initial sell-in momentum.',
    productId: testIds.product,
    updatedAt: new Date('2026-04-27T00:00:00.000Z'),
    ...overrides,
  };
}

export function createGateThreeReviewRecord(
  overrides: Partial<GateThreeReviewRecord> = {},
): GateThreeReviewRecord {
  return {
    createdAt: new Date('2026-04-27T00:00:00.000Z'),
    financeComment: 'Pricing confirmed.',
    financeConfirmedAt: new Date('2026-04-27T01:00:00.000Z'),
    financeConfirmedByUserId: testIds.financeOwner,
    gmApprovedAt: new Date('2026-04-27T03:00:00.000Z'),
    gmApprovedByUserId: testIds.commercialOwner,
    gmComment: 'Launch readiness accepted.',
    marketingComment: 'GTM assets ready.',
    marketingReviewedAt: new Date('2026-04-27T02:00:00.000Z'),
    marketingReviewedByUserId: testIds.marketingOwner,
    productId: testIds.product,
    updatedAt: new Date('2026-04-27T03:00:00.000Z'),
    ...overrides,
  };
}

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
