import { ChannelType } from '../../../enums/channel-type.enum';

export type ChannelPricingRowRecord = {
  calculatedGpPercent: string;
  channelType: ChannelType;
  id: string;
  landedCost: string;
  notes: string | null;
  rsp: string;
};

export type ChannelPricingRecord = {
  createdAt: Date;
  currency: string;
  id: string;
  notes: string | null;
  pricingRows: ChannelPricingRowRecord[];
  productId: string;
  updatedAt: Date;
};
