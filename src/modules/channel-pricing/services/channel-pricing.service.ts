import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { ChannelType } from '../../../enums/channel-type.enum';
import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductsRepository } from '../../products/repositories/products.repository';
import type { CreateChannelPricingDto, CreateChannelPricingRowDto } from '../dto/create-channel-pricing.dto';
import type { UpdateChannelPricingDto } from '../dto/update-channel-pricing.dto';
import { ChannelPricingRepository } from '../repositories/channel-pricing.repository';
import type { ChannelPricingRecord, ChannelPricingRowRecord } from '../types/channel-pricing-record.type';

export const CHANNEL_GP_FLOORS: Record<ChannelType, number> = {
  [ChannelType.CS]: 30,
  [ChannelType.EXPORT_KME]: 20,
  [ChannelType.ITO_RETAILERS]: 22,
  [ChannelType.ITO_WHOLESALE]: 20,
  [ChannelType.MM]: 28,
  [ChannelType.MTO]: 25,
  [ChannelType.PROJECTS]: 18,
};

@Injectable()
export class ChannelPricingService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly channelPricingRepository: ChannelPricingRepository,
  ) {}

  async create(productId: string, input: CreateChannelPricingDto): Promise<ChannelPricingRecord> {
    await this.assertStageThreeEditable(productId);

    const existingRecord = await this.channelPricingRepository.findByProductId(productId);

    if (existingRecord) {
      throw new ConflictException({
        code: 'CHANNEL_PRICING_ALREADY_EXISTS',
        message: `Channel pricing already exists for product ${productId}.`,
      });
    }

    return this.channelPricingRepository.create({
      currency: input.currency,
      id: randomUUID(),
      notes: input.notes ?? null,
      pricingRows: this.mapPricingRows(input.pricingRows),
      productId,
    });
  }

  async findOne(productId: string): Promise<ChannelPricingRecord> {
    const record = await this.channelPricingRepository.findByProductId(productId);

    if (!record) {
      throw new NotFoundException({
        code: 'CHANNEL_PRICING_NOT_FOUND',
        message: `Channel pricing for product ${productId} was not found.`,
      });
    }

    return record;
  }

  async update(productId: string, input: UpdateChannelPricingDto): Promise<ChannelPricingRecord> {
    await this.assertStageThreeEditable(productId);

    const existingRecord = await this.channelPricingRepository.findByProductId(productId);

    if (!existingRecord) {
      throw new NotFoundException({
        code: 'CHANNEL_PRICING_NOT_FOUND',
        message: `Channel pricing for product ${productId} was not found.`,
      });
    }

    const updatedRecord = await this.channelPricingRepository.update(productId, {
      currency: input.currency,
      notes: input.notes,
      pricingRows: input.pricingRows ? this.mapPricingRows(input.pricingRows) : undefined,
    });

    if (!updatedRecord) {
      throw new NotFoundException({
        code: 'CHANNEL_PRICING_NOT_FOUND',
        message: `Channel pricing for product ${productId} was not found.`,
      });
    }

    return updatedRecord;
  }

  static getFailedGpFloorRows(record: ChannelPricingRecord): ChannelPricingRowRecord[] {
    return record.pricingRows.filter(
      (row) => Number(row.calculatedGpPercent) < CHANNEL_GP_FLOORS[row.channelType],
    );
  }

  static hasItoUndercutViolation(record: ChannelPricingRecord): boolean {
    const mtoRsp = record.pricingRows.find((row) => row.channelType === ChannelType.MTO)?.rsp;

    if (!mtoRsp) {
      return false;
    }

    const minimumItoRsp = Number(mtoRsp) * 0.9;

    return record.pricingRows.some(
      (row) =>
        [ChannelType.ITO_RETAILERS, ChannelType.ITO_WHOLESALE].includes(row.channelType) &&
        Number(row.rsp) < minimumItoRsp,
    );
  }

  private async assertStageThreeEditable(productId: string): Promise<void> {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${productId} was not found.`,
      });
    }

    if (product.currentStage !== ProductStage.STAGE_3) {
      throw new ConflictException({
        code: 'STAGE_THREE_TEMPLATE_LOCKED',
        message: `Stage 3 templates can only be edited while product ${productId} is in Stage 3.`,
      });
    }
  }

  private mapPricingRows(rows: CreateChannelPricingRowDto[]): ChannelPricingRowRecord[] {
    return rows.map((row) => {
      const rsp = Number(row.rsp);
      const landedCost = Number(row.landedCost);

      if (rsp <= 0 || landedCost < 0) {
        throw new BadRequestException({
          code: 'CHANNEL_PRICING_VALUES_INVALID',
          message: 'Channel pricing requires rsp > 0 and landedCost >= 0.',
        });
      }

      return {
        calculatedGpPercent: (((rsp - landedCost) / rsp) * 100).toFixed(2),
        channelType: row.channelType,
        id: randomUUID(),
        landedCost: row.landedCost,
        notes: row.notes ?? null,
        rsp: row.rsp,
      };
    });
  }
}
