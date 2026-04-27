import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { ChannelType } from '../../src/enums/channel-type.enum';
import { Day30Verdict } from '../../src/enums/day-30-verdict.enum';
import { FeedbackSeverity } from '../../src/enums/feedback-severity.enum';
import { FeedbackSource } from '../../src/enums/feedback-source.enum';
import { LaunchIssueStatus } from '../../src/enums/launch-issue-status.enum';
import { PoliciesGuard } from '../../src/guards/policies.guard';
import { AuthorizationPolicyService } from '../../src/modules/authorization/services/authorization-policy.service';
import { CreateDay30ReviewDto } from '../../src/modules/day-30-reviews/dto/create-day-30-review.dto';
import { Day30ReviewsController } from '../../src/modules/day-30-reviews/controllers/day-30-reviews.controller';
import { Day30ReviewsService } from '../../src/modules/day-30-reviews/services/day-30-reviews.service';
import { CreateLaunchConfirmationDto } from '../../src/modules/launch-confirmations/dto/create-launch-confirmation.dto';
import { LaunchConfirmationsController } from '../../src/modules/launch-confirmations/controllers/launch-confirmations.controller';
import { LaunchConfirmationsService } from '../../src/modules/launch-confirmations/services/launch-confirmations.service';
import { CreateSellInReportDto } from '../../src/modules/sell-in-reports/dto/create-sell-in-report.dto';
import { SellInReportsController } from '../../src/modules/sell-in-reports/controllers/sell-in-reports.controller';
import { SellInReportsService } from '../../src/modules/sell-in-reports/services/sell-in-reports.service';
import { UsersRepository } from '../../src/modules/users/repositories/users.repository';
import { CreateWeeklyFeedbackLogDto } from '../../src/modules/weekly-feedback-logs/dto/create-weekly-feedback-log.dto';
import { WeeklyFeedbackLogsController } from '../../src/modules/weekly-feedback-logs/controllers/weekly-feedback-logs.controller';
import { WeeklyFeedbackLogsService } from '../../src/modules/weekly-feedback-logs/services/weekly-feedback-logs.service';
import {
  createDay30ReviewRecord,
  createLaunchConfirmationRecord,
  createSellInReportRecord,
  createUserRecord,
  createWeeklyFeedbackLogRecord,
  testIds,
} from '../helpers/fixtures';
import {
  createExecutionContext,
  createHttpTestApp,
  createValidationPipe,
} from '../helpers/create-http-test-app';

const paginationQuery = { limit: 20, page: 1 };

describe('Stage 4 modules wiring (e2e)', () => {
  let app: Awaited<ReturnType<typeof createHttpTestApp>>['app'];
  let launchConfirmationsController: LaunchConfirmationsController;
  let sellInReportsController: SellInReportsController;
  let weeklyFeedbackLogsController: WeeklyFeedbackLogsController;
  let day30ReviewsController: Day30ReviewsController;
  let guard: PoliciesGuard;

  const productManager = createUserRecord({ id: testIds.productOwner });
  const launchConfirmationRecord = createLaunchConfirmationRecord();
  const sellInReportRecord = createSellInReportRecord();
  const weeklyFeedbackLogRecord = createWeeklyFeedbackLogRecord();
  const day30ReviewRecord = createDay30ReviewRecord();

  before(async () => {
    const setup = await createHttpTestApp({
      controllers: [
        LaunchConfirmationsController,
        SellInReportsController,
        WeeklyFeedbackLogsController,
        Day30ReviewsController,
      ],
      providers: [
        PoliciesGuard,
        {
          provide: LaunchConfirmationsService,
          useValue: {
            create: async () => launchConfirmationRecord,
            findOne: async () => launchConfirmationRecord,
            update: async () => ({ ...launchConfirmationRecord, notes: 'Updated launch note' }),
          },
        },
        {
          provide: SellInReportsService,
          useValue: {
            create: async () => sellInReportRecord,
            findOne: async () => sellInReportRecord,
            list: async () => ({ rows: [sellInReportRecord], total: 1 }),
            update: async () => ({ ...sellInReportRecord, notes: 'Updated sell-in note' }),
          },
        },
        {
          provide: WeeklyFeedbackLogsService,
          useValue: {
            create: async () => weeklyFeedbackLogRecord,
            findOne: async () => weeklyFeedbackLogRecord,
            list: async () => ({ rows: [weeklyFeedbackLogRecord], total: 1 }),
            update: async () => ({ ...weeklyFeedbackLogRecord, summary: 'Updated feedback' }),
          },
        },
        {
          provide: Day30ReviewsService,
          useValue: {
            create: async () => day30ReviewRecord,
            findOne: async () => day30ReviewRecord,
            update: async () => ({ ...day30ReviewRecord, reviewSummary: 'Updated review' }),
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
          useValue: { assertAuthorized: async () => undefined },
        },
        {
          provide: ConfigService,
          useValue: { get: () => 'test' },
        },
      ],
    });

    app = setup.app;
    launchConfirmationsController = new LaunchConfirmationsController({
      create: async () => launchConfirmationRecord,
      findOne: async () => launchConfirmationRecord,
      update: async () => ({ ...launchConfirmationRecord, notes: 'Updated launch note' }),
    } as never);
    sellInReportsController = new SellInReportsController({
      create: async () => sellInReportRecord,
      findOne: async () => sellInReportRecord,
      list: async () => ({ rows: [sellInReportRecord], total: 1 }),
      update: async () => ({ ...sellInReportRecord, notes: 'Updated sell-in note' }),
    } as never);
    weeklyFeedbackLogsController = new WeeklyFeedbackLogsController({
      create: async () => weeklyFeedbackLogRecord,
      findOne: async () => weeklyFeedbackLogRecord,
      list: async () => ({ rows: [weeklyFeedbackLogRecord], total: 1 }),
      update: async () => ({ ...weeklyFeedbackLogRecord, summary: 'Updated feedback' }),
    } as never);
    day30ReviewsController = new Day30ReviewsController({
      create: async () => day30ReviewRecord,
      findOne: async () => day30ReviewRecord,
      update: async () => ({ ...day30ReviewRecord, reviewSummary: 'Updated review' }),
    } as never);
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

  it('applies Stage 4 validation rules', async () => {
    const pipe = createValidationPipe();

    await assert.rejects(pipe.transform({ channels: [], launchDate: '2026-05-15' }, {
      data: '',
      metatype: CreateLaunchConfirmationDto,
      type: 'body',
    }));
    await assert.rejects(pipe.transform({ accounts: [], reportPeriodEnd: '2026-05-21' }, {
      data: '',
      metatype: CreateSellInReportDto,
      type: 'body',
    }));
    await assert.rejects(pipe.transform({ items: [], summary: 'Bad', weekStartDate: '2026-05-15' }, {
      data: '',
      metatype: CreateWeeklyFeedbackLogDto,
      type: 'body',
    }));
    await assert.rejects(pipe.transform({ actionPlan: 'x', verdict: 'UNKNOWN' }, {
      data: '',
      metatype: CreateDay30ReviewDto,
      type: 'body',
    }));
  });

  it('wires Stage 4 controllers through create/read/update paths', async () => {
    await assert.doesNotReject(
      guard.canActivate(
        createExecutionContext({
          controllerClass: launchConfirmationsController,
          handlerName: 'create',
          request: {
            headers: { 'x-dev-user-id': testIds.productOwner },
            params: { productId: testIds.product },
          },
        }),
      ),
    );

    const launchResponse = await launchConfirmationsController.create(testIds.product, {
      channels: [
        {
          accountName: 'Shopee',
          channelType: ChannelType.MTO,
          isLive: true,
          issueStatus: LaunchIssueStatus.NO_ISSUE,
        },
      ],
      launchDate: '2026-05-15',
    });
    const sellInResponse = await sellInReportsController.create(testIds.product, {
      accounts: [
        {
          accountName: 'Shopee',
          channelType: ChannelType.MTO,
          sellInUnits: 10,
          sellInValue: '2000.00',
        },
      ],
      reportPeriodEnd: '2026-05-21',
      reportPeriodStart: '2026-05-15',
    });
    const feedbackResponse = await weeklyFeedbackLogsController.create(testIds.product, {
      items: [
        {
          feedback: 'Positive launch response',
          isResolved: true,
          severity: FeedbackSeverity.LOW,
          source: FeedbackSource.MARKETING,
        },
      ],
      summary: 'Good',
      weekStartDate: '2026-05-15',
    });
    const day30Response = await day30ReviewsController.create(testIds.product, {
      actionPlan: 'Continue',
      actualRevenue: '100.00',
      actualSellThroughUnits: 10,
      channelGp: [{ actualGpPercent: '30.00', channelType: ChannelType.MTO }],
      reviewSummary: 'Good',
      targetRevenue: '100.00',
      targetSellThroughUnits: 10,
      verdict: Day30Verdict.CONTINUE,
    });

    assert.equal(launchResponse.id, launchConfirmationRecord.id);
    assert.equal(sellInResponse.id, sellInReportRecord.id);
    assert.equal(feedbackResponse.id, weeklyFeedbackLogRecord.id);
    assert.equal(day30Response.id, day30ReviewRecord.id);
    assert.equal((await sellInReportsController.list(testIds.product, paginationQuery)).data.length, 1);
    assert.equal((await weeklyFeedbackLogsController.list(testIds.product, paginationQuery)).data.length, 1);
    assert.equal((await day30ReviewsController.update(testIds.product, { reviewSummary: 'Updated review' })).reviewSummary, 'Updated review');
  });
});
