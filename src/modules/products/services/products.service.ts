import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { UserRole } from '../../../enums/user-role.enum';
import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductStatus } from '../../../enums/product-status.enum';
import { UsersRepository } from '../../users/repositories/users.repository';
import type { CreateProductDto } from '../dto/create-product.dto';
import type { ListProductsQueryDto } from '../dto/list-products-query.dto';
import type { UpdateProductDto } from '../dto/update-product.dto';
import { ProductsRepository } from '../repositories/products.repository';
import type { ProductRecord } from '../types/product-record.type';

type AssignmentValidationConfig = {
  allowedRoles: UserRole[];
  fieldName: string;
  userId: string | null | undefined;
};

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<ProductRecord> {
    if (createProductDto.productCode) {
      const existingProduct = await this.productsRepository.findByProductCode(createProductDto.productCode);

      if (existingProduct) {
        throw new ConflictException({
          code: 'PRODUCT_CODE_ALREADY_EXISTS',
          message: `A product with code ${createProductDto.productCode} already exists.`,
        });
      }
    }

    const clusterOwnerUserIds = this.normalizeClusterOwnerIds(createProductDto.clusterOwnerUserIds);
    await this.validateAssignments({
      clusterOwnerUserIds,
      commercialOwnerUserId: createProductDto.commercialOwnerUserId,
      financeOwnerUserId: createProductDto.financeOwnerUserId,
      marketingOwnerUserId: createProductDto.marketingOwnerUserId,
      productOwnerUserId: createProductDto.productOwnerUserId,
    });

    return this.productsRepository.create({
      brand: createProductDto.brand,
      category: createProductDto.category,
      clusterOwnerUserIds,
      commercialOwnerUserId: createProductDto.commercialOwnerUserId ?? null,
      currentStage: createProductDto.currentStage ?? ProductStage.STAGE_1,
      description: createProductDto.description ?? null,
      financeOwnerUserId: createProductDto.financeOwnerUserId ?? null,
      id: randomUUID(),
      marketingOwnerUserId: createProductDto.marketingOwnerUserId ?? null,
      productCode: createProductDto.productCode ?? null,
      productOwnerUserId: createProductDto.productOwnerUserId,
      status: createProductDto.status ?? ProductStatus.DRAFT,
      workingName: createProductDto.workingName,
    });
  }

  async findAll(query: ListProductsQueryDto): Promise<{ rows: ProductRecord[]; total: number }> {
    const limit = Math.min(query.limit, 100);
    const offset = (query.page - 1) * limit;

    return this.productsRepository.list({
      brand: query.brand,
      category: query.category,
      limit,
      offset,
      productOwnerUserId: query.productOwnerUserId,
      stage: query.stage,
      status: query.status,
    });
  }

  async findOne(id: string): Promise<ProductRecord> {
    const product = await this.productsRepository.findById(id);

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${id} was not found.`,
      });
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductRecord> {
    if (updateProductDto.productCode) {
      const existingProduct = await this.productsRepository.findByProductCode(updateProductDto.productCode);

      if (existingProduct && existingProduct.id !== id) {
        throw new ConflictException({
          code: 'PRODUCT_CODE_ALREADY_EXISTS',
          message: `A product with code ${updateProductDto.productCode} already exists.`,
        });
      }
    }

    await this.validateAssignments({
      clusterOwnerUserIds:
        updateProductDto.clusterOwnerUserIds !== undefined
          ? this.normalizeClusterOwnerIds(updateProductDto.clusterOwnerUserIds)
          : undefined,
      commercialOwnerUserId: updateProductDto.commercialOwnerUserId,
      financeOwnerUserId: updateProductDto.financeOwnerUserId,
      marketingOwnerUserId: updateProductDto.marketingOwnerUserId,
      productOwnerUserId: updateProductDto.productOwnerUserId,
    });

    const product = await this.productsRepository.update(id, {
      brand: updateProductDto.brand,
      category: updateProductDto.category,
      clusterOwnerUserIds:
        updateProductDto.clusterOwnerUserIds !== undefined
          ? this.normalizeClusterOwnerIds(updateProductDto.clusterOwnerUserIds)
          : undefined,
      commercialOwnerUserId: updateProductDto.commercialOwnerUserId,
      currentStage: updateProductDto.currentStage,
      description: updateProductDto.description,
      financeOwnerUserId: updateProductDto.financeOwnerUserId,
      marketingOwnerUserId: updateProductDto.marketingOwnerUserId,
      productCode: updateProductDto.productCode,
      productOwnerUserId: updateProductDto.productOwnerUserId,
      status: updateProductDto.status,
      workingName: updateProductDto.workingName,
    });

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${id} was not found.`,
      });
    }

    return product;
  }

  private normalizeClusterOwnerIds(clusterOwnerUserIds?: string[]): string[] {
    if (!clusterOwnerUserIds) {
      return [];
    }

    return [...new Set(clusterOwnerUserIds)];
  }

  private async validateAssignments(input: {
    clusterOwnerUserIds?: string[];
    commercialOwnerUserId?: string | null;
    financeOwnerUserId?: string | null;
    marketingOwnerUserId?: string | null;
    productOwnerUserId?: string | null;
  }): Promise<void> {
    await Promise.all([
      this.validateAssignedUser({
        allowedRoles: [UserRole.PRODUCT_MANAGER],
        fieldName: 'productOwnerUserId',
        userId: input.productOwnerUserId,
      }),
      this.validateAssignedUser({
        allowedRoles: [UserRole.GM_COMMERCIAL_OWNER],
        fieldName: 'commercialOwnerUserId',
        userId: input.commercialOwnerUserId,
      }),
      this.validateAssignedUser({
        allowedRoles: [UserRole.FINANCE_MANAGER],
        fieldName: 'financeOwnerUserId',
        userId: input.financeOwnerUserId,
      }),
      this.validateAssignedUser({
        allowedRoles: [UserRole.MARKETING_GTM_OWNER],
        fieldName: 'marketingOwnerUserId',
        userId: input.marketingOwnerUserId,
      }),
      ...(input.clusterOwnerUserIds ?? []).map((userId) =>
        this.validateAssignedUser({
          allowedRoles: [UserRole.CLUSTER_MANAGER],
          fieldName: 'clusterOwnerUserIds',
          userId,
        }),
      ),
    ]);
  }

  private async validateAssignedUser({
    allowedRoles,
    fieldName,
    userId,
  }: AssignmentValidationConfig): Promise<void> {
    if (userId === undefined) {
      return;
    }

    if (userId === null) {
      return;
    }

    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new NotFoundException({
        code: 'ASSIGNED_USER_NOT_FOUND',
        message: `Assigned user ${userId} for ${fieldName} was not found.`,
      });
    }

    if (!user.isActive) {
      throw new BadRequestException({
        code: 'ASSIGNED_USER_INACTIVE',
        message: `Assigned user ${userId} for ${fieldName} is inactive.`,
      });
    }

    if (!allowedRoles.includes(user.role)) {
      throw new BadRequestException({
        code: 'INVALID_ASSIGNED_USER_ROLE',
        message: `${fieldName} must reference one of these roles: ${allowedRoles.join(', ')}.`,
        details: {
          actualRole: user.role,
          userId,
        },
      });
    }
  }
}
