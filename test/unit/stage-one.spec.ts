import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ConflictException, NotFoundException } from '@nestjs/common';

import { ProductStage } from '../../src/enums/product-stage.enum';
import { CompetitorMatricesController } from '../../src/modules/competitor-matrices/controllers/competitor-matrices.controller';
import { CompetitorMatricesService } from '../../src/modules/competitor-matrices/services/competitor-matrices.service';
import { MarketSizingController } from '../../src/modules/market-sizing/controllers/market-sizing.controller';
import { MarketSizingService } from '../../src/modules/market-sizing/services/market-sizing.service';
import { OpportunityBriefsController } from '../../src/modules/opportunity-briefs/controllers/opportunity-briefs.controller';
import { OpportunityBriefsService } from '../../src/modules/opportunity-briefs/services/opportunity-briefs.service';
import { STAGE_ONE_MINIMUM_ART_TOTAL_SCORE } from '../../src/modules/workflow/constants/stage-one-art.constants';
import { StageOneCompletionService } from '../../src/modules/workflow/services/stage-one-completion.service';
import type { CompetitorMatrixEntryRecord } from '../../src/modules/competitor-matrices/types/competitor-matrix-record.type';
import {
  createCompetitorMatrixRecord,
  createMarketSizingRecord,
  createOpportunityBriefRecord,
  createProductRecord,
  testIds,
} from '../helpers/fixtures';

describe('OpportunityBriefsController', () => {
  const record = createOpportunityBriefRecord();

  it('maps create, get, and update responses', async () => {
    const controller = new OpportunityBriefsController({
      create: async () => record,
      findOne: async () => record,
      update: async () => ({
        ...record,
        opportunitySource: 'Updated Source',
      }),
    } as never);

    const createResponse = await controller.create(testIds.product, {
      affordableCostScore: 1,
      affordablePriceScore: 2,
      affordableValueScore: 1,
      opportunitySource: record.opportunitySource,
      problemStatement: record.problemStatement,
      reliableComplianceScore: 1,
      reliableDurabilityScore: 2,
      reliableServiceScore: 1,
      requiredDocumentsComplete: true,
      targetCustomer: record.targetCustomer,
      targetMarket: record.targetMarket,
      trendyCategoryScore: 1,
      trendyColourScore: 2,
      trendyDesignScore: 2,
      uniqueSellingPoints: record.uniqueSellingPoints,
    });
    const getResponse = await controller.findOne(testIds.product);
    const updateResponse = await controller.update(testIds.product, {
      opportunitySource: 'Updated Source',
    });

    assert.equal(createResponse.id, record.id);
    assert.equal(getResponse.productId, testIds.product);
    assert.equal(updateResponse.opportunitySource, 'Updated Source');
  });
});

describe('OpportunityBriefsService', () => {
  function createService(options?: {
    existingRecord?: ReturnType<typeof createOpportunityBriefRecord> | null;
    product?: ReturnType<typeof createProductRecord> | null;
    updatedRecord?: ReturnType<typeof createOpportunityBriefRecord> | null;
  }): OpportunityBriefsService {
    const product = options?.product !== undefined ? options.product : createProductRecord();
    const existingRecord = options?.existingRecord !== undefined ? options.existingRecord : null;

    return new OpportunityBriefsService(
      {
        findById: async () => product,
      } as never,
      {
        create: async (input: {
          affordableCostScore: number;
          affordablePriceScore: number;
          affordableValueScore: number;
          artTotalScore: number;
          opportunitySource: string;
          uniqueSellingPoints: string[];
        }) =>
          createOpportunityBriefRecord({
            affordableCostScore: input.affordableCostScore,
            affordablePriceScore: input.affordablePriceScore,
            affordableValueScore: input.affordableValueScore,
            artTotalScore: input.artTotalScore,
            opportunitySource: input.opportunitySource,
            uniqueSellingPoints: input.uniqueSellingPoints,
          }),
        findByProductId: async () => existingRecord,
        update: async (_productId: string, input: { artTotalScore: number; uniqueSellingPoints: string[] }) =>
          options?.updatedRecord ??
          createOpportunityBriefRecord({
            artTotalScore: input.artTotalScore,
            uniqueSellingPoints: input.uniqueSellingPoints,
          }),
      } as never,
    );
  }

  it('creates briefs with a calculated art total and deduplicated selling points', async () => {
    const service = createService();

    const record = await service.create(testIds.product, {
      affordableCostScore: 1,
      affordablePriceScore: 2,
      affordableValueScore: 1,
      opportunitySource: 'Dealer request',
      problemStatement: 'Need a compact premium fan.',
      reliableComplianceScore: 1,
      reliableDurabilityScore: 2,
      reliableServiceScore: 1,
      requiredDocumentsComplete: true,
      targetCustomer: 'Young households',
      targetMarket: 'Malaysia premium',
      trendyCategoryScore: 1,
      trendyColourScore: 2,
      trendyDesignScore: 2,
      uniqueSellingPoints: ['Compact', 'Compact', 'Premium finish'],
    });

    assert.equal(record.artTotalScore, 13);
    assert.deepEqual(record.uniqueSellingPoints, ['Compact', 'Premium finish']);
  });

  it('rejects duplicate, missing-product, and locked-stage cases', async () => {
    await assert.rejects(
      createService({
        existingRecord: createOpportunityBriefRecord(),
      }).create(testIds.product, {
        affordableCostScore: 1,
        affordablePriceScore: 2,
        affordableValueScore: 1,
        opportunitySource: 'Dealer request',
        problemStatement: 'Need a compact premium fan.',
        reliableComplianceScore: 1,
        reliableDurabilityScore: 2,
        reliableServiceScore: 1,
        requiredDocumentsComplete: true,
        targetCustomer: 'Young households',
        targetMarket: 'Malaysia premium',
        trendyCategoryScore: 1,
        trendyColourScore: 2,
        trendyDesignScore: 2,
        uniqueSellingPoints: ['Compact'],
      }),
      ConflictException,
    );

    await assert.rejects(
      createService({
        product: null,
      }).create(testIds.product, {
        affordableCostScore: 1,
        affordablePriceScore: 2,
        affordableValueScore: 1,
        opportunitySource: 'Dealer request',
        problemStatement: 'Need a compact premium fan.',
        reliableComplianceScore: 1,
        reliableDurabilityScore: 2,
        reliableServiceScore: 1,
        requiredDocumentsComplete: true,
        targetCustomer: 'Young households',
        targetMarket: 'Malaysia premium',
        trendyCategoryScore: 1,
        trendyColourScore: 2,
        trendyDesignScore: 2,
        uniqueSellingPoints: ['Compact'],
      }),
      NotFoundException,
    );

    await assert.rejects(
      createService({
        product: createProductRecord({
          currentStage: ProductStage.STAGE_2,
        }),
      }).create(testIds.product, {
        affordableCostScore: 1,
        affordablePriceScore: 2,
        affordableValueScore: 1,
        opportunitySource: 'Dealer request',
        problemStatement: 'Need a compact premium fan.',
        reliableComplianceScore: 1,
        reliableDurabilityScore: 2,
        reliableServiceScore: 1,
        requiredDocumentsComplete: true,
        targetCustomer: 'Young households',
        targetMarket: 'Malaysia premium',
        trendyCategoryScore: 1,
        trendyColourScore: 2,
        trendyDesignScore: 2,
        uniqueSellingPoints: ['Compact'],
      }),
      ConflictException,
    );
  });

  it('updates briefs and recalculates the art total', async () => {
    const service = createService({
      existingRecord: createOpportunityBriefRecord({
        artTotalScore: 13,
      }),
    });

    const record = await service.update(testIds.product, {
      affordablePriceScore: 0,
      uniqueSellingPoints: ['Compact', 'Compact'],
    });

    assert.equal(record.artTotalScore, 11);
    assert.deepEqual(record.uniqueSellingPoints, ['Compact']);
  });
});

describe('MarketSizingController', () => {
  const record = createMarketSizingRecord();

  it('maps create, get, and update responses', async () => {
    const controller = new MarketSizingController({
      create: async () => record,
      findOne: async () => record,
      update: async () => ({
        ...record,
        targetSegment: 'Updated Segment',
      }),
    } as never);

    const createResponse = await controller.create(testIds.product, {
      annualMarketSizeUnits: record.annualMarketSizeUnits,
      annualMarketSizeValue: record.annualMarketSizeValue,
      categoryName: record.categoryName,
      dataSources: record.dataSources,
      targetPriceBand: record.targetPriceBand,
      targetSegment: record.targetSegment,
      yearOneSalesUnits: record.yearOneSalesUnits,
      yearThreeSalesUnits: record.yearThreeSalesUnits,
      yearTwoSalesUnits: record.yearTwoSalesUnits,
    });
    const getResponse = await controller.findOne(testIds.product);
    const updateResponse = await controller.update(testIds.product, {
      targetSegment: 'Updated Segment',
    });

    assert.equal(createResponse.id, record.id);
    assert.equal(getResponse.productId, testIds.product);
    assert.equal(updateResponse.targetSegment, 'Updated Segment');
  });
});

describe('MarketSizingService', () => {
  function createService(options?: {
    existingRecord?: ReturnType<typeof createMarketSizingRecord> | null;
    product?: ReturnType<typeof createProductRecord> | null;
  }): MarketSizingService {
    const product = options?.product !== undefined ? options.product : createProductRecord();
    const existingRecord = options?.existingRecord !== undefined ? options.existingRecord : null;

    return new MarketSizingService(
      {
        findById: async () => product,
      } as never,
      {
        create: async (input: { dataSources: string[] }) =>
          createMarketSizingRecord({
            dataSources: input.dataSources,
          }),
        findByProductId: async () => existingRecord,
        update: async (_productId: string, input: { dataSources?: string[] }) =>
          createMarketSizingRecord({
            dataSources: input.dataSources ?? existingRecord?.dataSources ?? [],
          }),
      } as never,
    );
  }

  it('creates market sizing with deduplicated data sources', async () => {
    const service = createService();
    const record = await service.create(testIds.product, {
      annualMarketSizeUnits: 1000,
      annualMarketSizeValue: '150000.00',
      categoryName: 'Premium Desk Fans',
      dataSources: ['Nielsen', 'Nielsen', 'Shopee'],
      targetPriceBand: 'RM149-RM199',
      targetSegment: 'Urban premium',
      yearOneSalesUnits: 100,
      yearThreeSalesUnits: 300,
      yearTwoSalesUnits: 200,
    });

    assert.deepEqual(record.dataSources, ['Nielsen', 'Shopee']);
  });

  it('rejects duplicate, missing-product, and locked-stage market sizing writes', async () => {
    await assert.rejects(
      createService({
        existingRecord: createMarketSizingRecord(),
      }).create(testIds.product, {
        annualMarketSizeUnits: 1000,
        annualMarketSizeValue: '150000.00',
        categoryName: 'Premium Desk Fans',
        dataSources: ['Nielsen'],
        targetPriceBand: 'RM149-RM199',
        targetSegment: 'Urban premium',
        yearOneSalesUnits: 100,
        yearThreeSalesUnits: 300,
        yearTwoSalesUnits: 200,
      }),
      ConflictException,
    );

    await assert.rejects(
      createService({
        product: null,
      }).create(testIds.product, {
        annualMarketSizeUnits: 1000,
        annualMarketSizeValue: '150000.00',
        categoryName: 'Premium Desk Fans',
        dataSources: ['Nielsen'],
        targetPriceBand: 'RM149-RM199',
        targetSegment: 'Urban premium',
        yearOneSalesUnits: 100,
        yearThreeSalesUnits: 300,
        yearTwoSalesUnits: 200,
      }),
      NotFoundException,
    );

    await assert.rejects(
      createService({
        product: createProductRecord({
          currentStage: ProductStage.STAGE_2,
        }),
      }).create(testIds.product, {
        annualMarketSizeUnits: 1000,
        annualMarketSizeValue: '150000.00',
        categoryName: 'Premium Desk Fans',
        dataSources: ['Nielsen'],
        targetPriceBand: 'RM149-RM199',
        targetSegment: 'Urban premium',
        yearOneSalesUnits: 100,
        yearThreeSalesUnits: 300,
        yearTwoSalesUnits: 200,
      }),
      ConflictException,
    );
  });

  it('updates market sizing and rejects updates when missing', async () => {
    const service = createService({
      existingRecord: createMarketSizingRecord(),
    });

    const updatedRecord = await service.update(testIds.product, {
      dataSources: ['Shopee', 'Shopee'],
    });

    assert.deepEqual(updatedRecord.dataSources, ['Shopee']);

    await assert.rejects(
      createService({
        existingRecord: null,
      }).update(testIds.product, {
        targetSegment: 'Retail premium',
      }),
      NotFoundException,
    );
  });
});

describe('CompetitorMatricesController', () => {
  const record = createCompetitorMatrixRecord();

  it('maps create, get, and update responses', async () => {
    const controller = new CompetitorMatricesController({
      create: async () => record,
      findOne: async () => record,
      update: async () => ({
        ...record,
        summary: 'Updated summary',
      }),
    } as never);

    const createResponse = await controller.create(testIds.product, {
      entries: record.entries.map((entry) => ({
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
      scoringMethodology: record.scoringMethodology,
      summary: record.summary ?? undefined,
    });
    const getResponse = await controller.findOne(testIds.product);
    const updateResponse = await controller.update(testIds.product, {
      summary: 'Updated summary',
    });

    assert.equal(createResponse.id, record.id);
    assert.equal(getResponse.entries.length, 3);
    assert.equal(updateResponse.summary, 'Updated summary');
  });
});

describe('CompetitorMatricesService', () => {
  function createService(options?: {
    existingRecord?: ReturnType<typeof createCompetitorMatrixRecord> | null;
    product?: ReturnType<typeof createProductRecord> | null;
  }): CompetitorMatricesService {
    const product = options?.product !== undefined ? options.product : createProductRecord();
    const existingRecord = options?.existingRecord !== undefined ? options.existingRecord : null;

    return new CompetitorMatricesService(
      {
        findById: async () => product,
      } as never,
      {
        create: async (input: { entries: CompetitorMatrixEntryRecord[] }) =>
          createCompetitorMatrixRecord({
            entries: input.entries,
          }),
        findByProductId: async () => existingRecord,
        update: async (_productId: string, input: { entries?: CompetitorMatrixEntryRecord[] }) =>
          createCompetitorMatrixRecord({
            entries: input.entries ?? existingRecord?.entries ?? [],
          }),
      } as never,
    );
  }

  it('creates competitor matrices with generated entry ids and deduplicated notes', async () => {
    const service = createService();
    const record = await service.create(testIds.product, {
      entries: [
        {
          brandName: 'Brand A',
          competitorName: 'Competitor A',
          designScore: 4,
          featureScore: 4,
          modelName: 'A100',
          overallScore: 4,
          price: '159.00',
          strengths: ['Quiet', 'Quiet'],
          valueScore: 3,
          weaknesses: ['No remote', 'No remote'],
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
        {
          brandName: 'Brand C',
          competitorName: 'Competitor C',
          designScore: 5,
          featureScore: 3,
          modelName: 'C300',
          overallScore: 4,
          price: '189.00',
          strengths: ['Finish'],
          valueScore: 3,
          weaknesses: ['Price'],
        },
      ],
      scoringMethodology: '5-point weighted comparison',
      summary: 'Premium segment comparison',
    });

    assert.equal(record.entries.length, 3);
    assert.equal(typeof record.entries[0]?.id, 'string');
    assert.deepEqual(record.entries[0]?.strengths, ['Quiet']);
    assert.deepEqual(record.entries[0]?.weaknesses, ['No remote']);
  });

  it('rejects duplicate, missing-product, and locked-stage matrix writes', async () => {
    await assert.rejects(
      createService({
        existingRecord: createCompetitorMatrixRecord(),
      }).create(testIds.product, {
        entries: createCompetitorMatrixRecord().entries.map((entry) => ({
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
        scoringMethodology: '5-point weighted comparison',
      }),
      ConflictException,
    );

    await assert.rejects(
      createService({
        product: null,
      }).create(testIds.product, {
        entries: createCompetitorMatrixRecord().entries.map((entry) => ({
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
        scoringMethodology: '5-point weighted comparison',
      }),
      NotFoundException,
    );

    await assert.rejects(
      createService({
        product: createProductRecord({
          currentStage: ProductStage.STAGE_2,
        }),
      }).create(testIds.product, {
        entries: createCompetitorMatrixRecord().entries.map((entry) => ({
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
        scoringMethodology: '5-point weighted comparison',
      }),
      ConflictException,
    );
  });

  it('updates competitor matrices and rejects updates when missing', async () => {
    const service = createService({
      existingRecord: createCompetitorMatrixRecord(),
    });

    const updatedRecord = await service.update(testIds.product, {
      entries: createCompetitorMatrixRecord().entries.map((entry) => ({
        brandName: entry.brandName,
        competitorName: entry.competitorName,
        designScore: entry.designScore,
        featureScore: entry.featureScore,
        modelName: entry.modelName,
        overallScore: entry.overallScore,
        price: entry.price,
        strengths: [...entry.strengths, ...entry.strengths],
        valueScore: entry.valueScore,
        weaknesses: entry.weaknesses,
      })),
    });

    assert.deepEqual(updatedRecord.entries[0]?.strengths, ['Oscillation range']);

    await assert.rejects(
      createService({
        existingRecord: null,
      }).update(testIds.product, {
        summary: 'Updated summary',
      }),
      NotFoundException,
    );
  });
});

describe('StageOneCompletionService', () => {
  function createService(options?: {
    competitorMatrix?: ReturnType<typeof createCompetitorMatrixRecord> | null;
    marketSizing?: ReturnType<typeof createMarketSizingRecord> | null;
    opportunityBrief?: ReturnType<typeof createOpportunityBriefRecord> | null;
  }): StageOneCompletionService {
    return new StageOneCompletionService(
      {
        findByProductId: async () =>
          options?.opportunityBrief !== undefined
            ? options.opportunityBrief
            : createOpportunityBriefRecord(),
      } as never,
      {
        findByProductId: async () =>
          options?.marketSizing !== undefined
            ? options.marketSizing
            : createMarketSizingRecord(),
      } as never,
      {
        findByProductId: async () =>
          options?.competitorMatrix !== undefined
            ? options.competitorMatrix
            : createCompetitorMatrixRecord(),
      } as never,
    );
  }

  it('accepts complete Gate 1 data', async () => {
    await assert.doesNotReject(createService().assertReadyForGateOne(testIds.product));
  });

  it('rejects missing templates and failed Gate 1 requirements', async () => {
    await assert.rejects(
      createService({
        competitorMatrix: null,
        marketSizing: null,
        opportunityBrief: null,
      }).assertReadyForGateOne(testIds.product),
      (error: unknown) => {
        const details = (error as { response?: { details?: { missingRequirements?: string[] } } }).response
          ?.details;

        assert.deepEqual(details?.missingRequirements, [
          'opportunity_brief',
          'market_sizing',
          'competitor_matrix',
        ]);
        return true;
      },
    );

    await assert.rejects(
      createService({
        competitorMatrix: createCompetitorMatrixRecord({
          entries: createCompetitorMatrixRecord().entries.slice(0, 2),
        }),
        marketSizing: createMarketSizingRecord({
          dataSources: [],
        }),
        opportunityBrief: createOpportunityBriefRecord({
          artTotalScore: STAGE_ONE_MINIMUM_ART_TOTAL_SCORE - 1,
          requiredDocumentsComplete: false,
        }),
      }).assertReadyForGateOne(testIds.product),
      (error: unknown) => {
        const details = (error as { response?: { details?: { missingRequirements?: string[] } } }).response
          ?.details;

        assert.deepEqual(details?.missingRequirements, [
          'required_documents_complete',
          'minimum_art_score',
          'market_sizing_data_sources',
          'minimum_competitors',
        ]);
        return true;
      },
    );
  });
});
