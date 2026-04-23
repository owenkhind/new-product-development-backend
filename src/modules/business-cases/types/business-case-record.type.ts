export type BusinessCaseChannelGpSummaryRecord = {
  channelName: string;
  expectedGpPercent: string;
  notes: string | null;
};

export type BusinessCaseRecord = {
  channelGpSummary: BusinessCaseChannelGpSummaryRecord[];
  commercialNotes: string | null;
  createdAt: Date;
  financeNotes: string | null;
  id: string;
  investmentNeeded: string;
  marketOpportunitySummary: string;
  productId: string;
  productSummary: string;
  recommendation: string;
  riskSummary: string;
  updatedAt: Date;
  yearOneRevenue: string;
  yearThreeRevenue: string;
  yearTwoRevenue: string;
};
