import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductsRepository } from '../../products/repositories/products.repository';
import type {
  CreateCompetitorMatrixDto,
  CreateCompetitorMatrixEntryDto,
} from '../dto/create-competitor-matrix.dto';
import type { UpdateCompetitorMatrixDto } from '../dto/update-competitor-matrix.dto';
import { CompetitorMatricesRepository } from '../repositories/competitor-matrices.repository';
import type {
  CompetitorMatrixEntryRecord,
  CompetitorMatrixRecord,
} from '../types/competitor-matrix-record.type';

@Injectable()
export class CompetitorMatricesService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly competitorMatricesRepository: CompetitorMatricesRepository,
  ) {}

  async create(productId: string, input: CreateCompetitorMatrixDto): Promise<CompetitorMatrixRecord> {
    await this.assertProductStageIsEditable(productId);

    const existingRecord = await this.competitorMatricesRepository.findByProductId(productId);

    if (existingRecord) {
      throw new ConflictException({
        code: 'COMPETITOR_MATRIX_ALREADY_EXISTS',
        message: `Competitor matrix already exists for product ${productId}.`,
      });
    }

    return this.competitorMatricesRepository.create({
      entries: this.mapEntries(input.entries),
      id: randomUUID(),
      productId,
      scoringMethodology: input.scoringMethodology,
      summary: input.summary ?? null,
    });
  }

  async findOne(productId: string): Promise<CompetitorMatrixRecord> {
    const record = await this.competitorMatricesRepository.findByProductId(productId);

    if (!record) {
      throw new NotFoundException({
        code: 'COMPETITOR_MATRIX_NOT_FOUND',
        message: `Competitor matrix for product ${productId} was not found.`,
      });
    }

    return record;
  }

  async update(productId: string, input: UpdateCompetitorMatrixDto): Promise<CompetitorMatrixRecord> {
    await this.assertProductStageIsEditable(productId);

    const existingRecord = await this.competitorMatricesRepository.findByProductId(productId);

    if (!existingRecord) {
      throw new NotFoundException({
        code: 'COMPETITOR_MATRIX_NOT_FOUND',
        message: `Competitor matrix for product ${productId} was not found.`,
      });
    }

    const updatedRecord = await this.competitorMatricesRepository.update(productId, {
      entries: input.entries ? this.mapEntries(input.entries) : undefined,
      scoringMethodology: input.scoringMethodology,
      summary: input.summary,
    });

    if (!updatedRecord) {
      throw new NotFoundException({
        code: 'COMPETITOR_MATRIX_NOT_FOUND',
        message: `Competitor matrix for product ${productId} was not found.`,
      });
    }

    return updatedRecord;
  }

  private async assertProductStageIsEditable(productId: string): Promise<void> {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${productId} was not found.`,
      });
    }

    if (product.currentStage !== ProductStage.STAGE_1) {
      throw new ConflictException({
        code: 'STAGE_ONE_TEMPLATE_LOCKED',
        message: `Stage 1 templates can only be edited while product ${productId} is in Stage 1.`,
      });
    }
  }

  private mapEntries(entries: CreateCompetitorMatrixEntryDto[]): CompetitorMatrixEntryRecord[] {
    return entries.map((entry) => ({
      brandName: entry.brandName,
      competitorName: entry.competitorName,
      designScore: entry.designScore,
      featureScore: entry.featureScore,
      id: randomUUID(),
      modelName: entry.modelName,
      overallScore: entry.overallScore,
      price: entry.price,
      strengths: [...new Set(entry.strengths)],
      valueScore: entry.valueScore,
      weaknesses: [...new Set(entry.weaknesses)],
    }));
  }
}
