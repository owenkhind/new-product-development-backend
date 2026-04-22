import type { ProductResponseDto } from './product-response.dto';

export class ListProductsResponseDto {
  data!: ProductResponseDto[];
  meta!: {
    limit: number;
    page: number;
    total: number;
  };
}
