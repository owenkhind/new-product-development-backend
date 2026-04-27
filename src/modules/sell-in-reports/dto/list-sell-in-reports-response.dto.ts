import type { SellInReportResponseDto } from './sell-in-report-response.dto';

export type ListSellInReportsResponseDto = {
  data: SellInReportResponseDto[];
  meta: {
    limit: number;
    page: number;
    total: number;
  };
};
