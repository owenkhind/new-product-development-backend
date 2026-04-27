import type {
  ChannelPricingRecord,
  ChannelPricingRowRecord,
} from '../types/channel-pricing-record.type';

class ChannelPricingRowResponseDto {
  calculatedGpPercent!: string;
  channelType!: string;
  id!: string;
  landedCost!: string;
  notes!: string | null;
  rsp!: string;

  static fromRecord(record: ChannelPricingRowRecord): ChannelPricingRowResponseDto {
    return {
      calculatedGpPercent: record.calculatedGpPercent,
      channelType: record.channelType,
      id: record.id,
      landedCost: record.landedCost,
      notes: record.notes,
      rsp: record.rsp,
    };
  }
}

export class ChannelPricingResponseDto {
  createdAt!: Date;
  currency!: string;
  id!: string;
  notes!: string | null;
  pricingRows!: ChannelPricingRowResponseDto[];
  productId!: string;
  updatedAt!: Date;

  static fromRecord(record: ChannelPricingRecord): ChannelPricingResponseDto {
    return {
      createdAt: record.createdAt,
      currency: record.currency,
      id: record.id,
      notes: record.notes,
      pricingRows: record.pricingRows.map((row) => ChannelPricingRowResponseDto.fromRecord(row)),
      productId: record.productId,
      updatedAt: record.updatedAt,
    };
  }
}
