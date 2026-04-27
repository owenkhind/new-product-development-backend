import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

import { ChannelType } from '../../src/enums/channel-type.enum';
import { Day30PerformanceFlag } from '../../src/enums/day-30-performance-flag.enum';
import { Day30Verdict } from '../../src/enums/day-30-verdict.enum';
import { FeedbackSeverity } from '../../src/enums/feedback-severity.enum';
import { FeedbackSource } from '../../src/enums/feedback-source.enum';
import { LaunchIssueStatus } from '../../src/enums/launch-issue-status.enum';
import { ProductStage } from '../../src/enums/product-stage.enum';
import { Day30ReviewsController } from '../../src/modules/day-30-reviews/controllers/day-30-reviews.controller';
import { Day30ReviewsService } from '../../src/modules/day-30-reviews/services/day-30-reviews.service';
import { LaunchConfirmationsController } from '../../src/modules/launch-confirmations/controllers/launch-confirmations.controller';
import { LaunchConfirmationsService } from '../../src/modules/launch-confirmations/services/launch-confirmations.service';
import { SellInReportsController } from '../../src/modules/sell-in-reports/controllers/sell-in-reports.controller';
import { SellInReportsService } from '../../src/modules/sell-in-reports/services/sell-in-reports.service';
import { WeeklyFeedbackLogsController } from '../../src/modules/weekly-feedback-logs/controllers/weekly-feedback-logs.controller';
import { WeeklyFeedbackLogsService } from '../../src/modules/weekly-feedback-logs/services/weekly-feedback-logs.service';
import {
  createDay30ReviewRecord,
  createLaunchConfirmationRecord,
  createProductRecord,
  createSellInReportRecord,
  createWeeklyFeedbackLogRecord,
  testIds,
} from '../helpers/fixtures';

describe('LaunchConfirmationsController', () => {
  const record = createLaunchConfirmationRecord();

  it('maps create, get, and update responses', async () => {
    const controller = new LaunchConfirmationsController({
      create: async () => record,
      findOne: async () => record,
      update: async () => ({ ...record, notes: 'Updated launch note' }),
    } as never);

    const response = await controller.create(testIds.product, {
      channels: record.channels.map((channel) => ({
        accountName: channel.accountName,
        channelType: channel.channelType,
        goLiveAt: channel.goLiveAt ?? undefined,
        isLive: channel.isLive,
        issueStatus: channel.issueStatus,
        issueSummary: channel.issueSummary ?? undefined,
        listingUrl: channel.listingUrl ?? undefined,
      })),
      launchDate: record.launchDate,
      notes: record.notes ?? undefined,
    });

    assert.equal(response.id, record.id);
    assert.equal((await controller.findOne(testIds.product)).channels.length, 2);
    assert.equal((await controller.update(testIds.product, { notes: 'Updated launch note' })).notes, 'Updated launch note');
  });
});

describe('LaunchConfirmationsService', () => {
  function createService(options?: {
    existingRecord?: ReturnType<typeof createLaunchConfirmationRecord> | null;
    product?: ReturnType<typeof createProductRecord> | null;
  }): LaunchConfirmationsService {
    const product = options?.product === undefined
      ? createProductRecord({ currentStage: ProductStage.STAGE_4 })
      : options.product;
    const existingRecord = options?.existingRecord === undefined ? null : options.existingRecord;

    return new LaunchConfirmationsService(
      { findById: async () => product } as never,
      {
        create: async () => createLaunchConfirmationRecord(),
        findByProductId: async () => existingRecord,
        update: async (_productId: string, input: { notes?: string }) =>
          createLaunchConfirmationRecord({ notes: input.notes ?? existingRecord?.notes ?? null }),
      } as never,
    );
  }

  it('creates launch confirmations and detects blocked channels', async () => {
    const record = createLaunchConfirmationRecord({
      channels: [
        {
          ...createLaunchConfirmationRecord().channels[0]!,
          isLive: false,
          issueStatus: LaunchIssueStatus.BLOCKED,
        },
      ],
    });

    assert.equal(LaunchConfirmationsService.getBlockedChannels(record).length, 1);
    assert.equal((await createService().create(testIds.product, {
      channels: createLaunchConfirmationRecord().channels.map((channel) => ({
        accountName: channel.accountName,
        channelType: channel.channelType,
        isLive: channel.isLive,
        issueStatus: channel.issueStatus,
      })),
      launchDate: '2026-05-15',
    })).productId, testIds.product);
  });

  it('rejects duplicate, missing-product, locked-stage, and missing update cases', async () => {
    await assert.rejects(
      createService({ existingRecord: createLaunchConfirmationRecord() }).create(testIds.product, {
        channels: [
          {
            accountName: 'Shopee',
            channelType: ChannelType.MTO,
            isLive: true,
            issueStatus: LaunchIssueStatus.NO_ISSUE,
          },
        ],
        launchDate: '2026-05-15',
      }),
      ConflictException,
    );
    await assert.rejects(
      createService({ product: null }).create(testIds.product, {
        channels: [
          {
            accountName: 'Shopee',
            channelType: ChannelType.MTO,
            isLive: true,
            issueStatus: LaunchIssueStatus.NO_ISSUE,
          },
        ],
        launchDate: '2026-05-15',
      }),
      NotFoundException,
    );
    await assert.rejects(
      createService({ product: createProductRecord({ currentStage: ProductStage.STAGE_3 }) }).create(
        testIds.product,
        {
          channels: [
            {
              accountName: 'Shopee',
              channelType: ChannelType.MTO,
              isLive: true,
              issueStatus: LaunchIssueStatus.NO_ISSUE,
            },
          ],
          launchDate: '2026-05-15',
        },
      ),
      ConflictException,
    );
    await assert.rejects(createService({ existingRecord: null }).update(testIds.product, {}), NotFoundException);
  });
});

describe('SellInReportsController', () => {
  const record = createSellInReportRecord();

  it('maps create, list, get, and update responses', async () => {
    const controller = new SellInReportsController({
      create: async () => record,
      findOne: async () => record,
      list: async () => [record],
      update: async () => ({ ...record, notes: 'Updated sell-in note' }),
    } as never);

    const response = await controller.create(testIds.product, {
      accounts: record.accounts.map((account) => ({
        accountName: account.accountName,
        channelType: account.channelType,
        declineReason: account.declineReason ?? undefined,
        sellInUnits: account.sellInUnits,
        sellInValue: account.sellInValue,
      })),
      reportPeriodEnd: record.reportPeriodEnd,
      reportPeriodStart: record.reportPeriodStart,
    });

    assert.equal(response.totalSellInUnits, 200);
    assert.equal((await controller.list(testIds.product)).length, 1);
    assert.equal((await controller.findOne(testIds.product, record.id)).id, record.id);
    assert.equal((await controller.update(testIds.product, record.id, { notes: 'Updated sell-in note' })).notes, 'Updated sell-in note');
  });
});

describe('SellInReportsService', () => {
  function createService(options?: {
    existingRecord?: ReturnType<typeof createSellInReportRecord> | null;
    product?: ReturnType<typeof createProductRecord> | null;
  }): SellInReportsService {
    const product = options?.product === undefined
      ? createProductRecord({ currentStage: ProductStage.STAGE_4 })
      : options.product;
    const existingRecord = options?.existingRecord === undefined ? createSellInReportRecord() : options.existingRecord;

    return new SellInReportsService(
      { findById: async () => product } as never,
      {
        create: async (input: { totalSellInUnits: number; totalSellInValue: string }) =>
          createSellInReportRecord({
            totalSellInUnits: input.totalSellInUnits,
            totalSellInValue: input.totalSellInValue,
          }),
        findById: async () => existingRecord,
        listByProductId: async () => (existingRecord ? [existingRecord] : []),
        update: async (_productId: string, _reportId: string, input: { notes?: string }) =>
          existingRecord ? createSellInReportRecord({ notes: input.notes ?? existingRecord.notes }) : null,
      } as never,
    );
  }

  it('calculates sell-in totals and supports recurring report reads', async () => {
    const record = await createService().create(testIds.product, {
      accounts: [
        {
          accountName: 'A',
          channelType: ChannelType.MTO,
          sellInUnits: 5,
          sellInValue: '100.00',
        },
        {
          accountName: 'B',
          channelType: ChannelType.MM,
          sellInUnits: 7,
          sellInValue: '140.00',
        },
      ],
      reportPeriodEnd: '2026-05-21',
      reportPeriodStart: '2026-05-15',
    });

    assert.equal(record.totalSellInUnits, 12);
    assert.equal(record.totalSellInValue, '240.00');
    assert.equal((await createService().list(testIds.product)).length, 1);
  });

  it('rejects locked-stage, missing product, and missing update cases', async () => {
    await assert.rejects(
      createService({ product: createProductRecord({ currentStage: ProductStage.STAGE_3 }) }).create(
        testIds.product,
        {
          accounts: [
            {
              accountName: 'A',
              channelType: ChannelType.MTO,
              sellInUnits: 1,
              sellInValue: '1.00',
            },
          ],
          reportPeriodEnd: '2026-05-21',
          reportPeriodStart: '2026-05-15',
        },
      ),
      BadRequestException,
    );
    await assert.rejects(createService({ product: null }).list(testIds.product), NotFoundException);
    await assert.rejects(createService({ existingRecord: null }).update(testIds.product, testIds.gateDecision, {}), NotFoundException);
  });
});

describe('WeeklyFeedbackLogsService', () => {
  function createService(options?: {
    existingRecord?: ReturnType<typeof createWeeklyFeedbackLogRecord> | null;
    product?: ReturnType<typeof createProductRecord> | null;
  }): WeeklyFeedbackLogsService {
    const product = options?.product === undefined
      ? createProductRecord({ currentStage: ProductStage.STAGE_4 })
      : options.product;
    const existingRecord = options?.existingRecord === undefined ? createWeeklyFeedbackLogRecord() : options.existingRecord;

    return new WeeklyFeedbackLogsService(
      { findById: async () => product } as never,
      {
        create: async () => createWeeklyFeedbackLogRecord(),
        findById: async () => existingRecord,
        listByProductId: async () => (existingRecord ? [existingRecord] : []),
        update: async (_productId: string, _logId: string, input: { summary?: string }) =>
          existingRecord ? createWeeklyFeedbackLogRecord({ summary: input.summary ?? existingRecord.summary }) : null,
      } as never,
    );
  }

  it('creates and reads weekly feedback logs with critical issue detection', async () => {
    const criticalRecord = createWeeklyFeedbackLogRecord({
      items: [
        {
          ...createWeeklyFeedbackLogRecord().items[0]!,
          isResolved: false,
          severity: FeedbackSeverity.CRITICAL,
          source: FeedbackSource.KD_AFTER_SALES,
        },
      ],
    });

    assert.equal(WeeklyFeedbackLogsService.getUnresolvedCriticalItems(criticalRecord).length, 1);
    assert.equal((await createService().create(testIds.product, {
      items: [
        {
          feedback: 'Complaint volume low',
          isResolved: true,
          severity: FeedbackSeverity.LOW,
          source: FeedbackSource.MARKETING,
        },
      ],
      summary: 'Good',
      weekStartDate: '2026-05-15',
    })).productId, testIds.product);
    assert.equal((await createService().list(testIds.product)).length, 1);
  });

  it('rejects locked-stage, missing product, and missing update cases', async () => {
    await assert.rejects(
      createService({ product: createProductRecord({ currentStage: ProductStage.STAGE_3 }) }).create(
        testIds.product,
        {
          items: [
            {
              feedback: 'Issue',
              isResolved: false,
              severity: FeedbackSeverity.HIGH,
              source: FeedbackSource.DEALER,
            },
          ],
          summary: 'Issue',
          weekStartDate: '2026-05-15',
        },
      ),
      BadRequestException,
    );
    await assert.rejects(createService({ product: null }).list(testIds.product), NotFoundException);
    await assert.rejects(createService({ existingRecord: null }).update(testIds.product, testIds.gateDecision, {}), NotFoundException);
  });
});

describe('Day30ReviewsController', () => {
  const record = createDay30ReviewRecord();

  it('maps create, get, and update responses', async () => {
    const controller = new Day30ReviewsController({
      create: async () => record,
      findOne: async () => record,
      update: async () => ({ ...record, reviewSummary: 'Updated review' }),
    } as never);

    const response = await controller.create(testIds.product, {
      actionPlan: record.actionPlan,
      actualRevenue: record.actualRevenue,
      actualSellThroughUnits: record.actualSellThroughUnits,
      channelGp: record.channelGp.map((row) => ({
        actualGpPercent: row.actualGpPercent,
        channelType: row.channelType,
      })),
      reviewSummary: record.reviewSummary,
      targetRevenue: record.targetRevenue,
      targetSellThroughUnits: record.targetSellThroughUnits,
      verdict: record.verdict,
    });

    assert.equal(response.id, record.id);
    assert.equal((await controller.findOne(testIds.product)).flags[0], Day30PerformanceFlag.ON_TRACK);
    assert.equal((await controller.update(testIds.product, { reviewSummary: 'Updated review' })).reviewSummary, 'Updated review');
  });
});

describe('Day30ReviewsService', () => {
  function createService(options?: {
    existingRecord?: ReturnType<typeof createDay30ReviewRecord> | null;
    product?: ReturnType<typeof createProductRecord> | null;
  }): Day30ReviewsService {
    const product = options?.product === undefined
      ? createProductRecord({ currentStage: ProductStage.STAGE_4 })
      : options.product;
    const existingRecord = options?.existingRecord === undefined ? null : options.existingRecord;

    return new Day30ReviewsService(
      { findById: async () => product } as never,
      {
        create: async (input: { flags: Day30PerformanceFlag[] }) =>
          createDay30ReviewRecord({ flags: input.flags }),
        findByProductId: async () => existingRecord,
        update: async (_productId: string, input: { flags?: Day30PerformanceFlag[] }) =>
          existingRecord ? createDay30ReviewRecord({ flags: input.flags ?? existingRecord.flags }) : null,
      } as never,
    );
  }

  it('calculates on-track, below-target, significant, and GP issue flags', async () => {
    const onTrack = await createService().create(testIds.product, {
      actionPlan: 'Continue',
      actualRevenue: '100.00',
      actualSellThroughUnits: 10,
      channelGp: [{ actualGpPercent: '30.00', channelType: ChannelType.MTO }],
      reviewSummary: 'Good',
      targetRevenue: '100.00',
      targetSellThroughUnits: 10,
      verdict: Day30Verdict.CONTINUE,
    });
    assert.deepEqual(onTrack.flags, [Day30PerformanceFlag.ON_TRACK]);

    const troubled = await createService().create(testIds.product, {
      actionPlan: 'Escalate',
      actualRevenue: '40.00',
      actualSellThroughUnits: 4,
      channelGp: [{ actualGpPercent: '10.00', channelType: ChannelType.MTO }],
      reviewSummary: 'Weak launch',
      targetRevenue: '100.00',
      targetSellThroughUnits: 10,
      verdict: Day30Verdict.HOLD_PO,
    });
    assert.deepEqual(troubled.flags, [
      Day30PerformanceFlag.BELOW_TARGET,
      Day30PerformanceFlag.SIGNIFICANTLY_BELOW,
      Day30PerformanceFlag.GP_ISSUE,
      Day30PerformanceFlag.HALT_PO_REQUIRED,
    ]);
  });

  it('rejects duplicate, missing-product, locked-stage, and missing update cases', async () => {
    await assert.rejects(
      createService({ existingRecord: createDay30ReviewRecord() }).create(testIds.product, {
        actionPlan: 'Continue',
        actualRevenue: '100.00',
        actualSellThroughUnits: 10,
        channelGp: [{ actualGpPercent: '30.00', channelType: ChannelType.MTO }],
        reviewSummary: 'Good',
        targetRevenue: '100.00',
        targetSellThroughUnits: 10,
        verdict: Day30Verdict.CONTINUE,
      }),
      ConflictException,
    );
    await assert.rejects(createService({ product: null }).findOne(testIds.product), NotFoundException);
    await assert.rejects(
      createService({ product: createProductRecord({ currentStage: ProductStage.STAGE_3 }) }).create(
        testIds.product,
        {
          actionPlan: 'Continue',
          actualRevenue: '100.00',
          actualSellThroughUnits: 10,
          channelGp: [{ actualGpPercent: '30.00', channelType: ChannelType.MTO }],
          reviewSummary: 'Good',
          targetRevenue: '100.00',
          targetSellThroughUnits: 10,
          verdict: Day30Verdict.CONTINUE,
        },
      ),
      ConflictException,
    );
    await assert.rejects(createService({ existingRecord: null }).update(testIds.product, {}), NotFoundException);
  });
});
