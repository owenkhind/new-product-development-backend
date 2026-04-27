export type GateThreeReviewRecord = {
  createdAt: Date;
  financeComment: string | null;
  financeConfirmedAt: Date | null;
  financeConfirmedByUserId: string | null;
  gmApprovedAt: Date | null;
  gmApprovedByUserId: string | null;
  gmComment: string | null;
  marketingComment: string | null;
  marketingReviewedAt: Date | null;
  marketingReviewedByUserId: string | null;
  productId: string;
  updatedAt: Date;
};
