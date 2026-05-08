import { BadRequestException, Injectable } from '@nestjs/common';

import { Day30PerformanceFlag } from '../../../enums/day-30-performance-flag.enum';
import { Day30ReviewsRepository } from '../../day-30-reviews/repositories/day-30-reviews.repository';
import { LaunchConfirmationsRepository } from '../../launch-confirmations/repositories/launch-confirmations.repository';
import { SellInReportsRepository } from '../../sell-in-reports/repositories/sell-in-reports.repository';
import { WeeklyFeedbackLogsRepository } from '../../weekly-feedback-logs/repositories/weekly-feedback-logs.repository';

const REQUIRED_LIVE_LISTINGS = 3;
const REQUIRED_WEEKLY_FEEDBACK_LOGS = 4;
const DEFAULT_GP_FLOOR_PERCENT = 30;

@Injectable()
export class StageFourCompletionService {
  constructor(
    private readonly launchConfirmationsRepository: LaunchConfirmationsRepository,
    private readonly sellInReportsRepository: SellInReportsRepository,
    private readonly weeklyFeedbackLogsRepository: WeeklyFeedbackLogsRepository,
    private readonly day30ReviewsRepository: Day30ReviewsRepository,
  ) {}

  async assertReadyForStageFourSubmission(productId: string): Promise<void> {
    const {
      day30Review,
      latestSellInReport,
      launchConfirmation,
      weeklyFeedbackLogs,
    } = await this.loadStageFourRecords(productId);
    const missingRequirements: string[] = [];

    if (!launchConfirmation) missingRequirements.push('launch_confirmation');
    if (!latestSellInReport) missingRequirements.push('sell_in_report');
    if (weeklyFeedbackLogs.length === 0)
      missingRequirements.push('weekly_feedback_log');
    if (!day30Review) missingRequirements.push('day_30_review');

    if (missingRequirements.length === 0) {
      return;
    }

    throw new BadRequestException({
      code: 'STAGE_FOUR_SUBMISSION_INCOMPLETE',
      message:
        'Stage 4 is incomplete and cannot be submitted for lifecycle review.',
      details: {
        missingRequirements,
      },
    });
  }

  async assertReadyForStageFourApproval(productId: string): Promise<void> {
    const {
      day30Review,
      latestSellInReport,
      launchConfirmation,
      weeklyFeedbackLogs,
    } = await this.loadStageFourRecords(productId);
    const missingRequirements: string[] = [];
    const liveListingCount =
      launchConfirmation?.channels.filter((channel) => channel.isLive).length ??
      0;
    const day30FailedGpRows =
      day30Review?.channelGp.filter(
        (row) => Number(row.actualGpPercent) < DEFAULT_GP_FLOOR_PERCENT,
      ) ?? [];
    const day30Flags = day30Review?.flags ?? [];

    if (!launchConfirmation) missingRequirements.push('launch_confirmation');
    if (!latestSellInReport) missingRequirements.push('sell_in_report');
    if (weeklyFeedbackLogs.length === 0)
      missingRequirements.push('weekly_feedback_log');
    if (!day30Review) missingRequirements.push('day_30_review');
    if (launchConfirmation && liveListingCount < REQUIRED_LIVE_LISTINGS) {
      missingRequirements.push('minimum_live_listings');
    }
    if (weeklyFeedbackLogs.length < REQUIRED_WEEKLY_FEEDBACK_LOGS) {
      missingRequirements.push('minimum_weekly_feedback_logs');
    }
    if (
      day30FailedGpRows.length > 0 ||
      day30Flags.includes(Day30PerformanceFlag.GP_ISSUE)
    ) {
      missingRequirements.push('day_30_gp_floor_passed');
    }
    if (day30Flags.includes(Day30PerformanceFlag.HALT_PO_REQUIRED)) {
      missingRequirements.push('halt_po_resolved');
    }

    if (missingRequirements.length === 0) {
      return;
    }

    throw new BadRequestException({
      code: 'STAGE_FOUR_APPROVAL_INCOMPLETE',
      message: 'Stage 4 is incomplete and cannot advance to portfolio review.',
      details: {
        day30FailedGpChannels: day30FailedGpRows.map((row) => row.channelType),
        liveListingCount,
        missingRequirements,
        weeklyFeedbackLogCount: weeklyFeedbackLogs.length,
      },
    });
  }

  private async loadStageFourRecords(productId: string) {
    const [launchConfirmation, sellInReports, weeklyFeedbackLogs, day30Review] =
      await Promise.all([
        this.launchConfirmationsRepository.findByProductId(productId),
        this.sellInReportsRepository.listByProductId({
          limit: 1,
          offset: 0,
          productId,
        }),
        this.weeklyFeedbackLogsRepository.listByProductId({
          limit: REQUIRED_WEEKLY_FEEDBACK_LOGS,
          offset: 0,
          productId,
        }),
        this.day30ReviewsRepository.findByProductId(productId),
      ]);

    return {
      day30Review,
      latestSellInReport: sellInReports.rows[0] ?? null,
      launchConfirmation,
      weeklyFeedbackLogs: weeklyFeedbackLogs.rows,
    };
  }
}
