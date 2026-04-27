import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { PortfolioReviewStatus } from '../../../enums/portfolio-review-status.enum';
import type { CreatePortfolioUpdateDto, CreatePortfolioUpdateRowDto } from '../dto/create-portfolio-update.dto';
import type { UpdatePortfolioUpdateDto } from '../dto/update-portfolio-update.dto';
import { PortfolioUpdatesRepository } from '../repositories/portfolio-updates.repository';
import type { PortfolioUpdateRecord, PortfolioUpdateRowRecord } from '../types/portfolio-update-record.type';

@Injectable()
export class PortfolioUpdatesService {
  constructor(private readonly portfolioUpdatesRepository: PortfolioUpdatesRepository) {}

  async create(input: CreatePortfolioUpdateDto): Promise<PortfolioUpdateRecord> {
    return this.portfolioUpdatesRepository.create({
      cooReviewStatus: input.cooReviewStatus ?? PortfolioReviewStatus.DRAFT,
      id: randomUUID(),
      reviewQuarter: input.reviewQuarter,
      rows: this.mapRows(input.rows),
      summary: input.summary,
    });
  }

  list(): Promise<PortfolioUpdateRecord[]> {
    return this.portfolioUpdatesRepository.list();
  }

  async findOne(portfolioUpdateId: string): Promise<PortfolioUpdateRecord> {
    const record = await this.portfolioUpdatesRepository.findById(portfolioUpdateId);

    if (!record) {
      throw new NotFoundException({
        code: 'PORTFOLIO_UPDATE_NOT_FOUND',
        message: `Portfolio update ${portfolioUpdateId} was not found.`,
      });
    }

    return record;
  }

  async update(
    portfolioUpdateId: string,
    input: UpdatePortfolioUpdateDto,
  ): Promise<PortfolioUpdateRecord> {
    const updatedRecord = await this.portfolioUpdatesRepository.update(portfolioUpdateId, {
      cooReviewStatus: input.cooReviewStatus,
      reviewQuarter: input.reviewQuarter,
      rows: input.rows ? this.mapRows(input.rows) : undefined,
      summary: input.summary,
    });

    if (!updatedRecord) {
      throw new NotFoundException({
        code: 'PORTFOLIO_UPDATE_NOT_FOUND',
        message: `Portfolio update ${portfolioUpdateId} was not found.`,
      });
    }

    return updatedRecord;
  }

  private mapRows(rows: CreatePortfolioUpdateRowDto[]): PortfolioUpdateRowRecord[] {
    return rows.map((row) => ({
      actionRecommendation: row.actionRecommendation,
      classification: row.classification,
      notes: row.notes ?? null,
      productId: row.productId,
      scorecardId: row.scorecardId ?? null,
    }));
  }
}
