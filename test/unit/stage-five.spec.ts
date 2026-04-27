import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

import { AuditAction } from '../../src/enums/audit-action.enum';
import { PortfolioReviewStatus } from '../../src/enums/portfolio-review-status.enum';
import { ProductScorecardClass } from '../../src/enums/product-scorecard-class.enum';
import { ProductStage } from '../../src/enums/product-stage.enum';
import { RevampEolDecision } from '../../src/enums/revamp-eol-decision.enum';
import { RevampEolRecommendationOutcome } from '../../src/enums/revamp-eol-recommendation-outcome.enum';
import { UserRole } from '../../src/enums/user-role.enum';
import { PortfolioUpdatesController } from '../../src/modules/portfolio-updates/controllers/portfolio-updates.controller';
import { PortfolioUpdatesService } from '../../src/modules/portfolio-updates/services/portfolio-updates.service';
import { ProductScorecardsController } from '../../src/modules/product-scorecards/controllers/product-scorecards.controller';
import { ProductScorecardsService } from '../../src/modules/product-scorecards/services/product-scorecards.service';
import { RevampEolRecommendationsController } from '../../src/modules/revamp-eol-recommendations/controllers/revamp-eol-recommendations.controller';
import { RevampEolRecommendationsService } from '../../src/modules/revamp-eol-recommendations/services/revamp-eol-recommendations.service';
import {
  createPortfolioUpdateRecord,
  createProductRecord,
  createProductScorecardRecord,
  createRevampEolRecommendationRecord,
  testIds,
} from '../helpers/fixtures';

describe('ProductScorecardsService', () => {
  function createService(options?: {
    existingScorecards?: ReturnType<typeof createProductScorecardRecord>[];
    product?: ReturnType<typeof createProductRecord> | null;
  }): ProductScorecardsService {
    const product = options?.product === undefined
      ? createProductRecord({ currentStage: ProductStage.STAGE_5 })
      : options.product;
    const existingScorecards = options?.existingScorecards ?? [];

    return new ProductScorecardsService(
      { findById: async () => product } as never,
      {
        create: async (input: { classification: ProductScorecardClass; isEscalationRequired: boolean }) =>
          createProductScorecardRecord({
            classification: input.classification,
            isEscalationRequired: input.isEscalationRequired,
          }),
        findById: async () => existingScorecards[0] ?? null,
        listByProductId: async () => existingScorecards,
        update: async (_productId: string, _scorecardId: string, input: { classification?: ProductScorecardClass; isEscalationRequired?: boolean }) =>
          existingScorecards[0]
            ? createProductScorecardRecord({
                classification: input.classification ?? existingScorecards[0].classification,
                isEscalationRequired: input.isEscalationRequired ?? existingScorecards[0].isEscalationRequired,
              })
            : null,
      } as never,
    );
  }

  it('classifies A, B, and C scorecards with clear reasons', () => {
    assert.equal(
      ProductScorecardsService.classify({
        complaintCount: 2,
        grossProfitPercent: '30.00',
        sellThroughPercent: '85.00',
      }).classification,
      ProductScorecardClass.A,
    );
    assert.equal(
      ProductScorecardsService.classify({
        complaintCount: 7,
        grossProfitPercent: '22.00',
        sellThroughPercent: '70.00',
      }).classification,
      ProductScorecardClass.B,
    );
    assert.equal(
      ProductScorecardsService.classify({
        complaintCount: 25,
        grossProfitPercent: '22.00',
        sellThroughPercent: '70.00',
      }).classification,
      ProductScorecardClass.C,
    );
  });

  it('creates, lists, gets, updates, and flags two consecutive C-class reviews', async () => {
    const previousC = createProductScorecardRecord({ classification: ProductScorecardClass.C });
    const service = createService({ existingScorecards: [previousC] });

    const createdRecord = await service.create(testIds.product, {
      complaintCount: 21,
      grossProfitPercent: '20.00',
      margin: '1000.00',
      marketFeedbackSummary: 'Weak customer response.',
      revenue: '20000.00',
      reviewDate: '2026-08-15',
      sellThroughPercent: '65.00',
    });

    assert.equal(createdRecord.classification, ProductScorecardClass.C);
    assert.equal(createdRecord.isEscalationRequired, true);
    assert.equal((await service.list(testIds.product)).length, 1);
    assert.equal((await service.findOne(testIds.product, previousC.id)).id, previousC.id);
    assert.equal((await service.update(testIds.product, previousC.id, { complaintCount: 1 })).classification, ProductScorecardClass.A);
  });

  it('rejects missing products, locked stages, and missing scorecards', async () => {
    await assert.rejects(
      createService({ product: null }).create(testIds.product, {
        complaintCount: 1,
        grossProfitPercent: '30.00',
        margin: '1.00',
        marketFeedbackSummary: 'Good',
        revenue: '1.00',
        reviewDate: '2026-08-15',
        sellThroughPercent: '90.00',
      }),
      NotFoundException,
    );
    await assert.rejects(
      createService({ product: createProductRecord({ currentStage: ProductStage.STAGE_4 }) }).create(
        testIds.product,
        {
          complaintCount: 1,
          grossProfitPercent: '30.00',
          margin: '1.00',
          marketFeedbackSummary: 'Good',
          revenue: '1.00',
          reviewDate: '2026-08-15',
          sellThroughPercent: '90.00',
        },
      ),
      BadRequestException,
    );
    await assert.rejects(createService({ existingScorecards: [] }).findOne(testIds.product, testIds.productScorecard), NotFoundException);
  });
});

describe('PortfolioUpdatesController and Service', () => {
  it('maps create, list, get, and update responses', async () => {
    const record = createPortfolioUpdateRecord();
    const controller = new PortfolioUpdatesController({
      create: async () => record,
      findOne: async () => record,
      list: async () => [record],
      update: async () => ({ ...record, summary: 'Updated portfolio summary' }),
    } as never);

    assert.equal((await controller.create({
      reviewQuarter: record.reviewQuarter,
      rows: record.rows.map((row) => ({
        actionRecommendation: row.actionRecommendation,
        classification: row.classification,
        productId: row.productId,
        scorecardId: row.scorecardId ?? undefined,
      })),
      summary: record.summary,
    })).id, record.id);
    assert.equal((await controller.list()).length, 1);
    assert.equal((await controller.findOne(record.id)).id, record.id);
    assert.equal((await controller.update(record.id, { summary: 'Updated portfolio summary' })).summary, 'Updated portfolio summary');
  });

  it('defaults COO review status and rejects missing updates', async () => {
    const record = createPortfolioUpdateRecord();
    const service = new PortfolioUpdatesService({
      create: async (input: { cooReviewStatus: PortfolioReviewStatus }) =>
        createPortfolioUpdateRecord({ cooReviewStatus: input.cooReviewStatus }),
      findById: async () => null,
      list: async () => [record],
      update: async () => null,
    } as never);

    assert.equal((await service.create({
      reviewQuarter: '2026-Q4',
      rows: record.rows.map((row) => ({
        actionRecommendation: row.actionRecommendation,
        classification: row.classification,
        notes: row.notes ?? undefined,
        productId: row.productId,
        scorecardId: row.scorecardId ?? undefined,
      })),
      summary: 'Quarterly review',
    })).cooReviewStatus, PortfolioReviewStatus.DRAFT);
    await assert.rejects(service.findOne(record.id), NotFoundException);
    await assert.rejects(service.update(record.id, {}), NotFoundException);
  });
});

describe('RevampEolRecommendationsService', () => {
  const cooActor = {
    actingAsUserId: null,
    id: testIds.cooApprover,
    isAdminSupportOverride: false,
    role: UserRole.COO_EXECUTIVE_APPROVER,
  };
  const gmActor = {
    actingAsUserId: null,
    id: testIds.commercialOwner,
    isAdminSupportOverride: false,
    role: UserRole.GM_COMMERCIAL_OWNER,
  };

  function createTransactionClient(): { client: { query: (sql: string) => Promise<unknown>; release: () => void }; statements: string[] } {
    const statements: string[] = [];

    return {
      client: {
        query: async (sql: string) => {
          statements.push(sql);
          return { rows: [] };
        },
        release: () => undefined,
      },
      statements,
    };
  }

  function createService(options?: {
    existingRecord?: ReturnType<typeof createRevampEolRecommendationRecord> | null;
    product?: ReturnType<typeof createProductRecord> | null;
  }): RevampEolRecommendationsService {
    const product = options?.product === undefined
      ? createProductRecord({ currentStage: ProductStage.STAGE_5 })
      : options.product;
    const existingRecord = options?.existingRecord === undefined ? null : options.existingRecord;
    const transaction = createTransactionClient();

    return new RevampEolRecommendationsService(
      { getClient: async () => transaction.client } as never,
      { findById: async () => product } as never,
      {
        create: async (input: { action: AuditAction }) => ({
          action: input.action,
        }),
      } as never,
      {
        create: async (input: { recommendationOutcome: RevampEolRecommendationOutcome }) =>
          createRevampEolRecommendationRecord({
            recommendationOutcome: input.recommendationOutcome,
          }),
        findByProductId: async () => existingRecord,
        update: async (_productId: string, input: Partial<ReturnType<typeof createRevampEolRecommendationRecord>>) =>
          existingRecord ? createRevampEolRecommendationRecord({ ...existingRecord, ...input }) : null,
      } as never,
    );
  }

  it('creates one active recommendation and requires matching outcome option details', async () => {
    const service = createService();

    const record = await service.create(testIds.product, {
      eolOption: 'Retire after inventory sell-through.',
      recommendationOutcome: RevampEolRecommendationOutcome.EOL,
      recommendationSummary: 'Recommend EOL.',
      rootCauseAnalysis: 'Repeated C-class performance.',
      triggerReasons: ['Two C reviews'],
    });

    assert.equal(record.recommendationOutcome, RevampEolRecommendationOutcome.EOL);
    await assert.rejects(
      service.create(testIds.product, {
        recommendationOutcome: RevampEolRecommendationOutcome.REVAMP,
        recommendationSummary: 'Bad payload',
        rootCauseAnalysis: 'Missing option',
        triggerReasons: ['Low GP'],
      }),
      BadRequestException,
    );
    await assert.rejects(
      createService({ existingRecord: createRevampEolRecommendationRecord() }).create(testIds.product, {
        eolOption: 'Retire',
        recommendationOutcome: RevampEolRecommendationOutcome.EOL,
        recommendationSummary: 'Duplicate',
        rootCauseAnalysis: 'Duplicate',
        triggerReasons: ['Duplicate'],
      }),
      ConflictException,
    );
  });

  it('records GM input and COO decision with audit, and blocks decision before GM input', async () => {
    const service = createService({ existingRecord: createRevampEolRecommendationRecord() });

    await assert.rejects(
      service.recordCooDecision(testIds.product, cooActor, {
        decision: RevampEolDecision.APPROVED,
      }),
      ConflictException,
    );

    const withGmInput = await service.recordGmCommercialInput(testIds.product, gmActor, {
      commercialInput: 'Commercially acceptable to retire this SKU.',
    });

    assert.equal(withGmInput.gmInputByUserId, testIds.commercialOwner);

    const decision = await createService({
      existingRecord: createRevampEolRecommendationRecord({
        gmCommercialInput: 'Commercial input',
        gmInputAt: new Date('2026-04-27T11:00:00.000Z'),
        gmInputByUserId: testIds.commercialOwner,
      }),
    }).recordCooDecision(testIds.product, cooActor, {
      comment: 'Approved.',
      decision: RevampEolDecision.APPROVED,
    });

    assert.equal(decision.cooDecision, RevampEolDecision.APPROVED);
  });

  it('rejects locked stage, missing product, post-decision edits, and admin overrides without reason', async () => {
    await assert.rejects(
      createService({ product: null }).create(testIds.product, {
        eolOption: 'Retire',
        recommendationOutcome: RevampEolRecommendationOutcome.EOL,
        recommendationSummary: 'Recommend EOL',
        rootCauseAnalysis: 'Weak performance',
        triggerReasons: ['Low GP'],
      }),
      NotFoundException,
    );
    await assert.rejects(
      createService({ product: createProductRecord({ currentStage: ProductStage.STAGE_4 }) }).create(
        testIds.product,
        {
          eolOption: 'Retire',
          recommendationOutcome: RevampEolRecommendationOutcome.EOL,
          recommendationSummary: 'Recommend EOL',
          rootCauseAnalysis: 'Weak performance',
          triggerReasons: ['Low GP'],
        },
      ),
      BadRequestException,
    );
    await assert.rejects(
      createService({
        existingRecord: createRevampEolRecommendationRecord({
          cooDecision: RevampEolDecision.APPROVED,
        }),
      }).update(testIds.product, { recommendationSummary: 'Too late' }),
      ConflictException,
    );
    await assert.rejects(
      createService({ existingRecord: createRevampEolRecommendationRecord() }).recordGmCommercialInput(
        testIds.product,
        {
          actingAsUserId: testIds.commercialOwner,
          id: testIds.admin,
          isAdminSupportOverride: true,
          role: UserRole.ADMIN,
        },
        { commercialInput: 'Support action' },
      ),
      BadRequestException,
    );
  });
});

describe('Stage 5 controllers', () => {
  it('maps scorecard and recommendation controller responses', async () => {
    const scorecard = createProductScorecardRecord();
    const scorecardController = new ProductScorecardsController({
      create: async () => scorecard,
      findOne: async () => scorecard,
      list: async () => [scorecard],
      update: async () => ({ ...scorecard, notes: 'Updated' }),
    } as never);
    const recommendation = createRevampEolRecommendationRecord();
    const recommendationController = new RevampEolRecommendationsController({
      create: async () => recommendation,
      findOne: async () => recommendation,
      recordCooDecision: async () => ({ ...recommendation, cooDecision: RevampEolDecision.APPROVED }),
      recordGmCommercialInput: async () => ({ ...recommendation, gmCommercialInput: 'GM input' }),
      update: async () => ({ ...recommendation, recommendationSummary: 'Updated' }),
    } as never);

    assert.equal((await scorecardController.create(testIds.product, {
      complaintCount: 2,
      grossProfitPercent: '28.50',
      margin: '40000.00',
      marketFeedbackSummary: 'Good',
      revenue: '150000.00',
      reviewDate: '2026-07-15',
      sellThroughPercent: '85.00',
    })).id, scorecard.id);
    assert.equal((await scorecardController.list(testIds.product)).length, 1);
    assert.equal((await recommendationController.create(testIds.product, {
      eolOption: 'Retire',
      recommendationOutcome: RevampEolRecommendationOutcome.EOL,
      recommendationSummary: 'Recommend EOL',
      rootCauseAnalysis: 'Weak performance',
      triggerReasons: ['Low GP'],
    })).id, recommendation.id);
  });
});
