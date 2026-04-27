import { ChannelType } from '../../../enums/channel-type.enum';
import { Day30PerformanceFlag } from '../../../enums/day-30-performance-flag.enum';
import { Day30Verdict } from '../../../enums/day-30-verdict.enum';

export type Day30ReviewChannelGpRecord = {
  actualGpPercent: string;
  channelType: ChannelType;
  id: string;
  notes: string | null;
};

export type Day30ReviewRecord = {
  actionPlan: string;
  actualRevenue: string;
  actualSellThroughUnits: number;
  channelGp: Day30ReviewChannelGpRecord[];
  createdAt: Date;
  flags: Day30PerformanceFlag[];
  id: string;
  productId: string;
  reviewSummary: string;
  targetRevenue: string;
  targetSellThroughUnits: number;
  updatedAt: Date;
  verdict: Day30Verdict;
};
