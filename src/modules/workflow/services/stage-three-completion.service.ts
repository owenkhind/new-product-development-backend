import { BadRequestException, Injectable } from '@nestjs/common';

import { ChannelListingPlansRepository } from '../../channel-listing-plans/repositories/channel-listing-plans.repository';
import { ChannelPricingRepository } from '../../channel-pricing/repositories/channel-pricing.repository';
import { ChannelPricingService } from '../../channel-pricing/services/channel-pricing.service';
import { GtmPlansRepository } from '../../gtm-plans/repositories/gtm-plans.repository';
import { GtmPlansService } from '../../gtm-plans/services/gtm-plans.service';
import { GateThreeReviewsRepository } from '../repositories/gate-three-reviews.repository';

@Injectable()
export class StageThreeCompletionService {
  constructor(
    private readonly channelListingPlansRepository: ChannelListingPlansRepository,
    private readonly channelPricingRepository: ChannelPricingRepository,
    private readonly gtmPlansRepository: GtmPlansRepository,
    private readonly gateThreeReviewsRepository: GateThreeReviewsRepository,
  ) {}

  async assertReadyForGateThreeSubmission(productId: string): Promise<void> {
    const [channelListingPlan, channelPricing, gtmPlan] = await Promise.all([
      this.channelListingPlansRepository.findByProductId(productId),
      this.channelPricingRepository.findByProductId(productId),
      this.gtmPlansRepository.findByProductId(productId),
    ]);

    const missingRequirements: string[] = [];

    if (!channelListingPlan) {
      missingRequirements.push('channel_listing_plan');
    }

    if (!channelPricing) {
      missingRequirements.push('channel_pricing');
    }

    if (!gtmPlan) {
      missingRequirements.push('gtm_plan');
    }

    if (missingRequirements.length === 0) {
      return;
    }

    throw new BadRequestException({
      code: 'STAGE_THREE_SUBMISSION_INCOMPLETE',
      message: 'Stage 3 is incomplete and cannot be submitted for Gate 3 review.',
      details: {
        missingRequirements,
      },
    });
  }

  async assertReadyForGateThreeApproval(productId: string): Promise<void> {
    const [channelListingPlan, channelPricing, gtmPlan, gateThreeReview] = await Promise.all([
      this.channelListingPlansRepository.findByProductId(productId),
      this.channelPricingRepository.findByProductId(productId),
      this.gtmPlansRepository.findByProductId(productId),
      this.gateThreeReviewsRepository.findByProductId(productId),
    ]);

    const missingRequirements: string[] = [];
    const confirmedChannelCount =
      channelListingPlan?.channels.filter((channel) => channel.isConfirmed).length ?? 0;
    const failedGpFloorRows = channelPricing
      ? ChannelPricingService.getFailedGpFloorRows(channelPricing)
      : [];
    const unresolvedCriticalGtmItems = gtmPlan
      ? GtmPlansService.getUnresolvedCriticalItems(gtmPlan)
      : [];

    if (!channelListingPlan) {
      missingRequirements.push('channel_listing_plan');
    }

    if (!channelPricing) {
      missingRequirements.push('channel_pricing');
    }

    if (!gtmPlan) {
      missingRequirements.push('gtm_plan');
    }

    if (channelListingPlan && confirmedChannelCount < 3) {
      missingRequirements.push('minimum_confirmed_channels');
    }

    if (channelListingPlan && !channelListingPlan.shopeeConfirmed) {
      missingRequirements.push('shopee_readiness_confirmed');
    }

    if (channelListingPlan && !channelListingPlan.lazadaConfirmed) {
      missingRequirements.push('lazada_readiness_confirmed');
    }

    if (failedGpFloorRows.length > 0) {
      missingRequirements.push('gp_floor_passed');
    }

    if (channelPricing && ChannelPricingService.hasItoUndercutViolation(channelPricing)) {
      missingRequirements.push('ito_rsp_guardrail_passed');
    }

    if (unresolvedCriticalGtmItems.length > 0) {
      missingRequirements.push('critical_gtm_checklist_resolved');
    }

    if (!gateThreeReview?.financeConfirmedAt || !gateThreeReview.financeConfirmedByUserId) {
      missingRequirements.push('finance_confirmed');
    }

    if (!gateThreeReview?.marketingReviewedAt || !gateThreeReview.marketingReviewedByUserId) {
      missingRequirements.push('marketing_reviewed');
    }

    if (!gateThreeReview?.gmApprovedAt || !gateThreeReview.gmApprovedByUserId) {
      missingRequirements.push('gm_approved');
    }

    if (missingRequirements.length === 0) {
      return;
    }

    throw new BadRequestException({
      code: 'STAGE_THREE_APPROVAL_INCOMPLETE',
      message: 'Stage 3 is incomplete and cannot be approved through Gate 3.',
      details: {
        confirmedChannelCount,
        failedGpFloorRows: failedGpFloorRows.map((row) => row.channelType),
        missingRequirements,
        unresolvedCriticalGtmItemIds: unresolvedCriticalGtmItems.map((item) => item.id),
      },
    });
  }
}
