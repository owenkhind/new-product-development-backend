import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';

import { HealthController } from '../../src/modules/health/health.controller';
import { createHttpTestApp } from '../helpers/create-http-test-app';

describe('Health module wiring (e2e)', () => {
  let app: Awaited<ReturnType<typeof createHttpTestApp>>['app'];
  let controller: HealthController;
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

  before(async () => {
    const setup = await createHttpTestApp({
      controllers: [HealthController],
      providers: [
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    });

    app = setup.app;
    controller = new HealthController(configService as never);
  });

  after(async () => {
    await app.close();
  });

  it('returns health metadata through the wired module', () => {
    assert.deepEqual(controller.check(), {
      service: 'new-product-development-backend',
      status: 'ok',
      version: '0.1.0',
    });
  });
});
