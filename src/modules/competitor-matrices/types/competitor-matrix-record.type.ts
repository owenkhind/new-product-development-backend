export type CompetitorMatrixEntryRecord = {
  brandName: string;
  competitorName: string;
  designScore: number;
  featureScore: number;
  id: string;
  modelName: string;
  overallScore: number;
  price: string;
  strengths: string[];
  valueScore: number;
  weaknesses: string[];
};

export type CompetitorMatrixRecord = {
  createdAt: Date;
  entries: CompetitorMatrixEntryRecord[];
  id: string;
  productId: string;
  scoringMethodology: string;
  summary: string | null;
  updatedAt: Date;
};
