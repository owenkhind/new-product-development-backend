import type { MarketSizingRecord } from '../types/market-sizing-record.type';

export class MarketSizingResponseDto {
  annualMarketSizeUnits!: number;
  annualMarketSizeValue!: string;
  assumptions!: string | null;
  categoryName!: string;
  createdAt!: Date;
  dataSources!: string[];
  id!: string;
  productId!: string;
  targetPriceBand!: string;
  targetSegment!: string;
  updatedAt!: Date;
  yearOneSalesUnits!: number;
  yearThreeSalesUnits!: number;
  yearTwoSalesUnits!: number;

  static fromRecord(record: MarketSizingRecord): MarketSizingResponseDto {
    return {
      annualMarketSizeUnits: record.annualMarketSizeUnits,
      annualMarketSizeValue: record.annualMarketSizeValue,
      assumptions: record.assumptions,
      categoryName: record.categoryName,
      createdAt: record.createdAt,
      dataSources: record.dataSources,
      id: record.id,
      productId: record.productId,
      targetPriceBand: record.targetPriceBand,
      targetSegment: record.targetSegment,
      updatedAt: record.updatedAt,
      yearOneSalesUnits: record.yearOneSalesUnits,
      yearThreeSalesUnits: record.yearThreeSalesUnits,
      yearTwoSalesUnits: record.yearTwoSalesUnits,
    };
  }
}
