import { BadRequestException, Injectable } from '@nestjs/common';

import { CompetitorMatricesRepository } from '../../competitor-matrices/repositories/competitor-matrices.repository';
import { MarketSizingRepository } from '../../market-sizing/repositories/market-sizing.repository';
import { OpportunityBriefsRepository } from '../../opportunity-briefs/repositories/opportunity-briefs.repository';
import { STAGE_ONE_MINIMUM_ART_TOTAL_SCORE } from '../constants/stage-one-art.constants';

@Injectable()
export class StageOneCompletionService {
  constructor(
    private readonly opportunityBriefsRepository: OpportunityBriefsRepository,
    private readonly marketSizingRepository: MarketSizingRepository,
    private readonly competitorMatricesRepository: CompetitorMatricesRepository,
  ) {}

  async assertReadyForGateOne(productId: string): Promise<void> {
    const [opportunityBrief, marketSizing, competitorMatrix] = await Promise.all([
      this.opportunityBriefsRepository.findByProductId(productId),
      this.marketSizingRepository.findByProductId(productId),
      this.competitorMatricesRepository.findByProductId(productId),
    ]);

    const missingRequirements: string[] = [];

    if (!opportunityBrief) {
      missingRequirements.push('opportunity_brief');
    }

    if (!marketSizing) {
      missingRequirements.push('market_sizing');
    }

    if (!competitorMatrix) {
      missingRequirements.push('competitor_matrix');
    }

    if (opportunityBrief) {
      if (!opportunityBrief.requiredDocumentsComplete) {
        missingRequirements.push('required_documents_complete');
      }

      if (opportunityBrief.artTotalScore < STAGE_ONE_MINIMUM_ART_TOTAL_SCORE) {
        missingRequirements.push('minimum_art_score');
      }
    }

    if (marketSizing && marketSizing.dataSources.length === 0) {
      missingRequirements.push('market_sizing_data_sources');
    }

    if (competitorMatrix && competitorMatrix.entries.length < 3) {
      missingRequirements.push('minimum_competitors');
    }

    if (missingRequirements.length === 0) {
      return;
    }

    throw new BadRequestException({
      code: 'STAGE_ONE_REQUIREMENTS_INCOMPLETE',
      message: 'Stage 1 is incomplete and cannot progress through Gate 1.',
      details: {
        artScoreThresholdAssumption: `${STAGE_ONE_MINIMUM_ART_TOTAL_SCORE}/18`,
        competitorCount: competitorMatrix?.entries.length ?? 0,
        marketSizingDataSourceCount: marketSizing?.dataSources.length ?? 0,
        missingRequirements,
        recordedArtTotalScore: opportunityBrief?.artTotalScore ?? null,
      },
    });
  }
}
