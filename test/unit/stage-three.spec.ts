import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

import { ChannelType } from '../../src/enums/channel-type.enum';
import { GtmOwnerRole } from '../../src/enums/gtm-owner-role.enum';
import { ProductStage } from '../../src/enums/product-stage.enum';
import { ChannelListingPlansController } from '../../src/modules/channel-listing-plans/controllers/channel-listing-plans.controller';
import { ChannelListingPlansService } from '../../src/modules/channel-listing-plans/services/channel-listing-plans.service';
import { ChannelPricingController } from '../../src/modules/channel-pricing/controllers/channel-pricing.controller';
import { ChannelPricingService } from '../../src/modules/channel-pricing/services/channel-pricing.service';
import { GtmPlansController } from '../../src/modules/gtm-plans/controllers/gtm-plans.controller';
import { GtmPlansService } from '../../src/modules/gtm-plans/services/gtm-plans.service';
import {
  createChannelListingPlanRecord,
  createChannelPricingRecord,
  createGtmPlanRecord,
  createProductRecord,
  testIds,
} from '../helpers/fixtures';

describe('ChannelListingPlansController', () => {
  const record = createChannelListingPlanRecord();

  it('maps create, get, and update responses', async () => {
    const controller = new ChannelListingPlansController({
      create: async () => record,
      findOne: async () => record,
      update: async () => ({
        ...record,
        summary: 'Updated listing summary',
      }),
    } as never);

    const createResponse = await controller.create(testIds.product, {
      channels: record.channels.map((channel) => ({
        accountName: channel.accountName,
        channelType: channel.channelType,
        isConfirmed: channel.isConfirmed,
        launchOwner: channel.launchOwner,
        readinessNotes: channel.readinessNotes ?? undefined,
        targetGoLiveDate: channel.targetGoLiveDate ?? undefined,
      })),
      lazadaConfirmed: record.lazadaConfirmed,
      shopeeConfirmed: record.shopeeConfirmed,
      summary: record.summary ?? undefined,
    });
    const getResponse = await controller.findOne(testIds.product);
    const updateResponse = await controller.update(testIds.product, {
      summary: 'Updated listing summary',
    });

    assert.equal(createResponse.id, record.id);
    assert.equal(getResponse.channels.length, 3);
    assert.equal(updateResponse.summary, 'Updated listing summary');
  });
});

describe('ChannelListingPlansService', () => {
  function createService(options?: {
    existingRecord?: ReturnType<typeof createChannelListingPlanRecord> | null;
    product?: ReturnType<typeof createProductRecord> | null;
  }): ChannelListingPlansService {
    const product = options?.product === undefined
      ? createProductRecord({ currentStage: ProductStage.STAGE_3 })
      : options.product;
    const existingRecord = options?.existingRecord === undefined ? null : options.existingRecord;

    return new ChannelListingPlansService(
      {
        findById: async () => product,
      } as never,
      {
        create: async (input: { channels: Array<{ id: string }> }) =>
          createChannelListingPlanRecord({
            channels: input.channels.map((channel, index) => ({
              ...createChannelListingPlanRecord().channels[index]!,
              id: channel.id,
            })),
          }),
        findByProductId: async () => existingRecord,
        update: async (_productId: string, input: { summary?: string }) =>
          createChannelListingPlanRecord({
            summary: input.summary ?? existingRecord?.summary ?? null,
          }),
      } as never,
    );
  }

  it('creates listing plans with generated row ids', async () => {
    const record = await createService().create(testIds.product, {
      channels: createChannelListingPlanRecord().channels.map((channel) => ({
        accountName: channel.accountName,
        channelType: channel.channelType,
        isConfirmed: channel.isConfirmed,
        launchOwner: channel.launchOwner,
        readinessNotes: channel.readinessNotes ?? undefined,
        targetGoLiveDate: channel.targetGoLiveDate ?? undefined,
      })),
      lazadaConfirmed: true,
      shopeeConfirmed: true,
    });

    assert.equal(record.channels.length, 3);
    assert.equal(typeof record.channels[0]?.id, 'string');
  });

  it('rejects duplicate, missing-product, locked-stage, and missing update cases', async () => {
    await assert.rejects(
      createService({
        existingRecord: createChannelListingPlanRecord(),
      }).create(testIds.product, {
        channels: createChannelListingPlanRecord().channels.map((channel) => ({
          accountName: channel.accountName,
          channelType: channel.channelType,
          isConfirmed: channel.isConfirmed,
          launchOwner: channel.launchOwner,
        })),
        lazadaConfirmed: true,
        shopeeConfirmed: true,
      }),
      ConflictException,
    );

    await assert.rejects(
      createService({
        product: null,
      }).create(testIds.product, {
        channels: createChannelListingPlanRecord().channels.map((channel) => ({
          accountName: channel.accountName,
          channelType: channel.channelType,
          isConfirmed: channel.isConfirmed,
          launchOwner: channel.launchOwner,
        })),
        lazadaConfirmed: true,
        shopeeConfirmed: true,
      }),
      NotFoundException,
    );

    await assert.rejects(
      createService({
        product: createProductRecord({
          currentStage: ProductStage.STAGE_2,
        }),
      }).create(testIds.product, {
        channels: createChannelListingPlanRecord().channels.map((channel) => ({
          accountName: channel.accountName,
          channelType: channel.channelType,
          isConfirmed: channel.isConfirmed,
          launchOwner: channel.launchOwner,
        })),
        lazadaConfirmed: true,
        shopeeConfirmed: true,
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

describe('ChannelPricingController', () => {
  const record = createChannelPricingRecord();

  it('maps create, get, and update responses', async () => {
    const controller = new ChannelPricingController({
      create: async () => record,
      findOne: async () => record,
      update: async () => ({
        ...record,
        notes: 'Updated pricing notes',
      }),
    } as never);

    const createResponse = await controller.create(testIds.product, {
      currency: record.currency,
      notes: record.notes ?? undefined,
      pricingRows: record.pricingRows.map((row) => ({
        channelType: row.channelType,
        landedCost: row.landedCost,
        notes: row.notes ?? undefined,
        rsp: row.rsp,
      })),
    });
    const getResponse = await controller.findOne(testIds.product);
    const updateResponse = await controller.update(testIds.product, {
      notes: 'Updated pricing notes',
    });

    assert.equal(createResponse.id, record.id);
    assert.equal(getResponse.pricingRows[0]?.calculatedGpPercent, '30.00');
    assert.equal(updateResponse.notes, 'Updated pricing notes');
  });
});

describe('ChannelPricingService', () => {
  function createService(options?: {
    existingRecord?: ReturnType<typeof createChannelPricingRecord> | null;
    product?: ReturnType<typeof createProductRecord> | null;
  }): ChannelPricingService {
    const product = options?.product === undefined
      ? createProductRecord({ currentStage: ProductStage.STAGE_3 })
      : options.product;
    const existingRecord = options?.existingRecord === undefined ? null : options.existingRecord;

    return new ChannelPricingService(
      {
        findById: async () => product,
      } as never,
      {
        create: async (input: {
          pricingRows: Array<{
            calculatedGpPercent: string;
            channelType: ChannelType;
            landedCost: string;
            rsp: string;
          }>;
        }) =>
          createChannelPricingRecord({
            pricingRows: input.pricingRows.map((row, index) => ({
              ...createChannelPricingRecord().pricingRows[index]!,
              calculatedGpPercent: row.calculatedGpPercent,
              channelType: row.channelType,
              landedCost: row.landedCost,
              rsp: row.rsp,
            })),
          }),
        findByProductId: async () => existingRecord,
        update: async (_productId: string, input: { notes?: string }) =>
          createChannelPricingRecord({
            notes: input.notes ?? existingRecord?.notes ?? null,
          }),
      } as never,
    );
  }

  it('calculates GP and detects guardrail failures', async () => {
    const record = await createService().create(testIds.product, {
      currency: 'MYR',
      pricingRows: [
        {
          channelType: ChannelType.MTO,
          landedCost: '150.00',
          rsp: '200.00',
        },
        {
          channelType: ChannelType.ITO_RETAILERS,
          landedCost: '150.00',
          rsp: '170.00',
        },
      ],
    });

    assert.equal(record.pricingRows[0]?.calculatedGpPercent, '25.00');
    assert.equal(ChannelPricingService.getFailedGpFloorRows(record).length, 1);
    assert.equal(ChannelPricingService.hasItoUndercutViolation(record), true);
  });

  it('rejects invalid pricing, duplicate, locked-stage, and missing update cases', async () => {
    await assert.rejects(
      createService().create(testIds.product, {
        currency: 'MYR',
        pricingRows: [
          {
            channelType: ChannelType.MTO,
            landedCost: '1.00',
            rsp: '0.00',
          },
        ],
      }),
      BadRequestException,
    );

    await assert.rejects(
      createService({
        existingRecord: createChannelPricingRecord(),
      }).create(testIds.product, {
        currency: 'MYR',
        pricingRows: [
          {
            channelType: ChannelType.MTO,
            landedCost: '140.00',
            rsp: '200.00',
          },
        ],
      }),
      ConflictException,
    );

    await assert.rejects(
      createService({
        product: createProductRecord({
          currentStage: ProductStage.STAGE_2,
        }),
      }).create(testIds.product, {
        currency: 'MYR',
        pricingRows: [
          {
            channelType: ChannelType.MTO,
            landedCost: '140.00',
            rsp: '200.00',
          },
        ],
      }),
      ConflictException,
    );

    await assert.rejects(
      createService({
        existingRecord: null,
      }).update(testIds.product, {
        notes: 'Updated',
      }),
      NotFoundException,
    );
  });
});

describe('GtmPlansController', () => {
  const record = createGtmPlanRecord();

  it('maps create, get, and update responses', async () => {
    const controller = new GtmPlansController({
      create: async () => record,
      findOne: async () => record,
      update: async () => ({
        ...record,
        launchObjectives: 'Updated launch objectives',
      }),
    } as never);

    const createResponse = await controller.create(testIds.product, {
      activationPlan: record.activationPlan,
      budget: record.budget,
      campaignEndDate: record.campaignEndDate ?? undefined,
      campaignStartDate: record.campaignStartDate ?? undefined,
      checklistItems: record.checklistItems.map((item) => ({
        dueDate: item.dueDate ?? undefined,
        isComplete: item.isComplete,
        isCritical: item.isCritical,
        itemName: item.itemName,
        notes: item.notes ?? undefined,
        ownerRole: item.ownerRole,
      })),
      communicationsPlan: record.communicationsPlan,
      launchObjectives: record.launchObjectives,
    });
    const getResponse = await controller.findOne(testIds.product);
    const updateResponse = await controller.update(testIds.product, {
      launchObjectives: 'Updated launch objectives',
    });

    assert.equal(createResponse.id, record.id);
    assert.equal(getResponse.checklistItems.length, 2);
    assert.equal(updateResponse.launchObjectives, 'Updated launch objectives');
  });
});

describe('GtmPlansService', () => {
  function createService(options?: {
    existingRecord?: ReturnType<typeof createGtmPlanRecord> | null;
    product?: ReturnType<typeof createProductRecord> | null;
  }): GtmPlansService {
    const product = options?.product === undefined
      ? createProductRecord({ currentStage: ProductStage.STAGE_3 })
      : options.product;
    const existingRecord = options?.existingRecord === undefined ? null : options.existingRecord;

    return new GtmPlansService(
      {
        findById: async () => product,
      } as never,
      {
        create: async (input: {
          checklistItems: Array<{
            id: string;
            isComplete: boolean;
            isCritical: boolean;
            itemName: string;
            ownerRole: GtmOwnerRole;
          }>;
        }) =>
          createGtmPlanRecord({
            checklistItems: input.checklistItems.map((item, index) => ({
              ...createGtmPlanRecord().checklistItems[index]!,
              id: item.id,
              isComplete: item.isComplete,
              isCritical: item.isCritical,
              itemName: item.itemName,
              ownerRole: item.ownerRole,
            })),
          }),
        findByProductId: async () => existingRecord,
        update: async (_productId: string, input: { launchObjectives?: string }) =>
          createGtmPlanRecord({
            launchObjectives: input.launchObjectives ?? existingRecord?.launchObjectives ?? 'Launch',
          }),
      } as never,
    );
  }

  it('creates GTM plans and detects unresolved critical checklist items', async () => {
    const record = await createService().create(testIds.product, {
      activationPlan: 'Launch bundle',
      budget: '50000.00',
      checklistItems: [
        {
          isComplete: false,
          isCritical: true,
          itemName: 'Hero banner',
          ownerRole: GtmOwnerRole.MARKETING_GTM_OWNER,
        },
      ],
      communicationsPlan: 'Dealer blast',
      launchObjectives: 'Launch readiness',
    });

    assert.equal(record.checklistItems.length, 1);
    assert.equal(GtmPlansService.getUnresolvedCriticalItems(record).length, 1);
  });

  it('rejects duplicate, missing-product, locked-stage, and missing update cases', async () => {
    await assert.rejects(
      createService({
        existingRecord: createGtmPlanRecord(),
      }).create(testIds.product, {
        activationPlan: 'Launch bundle',
        budget: '50000.00',
        checklistItems: [
          {
            isComplete: true,
            isCritical: true,
            itemName: 'Hero banner',
            ownerRole: GtmOwnerRole.MARKETING_GTM_OWNER,
          },
        ],
        communicationsPlan: 'Dealer blast',
        launchObjectives: 'Launch readiness',
      }),
      ConflictException,
    );

    await assert.rejects(
      createService({
        product: null,
      }).create(testIds.product, {
        activationPlan: 'Launch bundle',
        budget: '50000.00',
        checklistItems: [
          {
            isComplete: true,
            isCritical: true,
            itemName: 'Hero banner',
            ownerRole: GtmOwnerRole.MARKETING_GTM_OWNER,
          },
        ],
        communicationsPlan: 'Dealer blast',
        launchObjectives: 'Launch readiness',
      }),
      NotFoundException,
    );

    await assert.rejects(
      createService({
        product: createProductRecord({
          currentStage: ProductStage.STAGE_2,
        }),
      }).create(testIds.product, {
        activationPlan: 'Launch bundle',
        budget: '50000.00',
        checklistItems: [
          {
            isComplete: true,
            isCritical: true,
            itemName: 'Hero banner',
            ownerRole: GtmOwnerRole.MARKETING_GTM_OWNER,
          },
        ],
        communicationsPlan: 'Dealer blast',
        launchObjectives: 'Launch readiness',
      }),
      ConflictException,
    );

    await assert.rejects(
      createService({
        existingRecord: null,
      }).update(testIds.product, {
        launchObjectives: 'Updated',
      }),
      NotFoundException,
    );
  });
});
