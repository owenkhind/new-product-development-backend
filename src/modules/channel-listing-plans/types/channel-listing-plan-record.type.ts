import { ChannelType } from '../../../enums/channel-type.enum';

export type ChannelListingPlanChannelRecord = {
  accountName: string;
  channelType: ChannelType;
  id: string;
  isConfirmed: boolean;
  launchOwner: string;
  readinessNotes: string | null;
  targetGoLiveDate: string | null;
};

export type ChannelListingPlanRecord = {
  channels: ChannelListingPlanChannelRecord[];
  createdAt: Date;
  id: string;
  lazadaConfirmed: boolean;
  productId: string;
  shopeeConfirmed: boolean;
  summary: string | null;
  updatedAt: Date;
};
