import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

import { ChannelType } from '../../src/enums/channel-type.enum';
import { ClearanceTrackerStatus } from '../../src/enums/clearance-tracker-status.enum';
import { EolMilestoneStatus } from '../../src/enums/eol-milestone-status.enum';
import { ProductStage } from '../../src/enums/product-stage.enum';
import { RevampEolDecision } from '../../src/enums/revamp-eol-decision.enum';
import { RevampEolRecommendationOutcome } from '../../src/enums/revamp-eol-recommendation-outcome.enum';
import { ClearancePlansController } from '../../src/modules/clearance-plans/controllers/clearance-plans.controller';
import { ClearancePlansService } from '../../src/modules/clearance-plans/services/clearance-plans.service';
import { EolExecutionPlansController } from '../../src/modules/eol-execution-plans/controllers/eol-execution-plans.controller';
import { EolExecutionPlansService } from '../../src/modules/eol-execution-plans/services/eol-execution-plans.service';
import {
  createClearancePlanRecord,
  createEolExecutionPlanRecord,
  createProductRecord,
  createRevampEolRecommendationRecord,
  testIds,
} from '../helpers/fixtures';

const approvedEolRecommendation = createRevampEolRecommendationRecord({
  cooDecision: RevampEolDecision.APPROVED,
  recommendationOutcome: RevampEolRecommendationOutcome.EOL,
});

const eolPlanInput = {
  kdHandoffNotes: 'KD handoff',
  milestones: [
    {
      dueDate: '2026-08-15',
      milestoneName: 'Stop PO',
      ownerRole: 'SPDM_PRODUCT_OPS',
      status: EolMilestoneStatus.NOT_STARTED,
    },
  ],
  serviceContinuityPlan: 'Continue warranty support.',
  sparePartsPlan: 'Reserve spare parts.',
  stockPositions: [
    {
      channelType: ChannelType.MTO,
      estimatedStockValue: '1000.00',
      onHandUnits: 10,
      reservedUnits: 1,
    },
  ],
  summary: 'Execute EOL.',
};

const clearancePlanInput = {
  allocations: [
    {
      allocatedUnits: 10,
      channelType: ChannelType.MTO,
    },
  ],
  executionInstructions: 'Clear stock.',
  pricingRows: [
    {
      channelType: ChannelType.MTO,
      clearanceRsp: '150.00',
      floorPrice: '140.00',
      markdownApproved: false,
      originalRsp: '199.00',
    },
  ],
  summary: 'Clear inventory.',
  weeklyTrackers: [
    {
      status: ClearanceTrackerStatus.NOT_STARTED,
      unitsCleared: 0,
      weekStartDate: '2026-08-17',
    },
  ],
};

describe('EolExecutionPlansService', () => {
  function createService(options?: {
    approvedRecommendation?: ReturnType<typeof createRevampEolRecommendationRecord> | null;
    existingRecord?: ReturnType<typeof createEolExecutionPlanRecord> | null;
    product?: ReturnType<typeof createProductRecord> | null;
  }): EolExecutionPlansService {
    const product = options?.product === undefined
      ? createProductRecord({ currentStage: ProductStage.STAGE_6 })
      : options.product;
    const approvedRecommendation =
      options?.approvedRecommendation === undefined ? approvedEolRecommendation : options.approvedRecommendation;
    const existingRecord = options?.existingRecord === undefined ? null : options.existingRecord;

    return new EolExecutionPlansService(
      { findById: async () => product } as never,
      { findApprovedEolByProductId: async () => approvedRecommendation } as never,
      {
        create: async () => createEolExecutionPlanRecord(),
        findByProductId: async () => existingRecord,
        update: async (_productId: string, input: { summary?: string }) =>
          existingRecord ? createEolExecutionPlanRecord({ summary: input.summary ?? existingRecord.summary }) : null,
      } as never,
    );
  }

  it('creates, gets, and updates EOL execution plans when Stage 5 EOL is approved', async () => {
    const createdRecord = await createService().create(testIds.product, eolPlanInput);

    assert.equal(createdRecord.productId, testIds.product);
    assert.equal(createdRecord.milestones.length, 1);
    assert.equal((await createService({ existingRecord: createdRecord }).findOne(testIds.product)).id, createdRecord.id);
    assert.equal((await createService({ existingRecord: createdRecord }).update(testIds.product, { summary: 'Updated EOL' })).summary, 'Updated EOL');
  });

  it('rejects missing approval, duplicates, locked stages, missing products, and missing updates', async () => {
    await assert.rejects(createService({ approvedRecommendation: null }).create(testIds.product, eolPlanInput), ConflictException);
    await assert.rejects(createService({ existingRecord: createEolExecutionPlanRecord() }).create(testIds.product, eolPlanInput), ConflictException);
    await assert.rejects(
      createService({ product: createProductRecord({ currentStage: ProductStage.STAGE_5 }) }).create(
        testIds.product,
        eolPlanInput,
      ),
      BadRequestException,
    );
    await assert.rejects(createService({ product: null }).create(testIds.product, eolPlanInput), NotFoundException);
    await assert.rejects(createService({ existingRecord: null }).update(testIds.product, {}), NotFoundException);
  });
});

describe('ClearancePlansService', () => {
  function createService(options?: {
    approvedRecommendation?: ReturnType<typeof createRevampEolRecommendationRecord> | null;
    existingRecord?: ReturnType<typeof createClearancePlanRecord> | null;
    product?: ReturnType<typeof createProductRecord> | null;
  }): ClearancePlansService {
    const product = options?.product === undefined
      ? createProductRecord({ currentStage: ProductStage.STAGE_6 })
      : options.product;
    const approvedRecommendation =
      options?.approvedRecommendation === undefined ? approvedEolRecommendation : options.approvedRecommendation;
    const existingRecord = options?.existingRecord === undefined ? null : options.existingRecord;

    return new ClearancePlansService(
      { findById: async () => product } as never,
      { findApprovedEolByProductId: async () => approvedRecommendation } as never,
      {
        create: async () => createClearancePlanRecord(),
        findByProductId: async () => existingRecord,
        update: async (_productId: string, input: { summary?: string }) =>
          existingRecord ? createClearancePlanRecord({ summary: input.summary ?? existingRecord.summary }) : null,
      } as never,
    );
  }

  it('creates, gets, and updates clearance plans when pricing passes guardrails', async () => {
    const createdRecord = await createService().create(testIds.product, clearancePlanInput);

    assert.equal(createdRecord.productId, testIds.product);
    assert.equal(createdRecord.weeklyTrackers.length, 1);
    assert.equal((await createService({ existingRecord: createdRecord }).findOne(testIds.product)).id, createdRecord.id);
    assert.equal((await createService({ existingRecord: createdRecord }).update(testIds.product, { summary: 'Updated clearance' })).summary, 'Updated clearance');
  });

  it('requires markdown approval for below-floor pricing and rejects invalid pricing values', async () => {
    await assert.rejects(
      createService().create(testIds.product, {
        ...clearancePlanInput,
        pricingRows: [
          {
            ...clearancePlanInput.pricingRows[0]!,
            clearanceRsp: '100.00',
            floorPrice: '140.00',
            markdownApproved: false,
          },
        ],
      }),
      ConflictException,
    );

    await assert.doesNotReject(
      createService().create(testIds.product, {
        ...clearancePlanInput,
        pricingRows: [
          {
            ...clearancePlanInput.pricingRows[0]!,
            clearanceRsp: '100.00',
            floorPrice: '140.00',
            markdownApproved: true,
          },
        ],
      }),
    );

    await assert.rejects(
      createService().create(testIds.product, {
        ...clearancePlanInput,
        pricingRows: [
          {
            ...clearancePlanInput.pricingRows[0]!,
            originalRsp: '0',
          },
        ],
      }),
      BadRequestException,
    );
  });

  it('rejects missing approval, duplicates, locked stages, missing products, and missing updates', async () => {
    await assert.rejects(createService({ approvedRecommendation: null }).create(testIds.product, clearancePlanInput), ConflictException);
    await assert.rejects(createService({ existingRecord: createClearancePlanRecord() }).create(testIds.product, clearancePlanInput), ConflictException);
    await assert.rejects(
      createService({ product: createProductRecord({ currentStage: ProductStage.STAGE_5 }) }).create(
        testIds.product,
        clearancePlanInput,
      ),
      BadRequestException,
    );
    await assert.rejects(createService({ product: null }).create(testIds.product, clearancePlanInput), NotFoundException);
    await assert.rejects(createService({ existingRecord: null }).update(testIds.product, {}), NotFoundException);
  });
});

describe('Stage 6 controllers', () => {
  it('maps EOL and clearance controller responses', async () => {
    const eolRecord = createEolExecutionPlanRecord();
    const clearanceRecord = createClearancePlanRecord();
    const eolController = new EolExecutionPlansController({
      create: async () => eolRecord,
      findOne: async () => eolRecord,
      update: async () => ({ ...eolRecord, summary: 'Updated EOL' }),
    } as never);
    const clearanceController = new ClearancePlansController({
      create: async () => clearanceRecord,
      findOne: async () => clearanceRecord,
      update: async () => ({ ...clearanceRecord, summary: 'Updated clearance' }),
    } as never);

    assert.equal((await eolController.create(testIds.product, eolPlanInput)).id, eolRecord.id);
    assert.equal((await eolController.findOne(testIds.product)).id, eolRecord.id);
    assert.equal((await eolController.update(testIds.product, { summary: 'Updated EOL' })).summary, 'Updated EOL');
    assert.equal((await clearanceController.create(testIds.product, clearancePlanInput)).id, clearanceRecord.id);
    assert.equal((await clearanceController.findOne(testIds.product)).id, clearanceRecord.id);
    assert.equal((await clearanceController.update(testIds.product, { summary: 'Updated clearance' })).summary, 'Updated clearance');
  });
});
