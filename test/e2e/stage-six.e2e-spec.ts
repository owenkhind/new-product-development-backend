import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { ChannelType } from '../../src/enums/channel-type.enum';
import { ClearanceTrackerStatus } from '../../src/enums/clearance-tracker-status.enum';
import { EolMilestoneStatus } from '../../src/enums/eol-milestone-status.enum';
import { PoliciesGuard } from '../../src/guards/policies.guard';
import { AuthorizationPolicyService } from '../../src/modules/authorization/services/authorization-policy.service';
import { ClearancePlansController } from '../../src/modules/clearance-plans/controllers/clearance-plans.controller';
import { CreateClearancePlanDto } from '../../src/modules/clearance-plans/dto/create-clearance-plan.dto';
import { ClearancePlansService } from '../../src/modules/clearance-plans/services/clearance-plans.service';
import { EolExecutionPlansController } from '../../src/modules/eol-execution-plans/controllers/eol-execution-plans.controller';
import { CreateEolExecutionPlanDto } from '../../src/modules/eol-execution-plans/dto/create-eol-execution-plan.dto';
import { EolExecutionPlansService } from '../../src/modules/eol-execution-plans/services/eol-execution-plans.service';
import { UsersRepository } from '../../src/modules/users/repositories/users.repository';
import {
  createClearancePlanRecord,
  createEolExecutionPlanRecord,
  createUserRecord,
  testIds,
} from '../helpers/fixtures';
import {
  createExecutionContext,
  createHttpTestApp,
  createValidationPipe,
} from '../helpers/create-http-test-app';

describe('Stage 6 modules wiring (e2e)', () => {
  let app: Awaited<ReturnType<typeof createHttpTestApp>>['app'];
  let eolController: EolExecutionPlansController;
  let clearanceController: ClearancePlansController;
  let guard: PoliciesGuard;

  const commercialOwner = createUserRecord({ id: testIds.commercialOwner });
  const eolRecord = createEolExecutionPlanRecord();
  const clearanceRecord = createClearancePlanRecord();
  const eolServiceMock = {
    create: async () => eolRecord,
    findOne: async () => eolRecord,
    update: async () => ({ ...eolRecord, summary: 'Updated EOL' }),
  };
  const clearanceServiceMock = {
    create: async () => clearanceRecord,
    findOne: async () => clearanceRecord,
    update: async () => ({ ...clearanceRecord, summary: 'Updated clearance' }),
  };

  before(async () => {
    const setup = await createHttpTestApp({
      controllers: [EolExecutionPlansController, ClearancePlansController],
      providers: [
        PoliciesGuard,
        {
          provide: EolExecutionPlansService,
          useValue: eolServiceMock,
        },
        {
          provide: ClearancePlansService,
          useValue: clearanceServiceMock,
        },
        {
          provide: UsersRepository,
          useValue: {
            findById: async (id: string) => (id === testIds.commercialOwner ? commercialOwner : null),
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
    eolController = new EolExecutionPlansController(eolServiceMock as never);
    clearanceController = new ClearancePlansController(clearanceServiceMock as never);
    guard = new PoliciesGuard(
      new Reflector(),
      { get: () => 'test' } as never,
      { findById: async (id: string) => (id === testIds.commercialOwner ? commercialOwner : null) } as never,
      { assertAuthorized: async () => undefined } as never,
    );
  });

  after(async () => {
    await app.close();
  });

  it('applies Stage 6 validation rules', async () => {
    const pipe = createValidationPipe();

    await assert.rejects(pipe.transform({ milestones: [], stockPositions: [] }, {
      data: '',
      metatype: CreateEolExecutionPlanDto,
      type: 'body',
    }));
    await assert.rejects(pipe.transform({ allocations: [], pricingRows: [], weeklyTrackers: [] }, {
      data: '',
      metatype: CreateClearancePlanDto,
      type: 'body',
    }));
  });

  it('wires Stage 6 controllers through create/read/update paths', async () => {
    await assert.doesNotReject(
      guard.canActivate(
        createExecutionContext({
          controllerClass: eolController,
          handlerName: 'create',
          request: {
            headers: { 'x-dev-user-id': testIds.commercialOwner },
            params: { productId: testIds.product },
          },
        }),
      ),
    );

    const eolResponse = await eolController.create(testIds.product, {
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
    });
    const clearanceResponse = await clearanceController.create(testIds.product, {
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
    });

    assert.equal(eolResponse.id, eolRecord.id);
    assert.equal(clearanceResponse.id, clearanceRecord.id);
    assert.equal((await eolController.update(testIds.product, { summary: 'Updated EOL' })).summary, 'Updated EOL');
    assert.equal((await clearanceController.update(testIds.product, { summary: 'Updated clearance' })).summary, 'Updated clearance');
  });
});
