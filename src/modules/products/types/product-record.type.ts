import type { ProductBrand } from '../../../enums/product-brand.enum';
import type { ProductCategory } from '../../../enums/product-category.enum';
import type { ProductStage } from '../../../enums/product-stage.enum';
import type { ProductStatus } from '../../../enums/product-status.enum';

export type ProductRecord = {
  brand: ProductBrand;
  category: ProductCategory;
  clusterOwnerUserIds: string[];
  commercialOwnerUserId: string | null;
  createdAt: Date;
  currentStage: ProductStage;
  description: string | null;
  financeOwnerUserId: string | null;
  id: string;
  marketingOwnerUserId: string | null;
  productCode: string | null;
  productOwnerUserId: string;
  status: ProductStatus;
  updatedAt: Date;
  workingName: string;
};
