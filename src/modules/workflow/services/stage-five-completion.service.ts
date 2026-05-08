import { BadRequestException, Injectable } from '@nestjs/common';

import { ProductScorecardClass } from '../../../enums/product-scorecard-class.enum';
import { RevampEolDecision } from '../../../enums/revamp-eol-decision.enum';
import { RevampEolRecommendationOutcome } from '../../../enums/revamp-eol-recommendation-outcome.enum';
import { PortfolioUpdatesRepository } from '../../portfolio-updates/repositories/portfolio-updates.repository';
import { ProductScorecardsRepository } from '../../product-scorecards/repositories/product-scorecards.repository';
import { RevampEolRecommendationsRepository } from '../../revamp-eol-recommendations/repositories/revamp-eol-recommendations.repository';

@Injectable()
export class StageFiveCompletionService {
  constructor(
    private readonly productScorecardsRepository: ProductScorecardsRepository,
    private readonly portfolioUpdatesRepository: PortfolioUpdatesRepository,
    private readonly revampEolRecommendationsRepository: RevampEolRecommendationsRepository,
  ) {}

  async assertReadyForStageFiveSubmission(productId: string): Promise<void> {
    const { latestScorecard, portfolioUpdate, recommendation } =
      await this.loadStageFiveRecords(productId);
    const missingRequirements: string[] = [];

    if (!latestScorecard) missingRequirements.push('product_scorecard');
    if (!portfolioUpdate) missingRequirements.push('portfolio_update');
    if (!recommendation) missingRequirements.push('revamp_eol_recommendation');

    if (missingRequirements.length === 0) {
      return;
    }

    throw new BadRequestException({
      code: 'STAGE_FIVE_SUBMISSION_INCOMPLETE',
      message:
        'Stage 5 is incomplete and cannot be submitted for lifecycle review.',
      details: {
        missingRequirements,
      },
    });
  }

  async assertReadyForStageFiveApproval(productId: string): Promise<void> {
    const { latestScorecard, portfolioUpdate, recommendation } =
      await this.loadStageFiveRecords(productId);
    const missingRequirements: string[] = [];

    if (!latestScorecard) missingRequirements.push('product_scorecard');
    if (!portfolioUpdate) missingRequirements.push('portfolio_update');
    if (!recommendation) missingRequirements.push('revamp_eol_recommendation');
    if (
      latestScorecard?.classification === ProductScorecardClass.C &&
      recommendation?.recommendationOutcome ===
        RevampEolRecommendationOutcome.HOLD
    ) {
      missingRequirements.push('c_class_requires_revamp_or_eol');
    }
    if (
      recommendation?.recommendationOutcome ===
        RevampEolRecommendationOutcome.EOL &&
      recommendation.cooDecision !== RevampEolDecision.APPROVED
    ) {
      missingRequirements.push('approved_eol_recommendation');
    }

    if (missingRequirements.length === 0) {
      return;
    }

    throw new BadRequestException({
      code: 'STAGE_FIVE_APPROVAL_INCOMPLETE',
      message: 'Stage 5 is incomplete and cannot advance to EOL execution.',
      details: {
        classification: latestScorecard?.classification ?? null,
        missingRequirements,
        recommendationOutcome: recommendation?.recommendationOutcome ?? null,
      },
    });
  }

  private async loadStageFiveRecords(productId: string) {
    const [scorecards, portfolioUpdates, recommendation] = await Promise.all([
      this.productScorecardsRepository.listLatestByProductId(productId, 1),
      this.portfolioUpdatesRepository.list({
        limit: 50,
        offset: 0,
      }),
      this.revampEolRecommendationsRepository.findByProductId(productId),
    ]);
    const portfolioUpdate =
      portfolioUpdates.rows.find((update) =>
        update.rows.some((row) => row.productId === productId),
      ) ?? null;

    return {
      latestScorecard: scorecards[0] ?? null,
      portfolioUpdate,
      recommendation,
    };
  }
}
