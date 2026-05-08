import { BadRequestException, Injectable } from '@nestjs/common';

import { ClearancePlansRepository } from '../../clearance-plans/repositories/clearance-plans.repository';
import { EolExecutionPlansRepository } from '../../eol-execution-plans/repositories/eol-execution-plans.repository';
import { RevampEolRecommendationsRepository } from '../../revamp-eol-recommendations/repositories/revamp-eol-recommendations.repository';

@Injectable()
export class StageSixCompletionService {
  constructor(
    private readonly revampEolRecommendationsRepository: RevampEolRecommendationsRepository,
    private readonly eolExecutionPlansRepository: EolExecutionPlansRepository,
    private readonly clearancePlansRepository: ClearancePlansRepository,
  ) {}

  async assertReadyForStageSixSubmission(productId: string): Promise<void> {
    const { approvedEolRecommendation, clearancePlan, eolExecutionPlan } =
      await this.loadStageSixRecords(productId);
    const missingRequirements: string[] = [];

    if (!approvedEolRecommendation)
      missingRequirements.push('approved_eol_recommendation');
    if (!eolExecutionPlan) missingRequirements.push('eol_execution_plan');
    if (!clearancePlan) missingRequirements.push('clearance_plan');

    if (missingRequirements.length === 0) {
      return;
    }

    throw new BadRequestException({
      code: 'STAGE_SIX_SUBMISSION_INCOMPLETE',
      message:
        'Stage 6 is incomplete and cannot be submitted for clearance review.',
      details: {
        missingRequirements,
      },
    });
  }

  async assertReadyForStageSixApproval(productId: string): Promise<void> {
    const { approvedEolRecommendation, clearancePlan, eolExecutionPlan } =
      await this.loadStageSixRecords(productId);
    const missingRequirements: string[] = [];
    const blockedMilestones =
      eolExecutionPlan?.milestones.filter(
        (milestone) => milestone.status !== 'COMPLETED',
      ) ?? [];
    const blockedPricingRows =
      clearancePlan?.pricingRows.filter(
        (row) =>
          !row.markdownApproved ||
          Number(row.clearanceRsp) < Number(row.floorPrice),
      ) ?? [];

    if (!approvedEolRecommendation)
      missingRequirements.push('approved_eol_recommendation');
    if (!eolExecutionPlan) missingRequirements.push('eol_execution_plan');
    if (!clearancePlan) missingRequirements.push('clearance_plan');
    if (blockedMilestones.length > 0)
      missingRequirements.push('eol_milestones_completed');
    if (blockedPricingRows.length > 0)
      missingRequirements.push('clearance_pricing_approved');

    if (missingRequirements.length === 0) {
      return;
    }

    throw new BadRequestException({
      code: 'STAGE_SIX_APPROVAL_INCOMPLETE',
      message: 'Stage 6 is incomplete and cannot close the lifecycle.',
      details: {
        blockedClearanceChannels: blockedPricingRows.map(
          (row) => row.channelType,
        ),
        blockedMilestones: blockedMilestones.map(
          (milestone) => milestone.milestoneName,
        ),
        missingRequirements,
      },
    });
  }

  private async loadStageSixRecords(productId: string) {
    const [approvedEolRecommendation, eolExecutionPlan, clearancePlan] =
      await Promise.all([
        this.revampEolRecommendationsRepository.findApprovedEolByProductId(
          productId,
        ),
        this.eolExecutionPlansRepository.findByProductId(productId),
        this.clearancePlansRepository.findByProductId(productId),
      ]);

    return {
      approvedEolRecommendation,
      clearancePlan,
      eolExecutionPlan,
    };
  }
}
