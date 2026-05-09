import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { RulesService } from '../../src/modules/rules/services/rules.service';

describe('RulesService', () => {
  it('returns backend-owned workflow and GP floor policy rules', () => {
    const service = new RulesService();
    const dashboard = service.getDashboard();

    assert.equal(dashboard.gpFloors.length, 8);
    assert.equal(dashboard.rules.length, 10);
    assert.equal(
      dashboard.gpFloors.find((floor) => floor.channel === 'ITO Retailers')
        ?.floorPercent,
      22,
    );
    assert.equal(
      dashboard.rules.find(
        (rule) => rule.id === 'backend-policy-art-threshold-review',
      )?.status,
      'NEEDS_REVIEW',
    );
    assert.equal(
      dashboard.metrics.find((metric) => metric.label === 'Needs review')
        ?.value,
      2,
    );
  });
});
