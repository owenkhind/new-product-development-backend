import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { ProductBrand } from '../../../enums/product-brand.enum';
import { ProductCategory } from '../../../enums/product-category.enum';
import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductStatus } from '../../../enums/product-status.enum';

export class CreateProductDto {
  @IsEnum(ProductBrand)
  brand!: ProductBrand;

  @IsEnum(ProductCategory)
  category!: ProductCategory;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  clusterOwnerUserIds?: string[];

  @IsOptional()
  @IsUUID('4')
  commercialOwnerUserId?: string;

  @IsOptional()
  @IsEnum(ProductStage)
  currentStage?: ProductStage;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsUUID('4')
  financeOwnerUserId?: string;

  @IsOptional()
  @IsUUID('4')
  marketingOwnerUserId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  productCode?: string;

  @IsUUID('4')
  productOwnerUserId!: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsString()
  @MaxLength(255)
  workingName!: string;
}
