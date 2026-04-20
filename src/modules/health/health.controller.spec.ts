import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';

import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns service metadata', async () => {
    const configService = {
      get: (key: string, defaultValue: string) => {
        if (key === 'APP_NAME') {
          return 'new-product-development-backend';
        }

        if (key === 'APP_VERSION') {
          return '0.1.0';
        }

        return defaultValue;
      },
    };
    const controller = new HealthController(configService as ConfigService);

    assert.deepEqual(controller.check(), {
      service: 'new-product-development-backend',
      status: 'ok',
      version: '0.1.0',
    });
  });
});
