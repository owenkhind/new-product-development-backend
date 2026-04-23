export type GateTwoReviewRecord = {
  createdAt: Date;
  financeComment: string | null;
  financeConfirmedAt: Date | null;
  financeConfirmedByUserId: string | null;
  gmApprovedAt: Date | null;
  gmApprovedByUserId: string | null;
  gmComment: string | null;
  productId: string;
  qaComment: string | null;
  qaReviewCompletedAt: Date | null;
  qaReviewedByUserId: string | null;
  updatedAt: Date;
};
