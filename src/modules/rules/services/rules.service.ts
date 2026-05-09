import { Injectable } from '@nestjs/common';

import {
  GP_FLOOR_RULES,
  WORKFLOW_RULES,
} from '../constants/rules-catalog.constants';
import type { RulesDashboard } from '../types/rules-dashboard.type';

@Injectable()
export class RulesService {
  getDashboard(): RulesDashboard {
    const needsReviewCount =
      WORKFLOW_RULES.filter((rule) => rule.status === 'NEEDS_REVIEW').length +
      GP_FLOOR_RULES.filter((floor) => floor.status === 'NEEDS_REVIEW').length;
    const escalationCount = WORKFLOW_RULES.filter(
      (rule) => rule.category === 'ESCALATION',
    ).length;

    return {
      gpFloors: GP_FLOOR_RULES,
      metrics: [
        {
          label: 'Backend policy rules',
          tone: 'blue',
          value: WORKFLOW_RULES.length,
        },
        { label: 'GP floors', tone: 'green', value: GP_FLOOR_RULES.length },
        { label: 'Needs review', tone: 'amber', value: needsReviewCount },
        { label: 'Escalations', tone: 'red', value: escalationCount },
      ],
      rules: WORKFLOW_RULES,
    };
  }
}
