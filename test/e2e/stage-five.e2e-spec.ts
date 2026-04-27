import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { PortfolioReviewStatus } from '../../src/enums/portfolio-review-status.enum';
import { ProductScorecardClass } from '../../src/enums/product-scorecard-class.enum';
import { RevampEolDecision } from '../../src/enums/revamp-eol-decision.enum';
import { RevampEolRecommendationOutcome } from '../../src/enums/revamp-eol-recommendation-outcome.enum';
import { UserRole } from '../../src/enums/user-role.enum';
import { PoliciesGuard } from '../../src/guards/policies.guard';
import { AuthorizationPolicyService } from '../../src/modules/authorization/services/authorization-policy.service';
import { CreatePortfolioUpdateDto } from '../../src/modules/portfolio-updates/dto/create-portfolio-update.dto';
import { PortfolioUpdatesController } from '../../src/modules/portfolio-updates/controllers/portfolio-updates.controller';
import { PortfolioUpdatesService } from '../../src/modules/portfolio-updates/services/portfolio-updates.service';
import { CreateProductScorecardDto } from '../../src/modules/product-scorecards/dto/create-product-scorecard.dto';
import { ProductScorecardsController } from '../../src/modules/product-scorecards/controllers/product-scorecards.controller';
import { ProductScorecardsService } from '../../src/modules/product-scorecards/services/product-scorecards.service';
import { CreateRevampEolRecommendationDto } from '../../src/modules/revamp-eol-recommendations/dto/create-revamp-eol-recommendation.dto';
import { RecordCooDecisionDto } from '../../src/modules/revamp-eol-recommendations/dto/record-coo-decision.dto';
import { RecordGmCommercialInputDto } from '../../src/modules/revamp-eol-recommendations/dto/record-gm-commercial-input.dto';
import { RevampEolRecommendationsController } from '../../src/modules/revamp-eol-recommendations/controllers/revamp-eol-recommendations.controller';
import { RevampEolRecommendationsService } from '../../src/modules/revamp-eol-recommendations/services/revamp-eol-recommendations.service';
import { UsersRepository } from '../../src/modules/users/repositories/users.repository';
import {
  createPortfolioUpdateRecord,
  createProductScorecardRecord,
  createRevampEolRecommendationRecord,
  createUserRecord,
  testIds,
} from '../helpers/fixtures';
import {
  createExecutionContext,
  createHttpTestApp,
  createValidationPipe,
} from '../helpers/create-http-test-app';

describe('Stage 5 modules wiring (e2e)', () => {
  let app: Awaited<ReturnType<typeof createHttpTestApp>>['app'];
  let scorecardsController: ProductScorecardsController;
  let portfolioUpdatesController: PortfolioUpdatesController;
  let recommendationsController: RevampEolRecommendationsController;
  let guard: PoliciesGuard;

  const productManager = createUserRecord({ id: testIds.productOwner });
  const scorecardRecord = createProductScorecardRecord();
  const portfolioUpdateRecord = createPortfolioUpdateRecord();
  const recommendationRecord = createRevampEolRecommendationRecord();
  const scorecardsServiceMock = {
    create: async () => scorecardRecord,
    findOne: async () => scorecardRecord,
    list: async () => [scorecardRecord],
    update: async () => ({ ...scorecardRecord, notes: 'Updated scorecard' }),
  };
  const portfolioUpdatesServiceMock = {
    create: async () => portfolioUpdateRecord,
    findOne: async () => portfolioUpdateRecord,
    list: async () => [portfolioUpdateRecord],
    update: async () => ({ ...portfolioUpdateRecord, summary: 'Updated portfolio' }),
  };
  const recommendationsServiceMock = {
    create: async () => recommendationRecord,
    findOne: async () => recommendationRecord,
    recordCooDecision: async () => ({
      ...recommendationRecord,
      cooDecision: RevampEolDecision.APPROVED,
    }),
    recordGmCommercialInput: async () => ({
      ...recommendationRecord,
      gmCommercialInput: 'GM input',
    }),
    update: async () => ({
      ...recommendationRecord,
      recommendationSummary: 'Updated recommendation',
    }),
  };

  before(async () => {
    const setup = await createHttpTestApp({
      controllers: [
        ProductScorecardsController,
        PortfolioUpdatesController,
        RevampEolRecommendationsController,
      ],
      providers: [
        PoliciesGuard,
        {
          provide: ProductScorecardsService,
          useValue: scorecardsServiceMock,
        },
        {
          provide: PortfolioUpdatesService,
          useValue: portfolioUpdatesServiceMock,
        },
        {
          provide: RevampEolRecommendationsService,
          useValue: recommendationsServiceMock,
        },
        {
          provide: UsersRepository,
          useValue: {
            findById: async (id: string) => (id === testIds.productOwner ? productManager : null),
          },
        },
        {
          provide: AuthorizationPolicyService,
          useValue: { assertAuthorized: async () => undefined },
        },
        {
          provide: ConfigService,
          useValue: { get: () => 'test' },
        },
      ],
    });

    app = setup.app;
    scorecardsController = new ProductScorecardsController(scorecardsServiceMock as never);
    portfolioUpdatesController = new PortfolioUpdatesController(portfolioUpdatesServiceMock as never);
    recommendationsController = new RevampEolRecommendationsController(
      recommendationsServiceMock as never,
    );
    guard = new PoliciesGuard(
      new Reflector(),
      { get: () => 'test' } as never,
      { findById: async (id: string) => (id === testIds.productOwner ? productManager : null) } as never,
      { assertAuthorized: async () => undefined } as never,
    );
  });

  after(async () => {
    await app.close();
  });

  it('applies Stage 5 validation rules', async () => {
    const pipe = createValidationPipe();

    await assert.rejects(pipe.transform({ complaintCount: -1 }, {
      data: '',
      metatype: CreateProductScorecardDto,
      type: 'body',
    }));
    await assert.rejects(pipe.transform({ reviewQuarter: '2026-Q3', rows: [], summary: 'Bad' }, {
      data: '',
      metatype: CreatePortfolioUpdateDto,
      type: 'body',
    }));
    await assert.rejects(pipe.transform({ recommendationOutcome: 'UNKNOWN', triggerReasons: [] }, {
      data: '',
      metatype: CreateRevampEolRecommendationDto,
      type: 'body',
    }));
    await assert.rejects(pipe.transform({ commercialInput: '' }, {
      data: '',
      metatype: RecordGmCommercialInputDto,
      type: 'body',
    }));
    await assert.rejects(pipe.transform({ decision: 'UNKNOWN' }, {
      data: '',
      metatype: RecordCooDecisionDto,
      type: 'body',
    }));
  });

  it('wires Stage 5 controllers through create/read/update/action paths', async () => {
    await assert.doesNotReject(
      guard.canActivate(
        createExecutionContext({
          controllerClass: scorecardsController,
          handlerName: 'create',
          request: {
            headers: { 'x-dev-user-id': testIds.productOwner },
            params: { productId: testIds.product },
          },
        }),
      ),
    );

    const scorecardResponse = await scorecardsController.create(testIds.product, {
      complaintCount: 2,
      grossProfitPercent: '28.50',
      margin: '40000.00',
      marketFeedbackSummary: 'Good',
      revenue: '150000.00',
      reviewDate: '2026-07-15',
      sellThroughPercent: '85.00',
    });
    const portfolioResponse = await portfolioUpdatesController.create({
      cooReviewStatus: PortfolioReviewStatus.IN_REVIEW,
      reviewQuarter: '2026-Q3',
      rows: [
        {
          actionRecommendation: 'Keep growing',
          classification: ProductScorecardClass.A,
          productId: testIds.product,
          scorecardId: testIds.productScorecard,
        },
      ],
      summary: 'Quarterly portfolio update.',
    });
    const recommendationResponse = await recommendationsController.create(testIds.product, {
      eolOption: 'Retire',
      recommendationOutcome: RevampEolRecommendationOutcome.EOL,
      recommendationSummary: 'Recommend EOL',
      rootCauseAnalysis: 'Weak performance',
      triggerReasons: ['Low GP'],
    });

    assert.equal(scorecardResponse.id, scorecardRecord.id);
    assert.equal(portfolioResponse.id, portfolioUpdateRecord.id);
    assert.equal(recommendationResponse.id, recommendationRecord.id);
    assert.equal((await scorecardsController.list(testIds.product)).length, 1);
    assert.equal((await portfolioUpdatesController.list()).length, 1);
    assert.equal((await recommendationsController.update(testIds.product, { recommendationSummary: 'Updated recommendation' })).recommendationSummary, 'Updated recommendation');
  });
});
