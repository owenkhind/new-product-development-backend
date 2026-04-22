import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { HealthController } from '../../src/modules/health/health.controller';

describe('HealthController', () => {
  it('returns service metadata from config', () => {
    const controller = new HealthController({
      get: (key: string, defaultValue: string) => {
        if (key === 'APP_NAME') {
          return 'npd-service';
        }

        if (key === 'APP_VERSION') {
          return '1.2.3';
        }

        return defaultValue;
      },
    } as never);

    assert.deepEqual(controller.check(), {
      service: 'npd-service',
      status: 'ok',
      version: '1.2.3',
    });
  });

  it('falls back to defaults when config values are missing', () => {
    const controller = new HealthController({
      get: (_key: string, defaultValue: string) => defaultValue,
    } as never);

    assert.deepEqual(controller.check(), {
      service: 'new-product-development-backend',
      status: 'ok',
      version: '0.1.0',
    });
  });
});
