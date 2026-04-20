import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { HealthController } from '../src/modules/health/health.controller';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  'postgresql://test:test@localhost:5432/new_product_development_test?schema=public';

describe('Health endpoint (e2e)', () => {
  let controller: HealthController;
  let moduleRef: TestingModule;

  before(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const configService = moduleRef.get(ConfigService);
    controller = new HealthController(configService);
  });

  after(async () => {
    await moduleRef.close();
  });

  it('AppModule wires the health controller correctly', async () => {
    const response = controller.check();

    assert.equal(typeof response.service, 'string');
    assert.equal(response.status, 'ok');
    assert.equal(typeof response.version, 'string');
    assert.deepEqual(response, {
      service: response.service,
      status: 'ok',
      version: response.version,
    });
  });
});
