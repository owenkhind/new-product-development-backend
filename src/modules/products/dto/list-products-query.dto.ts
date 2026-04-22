import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

import { ProductBrand } from '../../../enums/product-brand.enum';
import { ProductCategory } from '../../../enums/product-category.enum';
import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductStatus } from '../../../enums/product-status.enum';

export class ListProductsQueryDto {
  @IsOptional()
  @IsEnum(ProductBrand)
  brand?: ProductBrand;

  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }: { value: unknown }) => Number(value))
  limit = 20;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }: { value: unknown }) => Number(value))
  page = 1;

  @IsOptional()
  @IsUUID('4')
  productOwnerUserId?: string;

  @IsOptional()
  @IsEnum(ProductStage)
  stage?: ProductStage;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}
