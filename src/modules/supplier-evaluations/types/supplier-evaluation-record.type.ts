export type SupplierEvaluationSupplierRecord = {
  factoryName: string;
  id: string;
  isQualified: boolean;
  leadTimeDays: number;
  moq: number;
  originCountry: string;
  paymentTerms: string;
  remarks: string | null;
  sparePartsSupportNotes: string | null;
  supplierName: string;
  toolingNotes: string | null;
  weightedScore: string;
};

export type SupplierEvaluationRecord = {
  createdAt: Date;
  id: string;
  productId: string;
  scoringMethodology: string;
  summary: string | null;
  suppliers: SupplierEvaluationSupplierRecord[];
  updatedAt: Date;
};
