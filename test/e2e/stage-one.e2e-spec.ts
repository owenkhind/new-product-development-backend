import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { PoliciesGuard } from '../../src/guards/policies.guard';
import { AuthorizationPolicyService } from '../../src/modules/authorization/services/authorization-policy.service';
import { CompetitorMatricesController } from '../../src/modules/competitor-matrices/controllers/competitor-matrices.controller';
import { CreateCompetitorMatrixDto } from '../../src/modules/competitor-matrices/dto/create-competitor-matrix.dto';
import { CompetitorMatricesService } from '../../src/modules/competitor-matrices/services/competitor-matrices.service';
import { MarketSizingController } from '../../src/modules/market-sizing/controllers/market-sizing.controller';
import { CreateMarketSizingDto } from '../../src/modules/market-sizing/dto/create-market-sizing.dto';
import { MarketSizingService } from '../../src/modules/market-sizing/services/market-sizing.service';
import { OpportunityBriefsController } from '../../src/modules/opportunity-briefs/controllers/opportunity-briefs.controller';
import { CreateOpportunityBriefDto } from '../../src/modules/opportunity-briefs/dto/create-opportunity-brief.dto';
import { OpportunityBriefsService } from '../../src/modules/opportunity-briefs/services/opportunity-briefs.service';
import { UsersRepository } from '../../src/modules/users/repositories/users.repository';
import {
  createCompetitorMatrixRecord,
  createMarketSizingRecord,
  createOpportunityBriefRecord,
  createUserRecord,
  testIds,
} from '../helpers/fixtures';
import {
  createExecutionContext,
  createHttpTestApp,
  createValidationPipe,
} from '../helpers/create-http-test-app';

describe('Stage 1 modules wiring (e2e)', () => {
  let app: Awaited<ReturnType<typeof createHttpTestApp>>['app'];
  let opportunityBriefsController: OpportunityBriefsController;
  let marketSizingController: MarketSizingController;
  let competitorMatricesController: CompetitorMatricesController;
  let guard: PoliciesGuard;

  const productManager = createUserRecord({
    id: testIds.productOwner,
  });
  const opportunityBriefRecord = createOpportunityBriefRecord();
  const marketSizingRecord = createMarketSizingRecord();
  const competitorMatrixRecord = createCompetitorMatrixRecord();

  const opportunityBriefsService = {
    create: async () => opportunityBriefRecord,
    findOne: async () => opportunityBriefRecord,
    update: async () => ({
      ...opportunityBriefRecord,
      opportunitySource: 'Updated Source',
    }),
  };
  const marketSizingService = {
    create: async () => marketSizingRecord,
    findOne: async () => marketSizingRecord,
    update: async () => ({
      ...marketSizingRecord,
      targetSegment: 'Updated Segment',
    }),
  };
  const competitorMatricesService = {
    create: async () => competitorMatrixRecord,
    findOne: async () => competitorMatrixRecord,
    update: async () => ({
      ...competitorMatrixRecord,
      summary: 'Updated summary',
    }),
  };

  before(async () => {
    const setup = await createHttpTestApp({
      controllers: [
        OpportunityBriefsController,
        MarketSizingController,
        CompetitorMatricesController,
      ],
      providers: [
        PoliciesGuard,
        {
          provide: OpportunityBriefsService,
          useValue: opportunityBriefsService,
        },
        {
          provide: MarketSizingService,
          useValue: marketSizingService,
        },
        {
          provide: CompetitorMatricesService,
          useValue: competitorMatricesService,
        },
        {
          provide: UsersRepository,
          useValue: {
            findById: async (id: string) => (id === testIds.productOwner ? productManager : null),
          },
        },
        {
          provide: AuthorizationPolicyService,
          useValue: {
            assertAuthorized: async () => undefined,
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: () => 'test',
          },
        },
      ],
    });

    app = setup.app;
    opportunityBriefsController = new OpportunityBriefsController(opportunityBriefsService as never);
    marketSizingController = new MarketSizingController(marketSizingService as never);
    competitorMatricesController = new CompetitorMatricesController(
      competitorMatricesService as never,
    );
    guard = new PoliciesGuard(
      new Reflector(),
      {
        get: () => 'test',
      } as never,
      {
        findById: async (id: string) => (id === testIds.productOwner ? productManager : null),
      } as never,
      {
        assertAuthorized: async () => undefined,
      } as never,
    );
  });

  after(async () => {
    await app.close();
  });

  it('rejects unauthenticated Stage 1 requests through the guard', async () => {
    await assert.rejects(
      guard.canActivate(
        createExecutionContext({
          controllerClass: opportunityBriefsController,
          handlerName: 'create',
          request: {
            headers: {},
            params: {
              productId: testIds.product,
            },
          },
        }),
      ),
    );
  });

  it('applies Stage 1 validation rules', async () => {
    const pipe = createValidationPipe();

    await assert.rejects(
      pipe.transform(
        {
          affordablePriceScore: 3,
          opportunitySource: '',
        },
        {
          data: '',
          metatype: CreateOpportunityBriefDto,
          type: 'body',
        },
      ),
    );

    await assert.rejects(
      pipe.transform(
        {
          annualMarketSizeUnits: -1,
          annualMarketSizeValue: 'abc',
          categoryName: 'Premium Desk Fans',
          dataSources: [],
          targetPriceBand: 'RM149-RM199',
          targetSegment: 'Urban premium',
          yearOneSalesUnits: 100,
          yearTwoSalesUnits: 200,
          yearThreeSalesUnits: 300,
        },
        {
          data: '',
          metatype: CreateMarketSizingDto,
          type: 'body',
        },
      ),
    );

    await assert.rejects(
      pipe.transform(
        {
          entries: [
            {
              brandName: 'Brand A',
              competitorName: 'Competitor A',
              designScore: 4,
              featureScore: 4,
              modelName: 'A100',
              overallScore: 4,
              price: '159.00',
              strengths: ['Quiet'],
              valueScore: 3,
              weaknesses: ['No remote'],
            },
            {
              brandName: 'Brand B',
              competitorName: 'Competitor B',
              designScore: 3,
              featureScore: 4,
              modelName: 'B200',
              overallScore: 4,
              price: '169.00',
              strengths: ['Motor'],
              valueScore: 4,
              weaknesses: ['Plastic'],
            },
          ],
          scoringMethodology: '5-point weighted comparison',
        },
        {
          data: '',
          metatype: CreateCompetitorMatrixDto,
          type: 'body',
        },
      ),
    );
  });

  it('wires Stage 1 controllers through create, read, and update paths', async () => {
    await assert.doesNotReject(
      guard.canActivate(
        createExecutionContext({
          controllerClass: opportunityBriefsController,
          handlerName: 'create',
          request: {
            headers: {
              'x-dev-user-id': testIds.productOwner,
            },
            params: {
              productId: testIds.product,
            },
          },
        }),
      ),
    );

    const opportunityBriefResponse = await opportunityBriefsController.create(testIds.product, {
      affordableCostScore: opportunityBriefRecord.affordableCostScore,
      affordablePriceScore: opportunityBriefRecord.affordablePriceScore,
      affordableValueScore: opportunityBriefRecord.affordableValueScore,
      opportunitySource: opportunityBriefRecord.opportunitySource,
      problemStatement: opportunityBriefRecord.problemStatement,
      reliableComplianceScore: opportunityBriefRecord.reliableComplianceScore,
      reliableDurabilityScore: opportunityBriefRecord.reliableDurabilityScore,
      reliableServiceScore: opportunityBriefRecord.reliableServiceScore,
      requiredDocumentsComplete: opportunityBriefRecord.requiredDocumentsComplete,
      targetCustomer: opportunityBriefRecord.targetCustomer,
      targetMarket: opportunityBriefRecord.targetMarket,
      trendyCategoryScore: opportunityBriefRecord.trendyCategoryScore,
      trendyColourScore: opportunityBriefRecord.trendyColourScore,
      trendyDesignScore: opportunityBriefRecord.trendyDesignScore,
      uniqueSellingPoints: opportunityBriefRecord.uniqueSellingPoints,
    });
    const marketSizingResponse = await marketSizingController.create(testIds.product, {
      annualMarketSizeUnits: marketSizingRecord.annualMarketSizeUnits,
      annualMarketSizeValue: marketSizingRecord.annualMarketSizeValue,
      categoryName: marketSizingRecord.categoryName,
      dataSources: marketSizingRecord.dataSources,
      targetPriceBand: marketSizingRecord.targetPriceBand,
      targetSegment: marketSizingRecord.targetSegment,
      yearOneSalesUnits: marketSizingRecord.yearOneSalesUnits,
      yearTwoSalesUnits: marketSizingRecord.yearTwoSalesUnits,
      yearThreeSalesUnits: marketSizingRecord.yearThreeSalesUnits,
    });
    const competitorMatrixResponse = await competitorMatricesController.create(testIds.product, {
      entries: competitorMatrixRecord.entries.map((entry) => ({
        brandName: entry.brandName,
        competitorName: entry.competitorName,
        designScore: entry.designScore,
        featureScore: entry.featureScore,
        modelName: entry.modelName,
        overallScore: entry.overallScore,
        price: entry.price,
        strengths: entry.strengths,
        valueScore: entry.valueScore,
        weaknesses: entry.weaknesses,
      })),
      scoringMethodology: competitorMatrixRecord.scoringMethodology,
      summary: competitorMatrixRecord.summary ?? undefined,
    });

    const opportunityBriefGetResponse = await opportunityBriefsController.findOne(testIds.product);
    const marketSizingUpdateResponse = await marketSizingController.update(testIds.product, {
      targetSegment: 'Updated Segment',
    });
    const competitorMatrixUpdateResponse = await competitorMatricesController.update(
      testIds.product,
      {
        summary: 'Updated summary',
      },
    );

    assert.equal(opportunityBriefResponse.id, opportunityBriefRecord.id);
    assert.equal(marketSizingResponse.id, marketSizingRecord.id);
    assert.equal(competitorMatrixResponse.entries.length, 3);
    assert.equal(opportunityBriefGetResponse.id, opportunityBriefRecord.id);
    assert.equal(marketSizingUpdateResponse.targetSegment, 'Updated Segment');
    assert.equal(competitorMatrixUpdateResponse.summary, 'Updated summary');
  });
});
