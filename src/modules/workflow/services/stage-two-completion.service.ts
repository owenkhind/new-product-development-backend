import { BadRequestException, Injectable } from '@nestjs/common';

import { BusinessCasesRepository } from '../../business-cases/repositories/business-cases.repository';
import { SupplierEvaluationsRepository } from '../../supplier-evaluations/repositories/supplier-evaluations.repository';
import { GateTwoReviewsRepository } from '../repositories/gate-two-reviews.repository';

@Injectable()
export class StageTwoCompletionService {
  constructor(
    private readonly supplierEvaluationsRepository: SupplierEvaluationsRepository,
    private readonly businessCasesRepository: BusinessCasesRepository,
    private readonly gateTwoReviewsRepository: GateTwoReviewsRepository,
  ) {}

  async assertReadyForGateTwoSubmission(productId: string): Promise<void> {
    const [supplierEvaluation, businessCase] = await Promise.all([
      this.supplierEvaluationsRepository.findByProductId(productId),
      this.businessCasesRepository.findByProductId(productId),
    ]);

    const missingRequirements: string[] = [];

    if (!supplierEvaluation) {
      missingRequirements.push('supplier_evaluation');
    }

    if (!businessCase) {
      missingRequirements.push('business_case');
    }

    if (missingRequirements.length === 0) {
      return;
    }

    throw new BadRequestException({
      code: 'STAGE_TWO_SUBMISSION_INCOMPLETE',
      message: 'Stage 2 is incomplete and cannot be submitted for Gate 2 review.',
      details: {
        missingRequirements,
      },
    });
  }

  async assertReadyForGateTwoApproval(productId: string): Promise<void> {
    const [supplierEvaluation, businessCase, gateTwoReview] = await Promise.all([
      this.supplierEvaluationsRepository.findByProductId(productId),
      this.businessCasesRepository.findByProductId(productId),
      this.gateTwoReviewsRepository.findByProductId(productId),
    ]);

    const missingRequirements: string[] = [];
    const qualifiedSupplierCount =
      supplierEvaluation?.suppliers.filter((supplier) => supplier.isQualified).length ?? 0;

    if (!supplierEvaluation) {
      missingRequirements.push('supplier_evaluation');
    }

    if (!businessCase) {
      missingRequirements.push('business_case');
    }

    if (supplierEvaluation && qualifiedSupplierCount < 2) {
      missingRequirements.push('minimum_qualified_suppliers');
    }

    if (!gateTwoReview?.qaReviewCompletedAt || !gateTwoReview.qaReviewedByUserId) {
      missingRequirements.push('qa_review_completed');
    }

    if (!gateTwoReview?.financeConfirmedAt || !gateTwoReview.financeConfirmedByUserId) {
      missingRequirements.push('finance_confirmed');
    }

    if (!gateTwoReview?.gmApprovedAt || !gateTwoReview.gmApprovedByUserId) {
      missingRequirements.push('gm_approved');
    }

    if (missingRequirements.length === 0) {
      return;
    }

    throw new BadRequestException({
      code: 'STAGE_TWO_APPROVAL_INCOMPLETE',
      message: 'Stage 2 is incomplete and cannot be approved through Gate 2.',
      details: {
        missingRequirements,
        qualifiedSupplierCount,
      },
    });
  }
}
