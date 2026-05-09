import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ProductStage } from '../../src/enums/product-stage.enum';
import { TemplateLibraryService } from '../../src/modules/templates/services/template-library.service';
import type { TemplateLibraryStats } from '../../src/modules/templates/types/template-library.type';

describe('TemplateLibraryService', () => {
  it('builds the lifecycle template library from backend aggregate stats', async () => {
    const service = new TemplateLibraryService({
      getLibraryStats: async () => createTemplateLibraryStats(),
    } as never);

    const dashboard = await service.getDashboard();

    assert.equal(dashboard.templates.length, 17);
    assert.equal(dashboard.metrics[0]?.label, 'Lifecycle templates');
    assert.equal(dashboard.metrics[0]?.value, 17);

    const channelListingPlan = dashboard.templates.find(
      (template) => template.id === 'T6',
    );
    const launchReadiness = dashboard.stageSummaries.find(
      (summary) => summary.stage === ProductStage.STAGE_3,
    );

    assert.ok(channelListingPlan);
    assert.equal(channelListingPlan.completionPercent, 67);
    assert.equal(channelListingPlan.status, 'BLOCKED');
    assert.match(channelListingPlan.blocker ?? '', /need rework/);
    assert.equal(channelListingPlan.lastUpdated, '2026-04-30');
    assert.equal(launchReadiness?.templateCount, 3);
    assert.equal(launchReadiness?.blockedCount, 3);
  });
});

function createTemplateLibraryStats(): TemplateLibraryStats {
  return {
    productScope: {
      blockedByStage: {
        [ProductStage.STAGE_1]: 0,
        [ProductStage.STAGE_2]: 0,
        [ProductStage.STAGE_3]: 1,
        [ProductStage.STAGE_4]: 0,
        [ProductStage.STAGE_5]: 0,
        [ProductStage.STAGE_6]: 0,
      },
      byStage: {
        [ProductStage.STAGE_1]: 1,
        [ProductStage.STAGE_2]: 0,
        [ProductStage.STAGE_3]: 2,
        [ProductStage.STAGE_4]: 1,
        [ProductStage.STAGE_5]: 0,
        [ProductStage.STAGE_6]: 0,
      },
      total: 4,
    },
    templateStats: [
      {
        latestUpdated: new Date('2026-04-30T12:00:00.000Z'),
        recordCount: 2,
        templateId: 'T6',
      },
      {
        latestUpdated: new Date('2026-04-30T13:00:00.000Z'),
        recordCount: 1,
        templateId: 'T7',
      },
      {
        latestUpdated: new Date('2026-04-30T14:00:00.000Z'),
        recordCount: 1,
        templateId: 'T8',
      },
    ],
  };
}
