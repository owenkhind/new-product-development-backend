import { ChannelType } from '../../../enums/channel-type.enum';

export type SellInReportAccountRecord = {
  accountName: string;
  channelType: ChannelType;
  declineReason: string | null;
  id: string;
  sellInUnits: number;
  sellInValue: string;
};

export type SellInReportRecord = {
  accounts: SellInReportAccountRecord[];
  createdAt: Date;
  id: string;
  notes: string | null;
  productId: string;
  reportPeriodEnd: string;
  reportPeriodStart: string;
  totalSellInUnits: number;
  totalSellInValue: string;
  updatedAt: Date;
};
