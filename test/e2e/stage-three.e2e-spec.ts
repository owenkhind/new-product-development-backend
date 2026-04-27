import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { ChannelType } from '../../src/enums/channel-type.enum';
import { GtmOwnerRole } from '../../src/enums/gtm-owner-role.enum';
import { PoliciesGuard } from '../../src/guards/policies.guard';
import { AuthorizationPolicyService } from '../../src/modules/authorization/services/authorization-policy.service';
import { ChannelListingPlansController } from '../../src/modules/channel-listing-plans/controllers/channel-listing-plans.controller';
import { CreateChannelListingPlanDto } from '../../src/modules/channel-listing-plans/dto/create-channel-listing-plan.dto';
import { ChannelListingPlansService } from '../../src/modules/channel-listing-plans/services/channel-listing-plans.service';
import { ChannelPricingController } from '../../src/modules/channel-pricing/controllers/channel-pricing.controller';
import { CreateChannelPricingDto } from '../../src/modules/channel-pricing/dto/create-channel-pricing.dto';
import { ChannelPricingService } from '../../src/modules/channel-pricing/services/channel-pricing.service';
import { CreateGtmPlanDto } from '../../src/modules/gtm-plans/dto/create-gtm-plan.dto';
import { GtmPlansController } from '../../src/modules/gtm-plans/controllers/gtm-plans.controller';
import { GtmPlansService } from '../../src/modules/gtm-plans/services/gtm-plans.service';
import { UsersRepository } from '../../src/modules/users/repositories/users.repository';
import {
  createChannelListingPlanRecord,
  createChannelPricingRecord,
  createGtmPlanRecord,
  createUserRecord,
  testIds,
} from '../helpers/fixtures';
import {
  createExecutionContext,
  createHttpTestApp,
  createValidationPipe,
} from '../helpers/create-http-test-app';

describe('Stage 3 modules wiring (e2e)', () => {
  let app: Awaited<ReturnType<typeof createHttpTestApp>>['app'];
  let channelListingPlansController: ChannelListingPlansController;
  let channelPricingController: ChannelPricingController;
  let gtmPlansController: GtmPlansController;
  let guard: PoliciesGuard;

  const productManager = createUserRecord({
    id: testIds.productOwner,
  });
  const channelListingPlanRecord = createChannelListingPlanRecord();
  const channelPricingRecord = createChannelPricingRecord();
  const gtmPlanRecord = createGtmPlanRecord();

  before(async () => {
    const setup = await createHttpTestApp({
      controllers: [ChannelListingPlansController, ChannelPricingController, GtmPlansController],
      providers: [
        PoliciesGuard,
        {
          provide: ChannelListingPlansService,
          useValue: {
            create: async () => channelListingPlanRecord,
            findOne: async () => channelListingPlanRecord,
            update: async () => ({
              ...channelListingPlanRecord,
              summary: 'Updated listing summary',
            }),
          },
        },
        {
          provide: ChannelPricingService,
          useValue: {
            create: async () => channelPricingRecord,
            findOne: async () => channelPricingRecord,
            update: async () => ({
              ...channelPricingRecord,
              notes: 'Updated pricing notes',
            }),
          },
        },
        {
          provide: GtmPlansService,
          useValue: {
            create: async () => gtmPlanRecord,
            findOne: async () => gtmPlanRecord,
            update: async () => ({
              ...gtmPlanRecord,
              launchObjectives: 'Updated launch objectives',
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
    channelListingPlansController = new ChannelListingPlansController({
      create: async () => channelListingPlanRecord,
      findOne: async () => channelListingPlanRecord,
      update: async () => ({
        ...channelListingPlanRecord,
        summary: 'Updated listing summary',
      }),
    } as never);
    channelPricingController = new ChannelPricingController({
      create: async () => channelPricingRecord,
      findOne: async () => channelPricingRecord,
      update: async () => ({
        ...channelPricingRecord,
        notes: 'Updated pricing notes',
      }),
    } as never);
    gtmPlansController = new GtmPlansController({
      create: async () => gtmPlanRecord,
      findOne: async () => gtmPlanRecord,
      update: async () => ({
        ...gtmPlanRecord,
        launchObjectives: 'Updated launch objectives',
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

  it('applies Stage 3 validation rules', async () => {
    const pipe = createValidationPipe();

    await assert.rejects(
      pipe.transform(
        {
          channels: [],
          lazadaConfirmed: true,
          shopeeConfirmed: true,
        },
        {
          data: '',
          metatype: CreateChannelListingPlanDto,
          type: 'body',
        },
      ),
    );

    await assert.rejects(
      pipe.transform(
        {
          currency: 'MYR',
          pricingRows: [
            {
              channelType: 'UNKNOWN',
              landedCost: '100.00',
              rsp: '150.00',
            },
          ],
        },
        {
          data: '',
          metatype: CreateChannelPricingDto,
          type: 'body',
        },
      ),
    );

    await assert.rejects(
      pipe.transform(
        {
          activationPlan: 'Launch',
          budget: '50000.00',
          checklistItems: [
            {
              isComplete: false,
              isCritical: true,
              itemName: 'Hero banner',
              ownerRole: 'UNKNOWN',
            },
          ],
          communicationsPlan: 'Dealer blast',
          launchObjectives: 'Launch readiness',
        },
        {
          data: '',
          metatype: CreateGtmPlanDto,
          type: 'body',
        },
      ),
    );
  });

  it('wires Stage 3 controllers through create/read/update paths', async () => {
    await assert.doesNotReject(
      guard.canActivate(
        createExecutionContext({
          controllerClass: channelListingPlansController,
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

    const listingResponse = await channelListingPlansController.create(testIds.product, {
      channels: channelListingPlanRecord.channels.map((channel) => ({
        accountName: channel.accountName,
        channelType: channel.channelType,
        isConfirmed: channel.isConfirmed,
        launchOwner: channel.launchOwner,
        readinessNotes: channel.readinessNotes ?? undefined,
        targetGoLiveDate: channel.targetGoLiveDate ?? undefined,
      })),
      lazadaConfirmed: true,
      shopeeConfirmed: true,
      summary: channelListingPlanRecord.summary ?? undefined,
    });

    const pricingResponse = await channelPricingController.create(testIds.product, {
      currency: 'MYR',
      notes: channelPricingRecord.notes ?? undefined,
      pricingRows: [
        {
          channelType: ChannelType.MTO,
          landedCost: '140.00',
          rsp: '200.00',
        },
      ],
    });

    const gtmResponse = await gtmPlansController.create(testIds.product, {
      activationPlan: gtmPlanRecord.activationPlan,
      budget: gtmPlanRecord.budget,
      campaignEndDate: gtmPlanRecord.campaignEndDate ?? undefined,
      campaignStartDate: gtmPlanRecord.campaignStartDate ?? undefined,
      checklistItems: [
        {
          isComplete: true,
          isCritical: true,
          itemName: 'Hero banner',
          ownerRole: GtmOwnerRole.MARKETING_GTM_OWNER,
        },
      ],
      communicationsPlan: gtmPlanRecord.communicationsPlan,
      launchObjectives: gtmPlanRecord.launchObjectives,
    });

    const listingUpdateResponse = await channelListingPlansController.update(testIds.product, {
      summary: 'Updated listing summary',
    });
    const pricingGetResponse = await channelPricingController.findOne(testIds.product);

    assert.equal(listingResponse.id, channelListingPlanRecord.id);
    assert.equal(pricingResponse.id, channelPricingRecord.id);
    assert.equal(gtmResponse.id, gtmPlanRecord.id);
    assert.equal(listingUpdateResponse.summary, 'Updated listing summary');
    assert.equal(pricingGetResponse.pricingRows.length, 3);
  });
});
