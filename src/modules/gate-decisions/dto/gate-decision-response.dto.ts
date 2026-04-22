import type { GateDecisionRecord } from '../types/gate-decision-record.type';

export class GateDecisionResponseDto {
  actingAsUserId!: string | null;
  actorUserId!: string;
  comment!: string | null;
  createdAt!: Date;
  gateStage!: string;
  id!: string;
  isAdminSupportAction!: boolean;
  outcome!: string;
  overrideReason!: string | null;
  productId!: string;

  static fromRecord(record: GateDecisionRecord): GateDecisionResponseDto {
    return {
      actingAsUserId: record.actingAsUserId,
      actorUserId: record.actorUserId,
      comment: record.comment,
      createdAt: record.createdAt,
      gateStage: record.gateStage,
      id: record.id,
      isAdminSupportAction: record.isAdminSupportAction,
      outcome: record.outcome,
      overrideReason: record.overrideReason,
      productId: record.productId,
    };
  }
}
