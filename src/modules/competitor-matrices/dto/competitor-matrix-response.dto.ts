import type {
  CompetitorMatrixEntryRecord,
  CompetitorMatrixRecord,
} from '../types/competitor-matrix-record.type';

class CompetitorMatrixEntryResponseDto {
  brandName!: string;
  competitorName!: string;
  designScore!: number;
  featureScore!: number;
  id!: string;
  modelName!: string;
  overallScore!: number;
  price!: string;
  strengths!: string[];
  valueScore!: number;
  weaknesses!: string[];

  static fromRecord(record: CompetitorMatrixEntryRecord): CompetitorMatrixEntryResponseDto {
    return {
      brandName: record.brandName,
      competitorName: record.competitorName,
      designScore: record.designScore,
      featureScore: record.featureScore,
      id: record.id,
      modelName: record.modelName,
      overallScore: record.overallScore,
      price: record.price,
      strengths: record.strengths,
      valueScore: record.valueScore,
      weaknesses: record.weaknesses,
    };
  }
}

export class CompetitorMatrixResponseDto {
  createdAt!: Date;
  entries!: CompetitorMatrixEntryResponseDto[];
  id!: string;
  productId!: string;
  scoringMethodology!: string;
  summary!: string | null;
  updatedAt!: Date;

  static fromRecord(record: CompetitorMatrixRecord): CompetitorMatrixResponseDto {
    return {
      createdAt: record.createdAt,
      entries: record.entries.map((entry) => CompetitorMatrixEntryResponseDto.fromRecord(entry)),
      id: record.id,
      productId: record.productId,
      scoringMethodology: record.scoringMethodology,
      summary: record.summary,
      updatedAt: record.updatedAt,
    };
  }
}
