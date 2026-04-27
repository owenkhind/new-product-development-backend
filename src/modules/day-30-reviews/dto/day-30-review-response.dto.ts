import type {
  Day30ReviewChannelGpRecord,
  Day30ReviewRecord,
} from '../types/day-30-review-record.type';

class Day30ReviewChannelGpResponseDto {
  actualGpPercent!: string;
  channelType!: string;
  id!: string;
  notes!: string | null;

  static fromRecord(record: Day30ReviewChannelGpRecord): Day30ReviewChannelGpResponseDto {
    return {
      actualGpPercent: record.actualGpPercent,
      channelType: record.channelType,
      id: record.id,
      notes: record.notes,
    };
  }
}

export class Day30ReviewResponseDto {
  actionPlan!: string;
  actualRevenue!: string;
  actualSellThroughUnits!: number;
  channelGp!: Day30ReviewChannelGpResponseDto[];
  createdAt!: Date;
  flags!: string[];
  id!: string;
  productId!: string;
  reviewSummary!: string;
  targetRevenue!: string;
  targetSellThroughUnits!: number;
  updatedAt!: Date;
  verdict!: string;

  static fromRecord(record: Day30ReviewRecord): Day30ReviewResponseDto {
    return {
      actionPlan: record.actionPlan,
      actualRevenue: record.actualRevenue,
      actualSellThroughUnits: record.actualSellThroughUnits,
      channelGp: record.channelGp.map((row) => Day30ReviewChannelGpResponseDto.fromRecord(row)),
      createdAt: record.createdAt,
      flags: record.flags,
      id: record.id,
      productId: record.productId,
      reviewSummary: record.reviewSummary,
      targetRevenue: record.targetRevenue,
      targetSellThroughUnits: record.targetSellThroughUnits,
      updatedAt: record.updatedAt,
      verdict: record.verdict,
    };
  }
}
