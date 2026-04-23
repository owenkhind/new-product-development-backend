import type {
  BusinessCaseChannelGpSummaryRecord,
  BusinessCaseRecord,
} from '../types/business-case-record.type';

class BusinessCaseChannelGpSummaryResponseDto {
  channelName!: string;
  expectedGpPercent!: string;
  notes!: string | null;

  static fromRecord(
    record: BusinessCaseChannelGpSummaryRecord,
  ): BusinessCaseChannelGpSummaryResponseDto {
    return {
      channelName: record.channelName,
      expectedGpPercent: record.expectedGpPercent,
      notes: record.notes,
    };
  }
}

export class BusinessCaseResponseDto {
  channelGpSummary!: BusinessCaseChannelGpSummaryResponseDto[];
  commercialNotes!: string | null;
  createdAt!: Date;
  financeNotes!: string | null;
  id!: string;
  investmentNeeded!: string;
  marketOpportunitySummary!: string;
  productId!: string;
  productSummary!: string;
  recommendation!: string;
  riskSummary!: string;
  updatedAt!: Date;
  yearOneRevenue!: string;
  yearThreeRevenue!: string;
  yearTwoRevenue!: string;

  static fromRecord(record: BusinessCaseRecord): BusinessCaseResponseDto {
    return {
      channelGpSummary: record.channelGpSummary.map((entry) =>
        BusinessCaseChannelGpSummaryResponseDto.fromRecord(entry),
      ),
      commercialNotes: record.commercialNotes,
      createdAt: record.createdAt,
      financeNotes: record.financeNotes,
      id: record.id,
      investmentNeeded: record.investmentNeeded,
      marketOpportunitySummary: record.marketOpportunitySummary,
      productId: record.productId,
      productSummary: record.productSummary,
      recommendation: record.recommendation,
      riskSummary: record.riskSummary,
      updatedAt: record.updatedAt,
      yearOneRevenue: record.yearOneRevenue,
      yearThreeRevenue: record.yearThreeRevenue,
      yearTwoRevenue: record.yearTwoRevenue,
    };
  }
}
