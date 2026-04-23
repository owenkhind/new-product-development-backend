import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { PoliciesGuard } from '../../src/guards/policies.guard';
import { AuthorizationPolicyService } from '../../src/modules/authorization/services/authorization-policy.service';
import { BusinessCasesController } from '../../src/modules/business-cases/controllers/business-cases.controller';
import { CreateBusinessCaseDto } from '../../src/modules/business-cases/dto/create-business-case.dto';
import { BusinessCasesService } from '../../src/modules/business-cases/services/business-cases.service';
import { SupplierEvaluationsController } from '../../src/modules/supplier-evaluations/controllers/supplier-evaluations.controller';
import { CreateSupplierEvaluationDto } from '../../src/modules/supplier-evaluations/dto/create-supplier-evaluation.dto';
import { SupplierEvaluationsService } from '../../src/modules/supplier-evaluations/services/supplier-evaluations.service';
import { UsersRepository } from '../../src/modules/users/repositories/users.repository';
import {
  createBusinessCaseRecord,
  createSupplierEvaluationRecord,
  createUserRecord,
  testIds,
} from '../helpers/fixtures';
import {
  createExecutionContext,
  createHttpTestApp,
  createValidationPipe,
} from '../helpers/create-http-test-app';

describe('Stage 2 modules wiring (e2e)', () => {
  let app: Awaited<ReturnType<typeof createHttpTestApp>>['app'];
  let supplierEvaluationsController: SupplierEvaluationsController;
  let businessCasesController: BusinessCasesController;
  let guard: PoliciesGuard;

  const productManager = createUserRecord({
    id: testIds.productOwner,
  });
  const supplierEvaluationRecord = createSupplierEvaluationRecord();
  const businessCaseRecord = createBusinessCaseRecord();

  before(async () => {
    const setup = await createHttpTestApp({
      controllers: [SupplierEvaluationsController, BusinessCasesController],
      providers: [
        PoliciesGuard,
        {
          provide: SupplierEvaluationsService,
          useValue: {
            create: async () => supplierEvaluationRecord,
            findOne: async () => supplierEvaluationRecord,
            update: async () => ({
              ...supplierEvaluationRecord,
              summary: 'Updated supplier summary',
            }),
          },
        },
        {
          provide: BusinessCasesService,
          useValue: {
            create: async () => businessCaseRecord,
            findOne: async () => businessCaseRecord,
            update: async () => ({
              ...businessCaseRecord,
              recommendation: 'Updated recommendation',
            }),
          },
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
    supplierEvaluationsController = new SupplierEvaluationsController({
      create: async () => supplierEvaluationRecord,
      findOne: async () => supplierEvaluationRecord,
      update: async () => ({
        ...supplierEvaluationRecord,
        summary: 'Updated supplier summary',
      }),
    } as never);
    businessCasesController = new BusinessCasesController({
      create: async () => businessCaseRecord,
      findOne: async () => businessCaseRecord,
      update: async () => ({
        ...businessCaseRecord,
        recommendation: 'Updated recommendation',
      }),
    } as never);
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

  it('applies Stage 2 validation rules', async () => {
    const pipe = createValidationPipe();

    await assert.rejects(
      pipe.transform(
        {
          scoringMethodology: 'Weighted',
          suppliers: [],
        },
        {
          data: '',
          metatype: CreateSupplierEvaluationDto,
          type: 'body',
        },
      ),
    );

    await assert.rejects(
      pipe.transform(
        {
          channelGpSummary: [],
          investmentNeeded: 'abc',
        },
        {
          data: '',
          metatype: CreateBusinessCaseDto,
          type: 'body',
        },
      ),
    );
  });

  it('wires Supplier Evaluation and Business Case controllers through create/read/update paths', async () => {
    await assert.doesNotReject(
      guard.canActivate(
        createExecutionContext({
          controllerClass: supplierEvaluationsController,
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

    const supplierResponse = await supplierEvaluationsController.create(testIds.product, {
      scoringMethodology: supplierEvaluationRecord.scoringMethodology,
      summary: supplierEvaluationRecord.summary ?? undefined,
      suppliers: supplierEvaluationRecord.suppliers.map((supplier) => ({
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

    const businessCaseResponse = await businessCasesController.create(testIds.product, {
      channelGpSummary: businessCaseRecord.channelGpSummary.map((entry) => ({
        channelName: entry.channelName,
        expectedGpPercent: entry.expectedGpPercent,
        notes: entry.notes ?? undefined,
      })),
      commercialNotes: businessCaseRecord.commercialNotes ?? undefined,
      financeNotes: businessCaseRecord.financeNotes ?? undefined,
      investmentNeeded: businessCaseRecord.investmentNeeded,
      marketOpportunitySummary: businessCaseRecord.marketOpportunitySummary,
      productSummary: businessCaseRecord.productSummary,
      recommendation: businessCaseRecord.recommendation,
      riskSummary: businessCaseRecord.riskSummary,
      yearOneRevenue: businessCaseRecord.yearOneRevenue,
      yearThreeRevenue: businessCaseRecord.yearThreeRevenue,
      yearTwoRevenue: businessCaseRecord.yearTwoRevenue,
    });

    const supplierUpdateResponse = await supplierEvaluationsController.update(testIds.product, {
      summary: 'Updated supplier summary',
    });
    const businessCaseGetResponse = await businessCasesController.findOne(testIds.product);

    assert.equal(supplierResponse.id, supplierEvaluationRecord.id);
    assert.equal(businessCaseResponse.id, businessCaseRecord.id);
    assert.equal(supplierUpdateResponse.summary, 'Updated supplier summary');
    assert.equal(businessCaseGetResponse.channelGpSummary.length, 2);
  });
});
