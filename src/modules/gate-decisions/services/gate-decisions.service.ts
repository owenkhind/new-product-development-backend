import { Injectable } from '@nestjs/common';

import type { GateDecisionRecord } from '../types/gate-decision-record.type';
import { GateDecisionsRepository } from '../repositories/gate-decisions.repository';

@Injectable()
export class GateDecisionsService {
  constructor(private readonly gateDecisionsRepository: GateDecisionsRepository) {}

  async findByProductId(productId: string): Promise<GateDecisionRecord[]> {
    return this.gateDecisionsRepository.listByProductId(productId);
  }
}
