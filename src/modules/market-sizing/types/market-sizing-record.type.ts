export type MarketSizingRecord = {
  annualMarketSizeUnits: number;
  annualMarketSizeValue: string;
  assumptions: string | null;
  categoryName: string;
  createdAt: Date;
  dataSources: string[];
  id: string;
  productId: string;
  targetPriceBand: string;
  targetSegment: string;
  updatedAt: Date;
  yearOneSalesUnits: number;
  yearThreeSalesUnits: number;
  yearTwoSalesUnits: number;
};
