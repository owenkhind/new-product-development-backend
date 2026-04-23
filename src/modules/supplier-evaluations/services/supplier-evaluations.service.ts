import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { ProductStage } from '../../../enums/product-stage.enum';
import { ProductsRepository } from '../../products/repositories/products.repository';
import type {
  CreateSupplierEvaluationDto,
  CreateSupplierEvaluationSupplierDto,
} from '../dto/create-supplier-evaluation.dto';
import type { UpdateSupplierEvaluationDto } from '../dto/update-supplier-evaluation.dto';
import { SupplierEvaluationsRepository } from '../repositories/supplier-evaluations.repository';
import type {
  SupplierEvaluationRecord,
  SupplierEvaluationSupplierRecord,
} from '../types/supplier-evaluation-record.type';

@Injectable()
export class SupplierEvaluationsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly supplierEvaluationsRepository: SupplierEvaluationsRepository,
  ) {}

  async create(productId: string, input: CreateSupplierEvaluationDto): Promise<SupplierEvaluationRecord> {
    await this.assertStageTwoEditable(productId);

    const existingRecord = await this.supplierEvaluationsRepository.findByProductId(productId);

    if (existingRecord) {
      throw new ConflictException({
        code: 'SUPPLIER_EVALUATION_ALREADY_EXISTS',
        message: `Supplier evaluation already exists for product ${productId}.`,
      });
    }

    return this.supplierEvaluationsRepository.create({
      id: randomUUID(),
      productId,
      scoringMethodology: input.scoringMethodology,
      summary: input.summary ?? null,
      suppliers: this.mapSuppliers(input.suppliers),
    });
  }

  async findOne(productId: string): Promise<SupplierEvaluationRecord> {
    const record = await this.supplierEvaluationsRepository.findByProductId(productId);

    if (!record) {
      throw new NotFoundException({
        code: 'SUPPLIER_EVALUATION_NOT_FOUND',
        message: `Supplier evaluation for product ${productId} was not found.`,
      });
    }

    return record;
  }

  async update(productId: string, input: UpdateSupplierEvaluationDto): Promise<SupplierEvaluationRecord> {
    await this.assertStageTwoEditable(productId);

    const existingRecord = await this.supplierEvaluationsRepository.findByProductId(productId);

    if (!existingRecord) {
      throw new NotFoundException({
        code: 'SUPPLIER_EVALUATION_NOT_FOUND',
        message: `Supplier evaluation for product ${productId} was not found.`,
      });
    }

    const updatedRecord = await this.supplierEvaluationsRepository.update(productId, {
      scoringMethodology: input.scoringMethodology,
      summary: input.summary,
      suppliers: input.suppliers ? this.mapSuppliers(input.suppliers) : undefined,
    });

    if (!updatedRecord) {
      throw new NotFoundException({
        code: 'SUPPLIER_EVALUATION_NOT_FOUND',
        message: `Supplier evaluation for product ${productId} was not found.`,
      });
    }

    return updatedRecord;
  }

  private async assertStageTwoEditable(productId: string): Promise<void> {
    const product = await this.productsRepository.findById(productId);

    if (!product) {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: `Product ${productId} was not found.`,
      });
    }

    if (product.currentStage !== ProductStage.STAGE_2) {
      throw new ConflictException({
        code: 'STAGE_TWO_TEMPLATE_LOCKED',
        message: `Stage 2 templates can only be edited while product ${productId} is in Stage 2.`,
      });
    }
  }

  private mapSuppliers(
    suppliers: CreateSupplierEvaluationSupplierDto[],
  ): SupplierEvaluationSupplierRecord[] {
    return suppliers.map((supplier) => ({
      factoryName: supplier.factoryName,
      id: randomUUID(),
      isQualified: supplier.isQualified,
      leadTimeDays: supplier.leadTimeDays,
      moq: supplier.moq,
      originCountry: supplier.originCountry,
      paymentTerms: supplier.paymentTerms,
      remarks: supplier.remarks ?? null,
      sparePartsSupportNotes: supplier.sparePartsSupportNotes ?? null,
      supplierName: supplier.supplierName,
      toolingNotes: supplier.toolingNotes ?? null,
      weightedScore: supplier.weightedScore,
    }));
  }
}
