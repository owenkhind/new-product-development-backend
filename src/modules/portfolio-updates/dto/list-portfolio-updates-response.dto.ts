import type { PortfolioUpdateResponseDto } from './portfolio-update-response.dto';

export type ListPortfolioUpdatesResponseDto = {
  data: PortfolioUpdateResponseDto[];
  meta: {
    limit: number;
    page: number;
    total: number;
  };
};
