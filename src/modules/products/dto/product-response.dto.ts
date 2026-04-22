import type { ProductRecord } from '../types/product-record.type';

export class ProductResponseDto {
  brand!: string;
  category!: string;
  clusterOwnerUserIds!: string[];
  commercialOwnerUserId!: string | null;
  createdAt!: Date;
  currentStage!: string;
  description!: string | null;
  financeOwnerUserId!: string | null;
  id!: string;
  marketingOwnerUserId!: string | null;
  productCode!: string | null;
  productOwnerUserId!: string;
  status!: string;
  updatedAt!: Date;
  workingName!: string;

  static fromRecord(record: ProductRecord): ProductResponseDto {
    return {
      brand: record.brand,
      category: record.category,
      clusterOwnerUserIds: record.clusterOwnerUserIds,
      commercialOwnerUserId: record.commercialOwnerUserId,
      createdAt: record.createdAt,
      currentStage: record.currentStage,
      description: record.description,
      financeOwnerUserId: record.financeOwnerUserId,
      id: record.id,
      marketingOwnerUserId: record.marketingOwnerUserId,
      productCode: record.productCode,
      productOwnerUserId: record.productOwnerUserId,
      status: record.status,
      updatedAt: record.updatedAt,
      workingName: record.workingName,
    };
  }
}
