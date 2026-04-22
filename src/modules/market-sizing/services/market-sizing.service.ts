import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductsRepository } from '../../products/repositories/products.repository';
import type { CreateMarketSizingDto } from '../dto/create-market-sizing.dto';
import type { UpdateMarketSizingDto } from '../dto/update-market-sizing.dto';
import { MarketSizingRepository } from '../repositories/market-sizing.repository';
import type { MarketSizingRecord } from '../types/market-sizing-record.type';

@Injectable()
export class MarketSizingService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly marketSizingRepository: MarketSizingRepository,
  ) {}

  async create(productId: string, input: CreateMarketSizingDto): Promise<MarketSizingRecord> {
    await this.assertProductStageIsEditable(productId);

    const existingRecord = await this.marketSizingRepository.findByProductId(productId);

    if (existingRecord) {
      throw new ConflictException({
        code: 'MARKET_SIZING_ALREADY_EXISTS',
        message: `Market sizing already exists for product ${productId}.`,
      });
    }

    return this.marketSizingRepository.create({
      annualMarketSizeUnits: input.annualMarketSizeUnits,
      annualMarketSizeValue: input.annualMarketSizeValue,
      assumptions: input.assumptions ?? null,
      categoryName: input.categoryName,
      dataSources: [...new Set(input.dataSources)],
      id: randomUUID(),
      productId,
      targetPriceBand: input.targetPriceBand,
      targetSegment: input.targetSegment,
      yearOneSalesUnits: input.yearOneSalesUnits,
      yearThreeSalesUnits: input.yearThreeSalesUnits,
      yearTwoSalesUnits: input.yearTwoSalesUnits,
    });
  }

  async findOne(productId: string): Promise<MarketSizingRecord> {
    const record = await this.marketSizingRepository.findByProductId(productId);

    if (!record) {
      throw new NotFoundException({
        code: 'MARKET_SIZING_NOT_FOUND',
        message: `Market sizing for product ${productId} was not found.`,
      });
    }

    return record;
  }

  async update(productId: string, input: UpdateMarketSizingDto): Promise<MarketSizingRecord> {
    await this.assertProductStageIsEditable(productId);

    const existingRecord = await this.marketSizingRepository.findByProductId(productId);

    if (!existingRecord) {
      throw new NotFoundException({
        code: 'MARKET_SIZING_NOT_FOUND',
        message: `Market sizing for product ${productId} was not found.`,
      });
    }

    const updatedRecord = await this.marketSizingRepository.update(productId, {
      annualMarketSizeUnits: input.annualMarketSizeUnits,
      annualMarketSizeValue: input.annualMarketSizeValue,
      assumptions: input.assumptions,
      categoryName: input.categoryName,
      dataSources: input.dataSources ? [...new Set(input.dataSources)] : undefined,
      targetPriceBand: input.targetPriceBand,
      targetSegment: input.targetSegment,
      yearOneSalesUnits: input.yearOneSalesUnits,
      yearThreeSalesUnits: input.yearThreeSalesUnits,
      yearTwoSalesUnits: input.yearTwoSalesUnits,
    });

    if (!updatedRecord) {
      throw new NotFoundException({
        code: 'MARKET_SIZING_NOT_FOUND',
        message: `Market sizing for product ${productId} was not found.`,
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
}
