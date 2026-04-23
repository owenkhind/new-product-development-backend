import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductsRepository } from '../../products/repositories/products.repository';
import type {
  CreateBusinessCaseChannelGpSummaryDto,
  CreateBusinessCaseDto,
} from '../dto/create-business-case.dto';
import type { UpdateBusinessCaseDto } from '../dto/update-business-case.dto';
import { BusinessCasesRepository } from '../repositories/business-cases.repository';
import type {
  BusinessCaseChannelGpSummaryRecord,
  BusinessCaseRecord,
} from '../types/business-case-record.type';

@Injectable()
export class BusinessCasesService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly businessCasesRepository: BusinessCasesRepository,
  ) {}

  async create(productId: string, input: CreateBusinessCaseDto): Promise<BusinessCaseRecord> {
    await this.assertStageTwoEditable(productId);

    const existingRecord = await this.businessCasesRepository.findByProductId(productId);

    if (existingRecord) {
      throw new ConflictException({
        code: 'BUSINESS_CASE_ALREADY_EXISTS',
        message: `Business case already exists for product ${productId}.`,
      });
    }

    return this.businessCasesRepository.create({
      channelGpSummary: this.mapChannelGpSummary(input.channelGpSummary),
      commercialNotes: input.commercialNotes ?? null,
      financeNotes: input.financeNotes ?? null,
      id: randomUUID(),
      investmentNeeded: input.investmentNeeded,
      marketOpportunitySummary: input.marketOpportunitySummary,
      productId,
      productSummary: input.productSummary,
      recommendation: input.recommendation,
      riskSummary: input.riskSummary,
      yearOneRevenue: input.yearOneRevenue,
      yearThreeRevenue: input.yearThreeRevenue,
      yearTwoRevenue: input.yearTwoRevenue,
    });
  }

  async findOne(productId: string): Promise<BusinessCaseRecord> {
    const record = await this.businessCasesRepository.findByProductId(productId);

    if (!record) {
      throw new NotFoundException({
        code: 'BUSINESS_CASE_NOT_FOUND',
        message: `Business case for product ${productId} was not found.`,
      });
    }

    return record;
  }

  async update(productId: string, input: UpdateBusinessCaseDto): Promise<BusinessCaseRecord> {
    await this.assertStageTwoEditable(productId);

    const existingRecord = await this.businessCasesRepository.findByProductId(productId);

    if (!existingRecord) {
      throw new NotFoundException({
        code: 'BUSINESS_CASE_NOT_FOUND',
        message: `Business case for product ${productId} was not found.`,
      });
    }

    const updatedRecord = await this.businessCasesRepository.update(productId, {
      channelGpSummary: input.channelGpSummary
        ? this.mapChannelGpSummary(input.channelGpSummary)
        : undefined,
      commercialNotes: input.commercialNotes,
      financeNotes: input.financeNotes,
      investmentNeeded: input.investmentNeeded,
      marketOpportunitySummary: input.marketOpportunitySummary,
      productSummary: input.productSummary,
      recommendation: input.recommendation,
      riskSummary: input.riskSummary,
      yearOneRevenue: input.yearOneRevenue,
      yearThreeRevenue: input.yearThreeRevenue,
      yearTwoRevenue: input.yearTwoRevenue,
    });

    if (!updatedRecord) {
      throw new NotFoundException({
        code: 'BUSINESS_CASE_NOT_FOUND',
        message: `Business case for product ${productId} was not found.`,
      });
    }

    return updatedRecord;
  }

  private async assertStageTwoEditable(productId: string): Promise<void> {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${productId} was not found.`,
      });
    }

    if (product.currentStage !== ProductStage.STAGE_2) {
      throw new ConflictException({
        code: 'STAGE_TWO_TEMPLATE_LOCKED',
        message: `Stage 2 templates can only be edited while product ${productId} is in Stage 2.`,
      });
    }
  }

  private mapChannelGpSummary(
    items: CreateBusinessCaseChannelGpSummaryDto[],
  ): BusinessCaseChannelGpSummaryRecord[] {
    return items.map((item) => ({
      channelName: item.channelName,
      expectedGpPercent: item.expectedGpPercent,
      notes: item.notes ?? null,
    }));
  }
}
