import type {
  SupplierEvaluationRecord,
  SupplierEvaluationSupplierRecord,
} from '../types/supplier-evaluation-record.type';

class SupplierEvaluationSupplierResponseDto {
  factoryName!: string;
  id!: string;
  isQualified!: boolean;
  leadTimeDays!: number;
  moq!: number;
  originCountry!: string;
  paymentTerms!: string;
  remarks!: string | null;
  sparePartsSupportNotes!: string | null;
  supplierName!: string;
  toolingNotes!: string | null;
  weightedScore!: string;

  static fromRecord(record: SupplierEvaluationSupplierRecord): SupplierEvaluationSupplierResponseDto {
    return {
      factoryName: record.factoryName,
      id: record.id,
      isQualified: record.isQualified,
      leadTimeDays: record.leadTimeDays,
      moq: record.moq,
      originCountry: record.originCountry,
      paymentTerms: record.paymentTerms,
      remarks: record.remarks,
      sparePartsSupportNotes: record.sparePartsSupportNotes,
      supplierName: record.supplierName,
      toolingNotes: record.toolingNotes,
      weightedScore: record.weightedScore,
    };
  }
}

export class SupplierEvaluationResponseDto {
  createdAt!: Date;
  id!: string;
  productId!: string;
  scoringMethodology!: string;
  summary!: string | null;
  suppliers!: SupplierEvaluationSupplierResponseDto[];
  updatedAt!: Date;

  static fromRecord(record: SupplierEvaluationRecord): SupplierEvaluationResponseDto {
    return {
      createdAt: record.createdAt,
      id: record.id,
      productId: record.productId,
      scoringMethodology: record.scoringMethodology,
      summary: record.summary,
      suppliers: record.suppliers.map((supplier) =>
        SupplierEvaluationSupplierResponseDto.fromRecord(supplier),
      ),
      updatedAt: record.updatedAt,
    };
  }
}
