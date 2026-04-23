import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ConflictException, NotFoundException } from '@nestjs/common';

import { ProductStage } from '../../src/enums/product-stage.enum';
import { BusinessCasesController } from '../../src/modules/business-cases/controllers/business-cases.controller';
import { BusinessCasesService } from '../../src/modules/business-cases/services/business-cases.service';
import { SupplierEvaluationsController } from '../../src/modules/supplier-evaluations/controllers/supplier-evaluations.controller';
import { SupplierEvaluationsService } from '../../src/modules/supplier-evaluations/services/supplier-evaluations.service';
import {
  createBusinessCaseRecord,
  createProductRecord,
  createSupplierEvaluationRecord,
  testIds,
} from '../helpers/fixtures';

describe('SupplierEvaluationsController', () => {
  const record = createSupplierEvaluationRecord();

  it('maps create, get, and update responses', async () => {
    const controller = new SupplierEvaluationsController({
      create: async () => record,
      findOne: async () => record,
      update: async () => ({
        ...record,
        summary: 'Updated supplier summary',
      }),
    } as never);

    const createResponse = await controller.create(testIds.product, {
      scoringMethodology: record.scoringMethodology,
      summary: record.summary ?? undefined,
      suppliers: record.suppliers.map((supplier) => ({
        factoryName: supplier.factoryName,
        isQualified: supplier.isQualified,
        leadTimeDays: supplier.leadTimeDays,
        moq: supplier.moq,
        originCountry: supplier.originCountry,
        paymentTerms: supplier.paymentTerms,
        remarks: supplier.remarks ?? undefined,
        sparePartsSupportNotes: supplier.sparePartsSupportNotes ?? undefined,
        supplierName: supplier.supplierName,
        toolingNotes: supplier.toolingNotes ?? undefined,
        weightedScore: supplier.weightedScore,
      })),
    });
    const getResponse = await controller.findOne(testIds.product);
    const updateResponse = await controller.update(testIds.product, {
      summary: 'Updated supplier summary',
    });

    assert.equal(createResponse.id, record.id);
    assert.equal(getResponse.suppliers.length, 2);
    assert.equal(updateResponse.summary, 'Updated supplier summary');
  });
});

describe('SupplierEvaluationsService', () => {
  function createService(options?: {
    existingRecord?: ReturnType<typeof createSupplierEvaluationRecord> | null;
    product?: ReturnType<typeof createProductRecord> | null;
  }): SupplierEvaluationsService {
    const product = options?.product === undefined
      ? createProductRecord({ currentStage: ProductStage.STAGE_2 })
      : options.product;
    const existingRecord = options?.existingRecord === undefined ? null : options.existingRecord;

    return new SupplierEvaluationsService(
      {
        findById: async () => product,
      } as never,
      {
        create: async (input: { suppliers: Array<{ id: string }> }) =>
          createSupplierEvaluationRecord({
            suppliers: input.suppliers.map((supplier, index) => ({
              ...createSupplierEvaluationRecord().suppliers[index]!,
              id: supplier.id,
            })),
          }),
        findByProductId: async () => existingRecord,
        update: async (_productId: string, input: { summary?: string }) =>
          createSupplierEvaluationRecord({
            summary: input.summary ?? existingRecord?.summary ?? null,
          }),
      } as never,
    );
  }

  it('creates supplier evaluations with generated row ids', async () => {
    const record = await createService().create(testIds.product, {
      scoringMethodology: 'Weighted commercial and technical review',
      suppliers: createSupplierEvaluationRecord().suppliers.map((supplier) => ({
        factoryName: supplier.factoryName,
        isQualified: supplier.isQualified,
        leadTimeDays: supplier.leadTimeDays,
        moq: supplier.moq,
        originCountry: supplier.originCountry,
        paymentTerms: supplier.paymentTerms,
        remarks: supplier.remarks ?? undefined,
        sparePartsSupportNotes: supplier.sparePartsSupportNotes ?? undefined,
        supplierName: supplier.supplierName,
        toolingNotes: supplier.toolingNotes ?? undefined,
        weightedScore: supplier.weightedScore,
      })),
    });

    assert.equal(record.suppliers.length, 2);
    assert.equal(typeof record.suppliers[0]?.id, 'string');
  });

  it('rejects duplicate, missing-product, locked-stage, and missing update cases', async () => {
    await assert.rejects(
      createService({
        existingRecord: createSupplierEvaluationRecord(),
      }).create(testIds.product, {
        scoringMethodology: 'Weighted',
        suppliers: createSupplierEvaluationRecord().suppliers.map((supplier) => ({
          factoryName: supplier.factoryName,
          isQualified: supplier.isQualified,
          leadTimeDays: supplier.leadTimeDays,
          moq: supplier.moq,
          originCountry: supplier.originCountry,
          paymentTerms: supplier.paymentTerms,
          supplierName: supplier.supplierName,
          weightedScore: supplier.weightedScore,
        })),
      }),
      ConflictException,
    );

    await assert.rejects(
      createService({
        product: null,
      }).create(testIds.product, {
        scoringMethodology: 'Weighted',
        suppliers: createSupplierEvaluationRecord().suppliers.map((supplier) => ({
          factoryName: supplier.factoryName,
          isQualified: supplier.isQualified,
          leadTimeDays: supplier.leadTimeDays,
          moq: supplier.moq,
          originCountry: supplier.originCountry,
          paymentTerms: supplier.paymentTerms,
          supplierName: supplier.supplierName,
          weightedScore: supplier.weightedScore,
        })),
      }),
      NotFoundException,
    );

    await assert.rejects(
      createService({
        product: createProductRecord({
          currentStage: ProductStage.STAGE_1,
        }),
      }).create(testIds.product, {
        scoringMethodology: 'Weighted',
        suppliers: createSupplierEvaluationRecord().suppliers.map((supplier) => ({
          factoryName: supplier.factoryName,
          isQualified: supplier.isQualified,
          leadTimeDays: supplier.leadTimeDays,
          moq: supplier.moq,
          originCountry: supplier.originCountry,
          paymentTerms: supplier.paymentTerms,
          supplierName: supplier.supplierName,
          weightedScore: supplier.weightedScore,
        })),
      }),
      ConflictException,
    );

    await assert.rejects(
      createService({
        existingRecord: null,
      }).update(testIds.product, {
        summary: 'Updated',
      }),
      NotFoundException,
    );
  });
});

describe('BusinessCasesController', () => {
  const record = createBusinessCaseRecord();

  it('maps create, get, and update responses', async () => {
    const controller = new BusinessCasesController({
      create: async () => record,
      findOne: async () => record,
      update: async () => ({
        ...record,
        recommendation: 'Updated recommendation',
      }),
    } as never);

    const createResponse = await controller.create(testIds.product, {
      channelGpSummary: record.channelGpSummary.map((entry) => ({
        channelName: entry.channelName,
        expectedGpPercent: entry.expectedGpPercent,
        notes: entry.notes ?? undefined,
      })),
      commercialNotes: record.commercialNotes ?? undefined,
      financeNotes: record.financeNotes ?? undefined,
      investmentNeeded: record.investmentNeeded,
      marketOpportunitySummary: record.marketOpportunitySummary,
      productSummary: record.productSummary,
      recommendation: record.recommendation,
      riskSummary: record.riskSummary,
      yearOneRevenue: record.yearOneRevenue,
      yearThreeRevenue: record.yearThreeRevenue,
      yearTwoRevenue: record.yearTwoRevenue,
    });
    const getResponse = await controller.findOne(testIds.product);
    const updateResponse = await controller.update(testIds.product, {
      recommendation: 'Updated recommendation',
    });

    assert.equal(createResponse.id, record.id);
    assert.equal(getResponse.channelGpSummary.length, 2);
    assert.equal(updateResponse.recommendation, 'Updated recommendation');
  });
});

describe('BusinessCasesService', () => {
  function createService(options?: {
    existingRecord?: ReturnType<typeof createBusinessCaseRecord> | null;
    product?: ReturnType<typeof createProductRecord> | null;
  }): BusinessCasesService {
    const product = options?.product === undefined
      ? createProductRecord({ currentStage: ProductStage.STAGE_2 })
      : options.product;
    const existingRecord = options?.existingRecord === undefined ? null : options.existingRecord;

    return new BusinessCasesService(
      {
        findById: async () => product,
      } as never,
      {
        create: async (input: { recommendation: string }) =>
          createBusinessCaseRecord({
            recommendation: input.recommendation,
          }),
        findByProductId: async () => existingRecord,
        update: async (_productId: string, input: { recommendation?: string }) =>
          createBusinessCaseRecord({
            recommendation: input.recommendation ?? existingRecord?.recommendation ?? 'Proceed',
          }),
      } as never,
    );
  }

  it('creates business cases successfully', async () => {
    const record = await createService().create(testIds.product, {
      channelGpSummary: createBusinessCaseRecord().channelGpSummary.map((entry) => ({
        channelName: entry.channelName,
        expectedGpPercent: entry.expectedGpPercent,
        notes: entry.notes ?? undefined,
      })),
      investmentNeeded: '450000.00',
      marketOpportunitySummary: 'Strong premium opportunity',
      productSummary: 'Compact premium desk fan',
      recommendation: 'Proceed',
      riskSummary: 'Lead time risk',
      yearOneRevenue: '1000.00',
      yearTwoRevenue: '2000.00',
      yearThreeRevenue: '3000.00',
    });

    assert.equal(record.recommendation, 'Proceed');
  });

  it('rejects duplicate, missing-product, locked-stage, and missing update cases', async () => {
    await assert.rejects(
      createService({
        existingRecord: createBusinessCaseRecord(),
      }).create(testIds.product, {
        channelGpSummary: createBusinessCaseRecord().channelGpSummary.map((entry) => ({
          channelName: entry.channelName,
          expectedGpPercent: entry.expectedGpPercent,
        })),
        investmentNeeded: '450000.00',
        marketOpportunitySummary: 'Strong premium opportunity',
        productSummary: 'Compact premium desk fan',
        recommendation: 'Proceed',
        riskSummary: 'Lead time risk',
        yearOneRevenue: '1000.00',
        yearTwoRevenue: '2000.00',
        yearThreeRevenue: '3000.00',
      }),
      ConflictException,
    );

    await assert.rejects(
      createService({
        product: null,
      }).create(testIds.product, {
        channelGpSummary: createBusinessCaseRecord().channelGpSummary.map((entry) => ({
          channelName: entry.channelName,
          expectedGpPercent: entry.expectedGpPercent,
        })),
        investmentNeeded: '450000.00',
        marketOpportunitySummary: 'Strong premium opportunity',
        productSummary: 'Compact premium desk fan',
        recommendation: 'Proceed',
        riskSummary: 'Lead time risk',
        yearOneRevenue: '1000.00',
        yearTwoRevenue: '2000.00',
        yearThreeRevenue: '3000.00',
      }),
      NotFoundException,
    );

    await assert.rejects(
      createService({
        product: createProductRecord({
          currentStage: ProductStage.STAGE_1,
        }),
      }).create(testIds.product, {
        channelGpSummary: createBusinessCaseRecord().channelGpSummary.map((entry) => ({
          channelName: entry.channelName,
          expectedGpPercent: entry.expectedGpPercent,
        })),
        investmentNeeded: '450000.00',
        marketOpportunitySummary: 'Strong premium opportunity',
        productSummary: 'Compact premium desk fan',
        recommendation: 'Proceed',
        riskSummary: 'Lead time risk',
        yearOneRevenue: '1000.00',
        yearTwoRevenue: '2000.00',
        yearThreeRevenue: '3000.00',
      }),
      ConflictException,
    );

    await assert.rejects(
      createService({
        existingRecord: null,
      }).update(testIds.product, {
        recommendation: 'Updated',
      }),
      NotFoundException,
    );
  });
});
