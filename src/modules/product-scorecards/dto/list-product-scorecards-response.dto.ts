import type { ProductScorecardResponseDto } from './product-scorecard-response.dto';

export type ListProductScorecardsResponseDto = {
  data: ProductScorecardResponseDto[];
  meta: {
    limit: number;
    page: number;
    total: number;
  };
};
