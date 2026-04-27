import type {
  ChannelListingPlanChannelRecord,
  ChannelListingPlanRecord,
} from '../types/channel-listing-plan-record.type';

class ChannelListingPlanChannelResponseDto {
  accountName!: string;
  channelType!: string;
  id!: string;
  isConfirmed!: boolean;
  launchOwner!: string;
  readinessNotes!: string | null;
  targetGoLiveDate!: string | null;

  static fromRecord(record: ChannelListingPlanChannelRecord): ChannelListingPlanChannelResponseDto {
    return {
      accountName: record.accountName,
      channelType: record.channelType,
      id: record.id,
      isConfirmed: record.isConfirmed,
      launchOwner: record.launchOwner,
      readinessNotes: record.readinessNotes,
      targetGoLiveDate: record.targetGoLiveDate,
    };
  }
}

export class ChannelListingPlanResponseDto {
  channels!: ChannelListingPlanChannelResponseDto[];
  createdAt!: Date;
  id!: string;
  lazadaConfirmed!: boolean;
  productId!: string;
  shopeeConfirmed!: boolean;
  summary!: string | null;
  updatedAt!: Date;

  static fromRecord(record: ChannelListingPlanRecord): ChannelListingPlanResponseDto {
    return {
      channels: record.channels.map((channel) =>
        ChannelListingPlanChannelResponseDto.fromRecord(channel),
      ),
      createdAt: record.createdAt,
      id: record.id,
      lazadaConfirmed: record.lazadaConfirmed,
      productId: record.productId,
      shopeeConfirmed: record.shopeeConfirmed,
      summary: record.summary,
      updatedAt: record.updatedAt,
    };
  }
}
