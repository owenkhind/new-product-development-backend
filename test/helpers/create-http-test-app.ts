import {
  BadRequestException,
  ValidationPipe,
  type ExecutionContext,
  type INestApplication,
} from '@nestjs/common';
import type { ModuleMetadata } from '@nestjs/common/interfaces/modules/module-metadata.interface';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';

import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';
import { LoggingInterceptor } from '../../src/interceptors/logging.interceptor';

type TestAppSetup = {
  app: INestApplication;
  moduleRef: TestingModule;
};

export async function createHttpTestApp(metadata: ModuleMetadata): Promise<TestAppSetup> {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL =
    'postgresql://test:test@localhost:5432/new_product_development_test?schema=public';

  const moduleRef = await Test.createTestingModule({
    ...metadata,
    providers: [...(metadata.providers ?? []), Reflector],
  }).compile();
  const app = moduleRef.createNestApplication();

  app.setGlobalPrefix('v1');
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.map((error) => ({
            field: error.property,
            errors: Object.values(error.constraints ?? {}),
          })),
        }),
    }),
  );

  await app.init();

  return {
    app,
    moduleRef,
  };
}

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: errors.map((error) => ({
          field: error.property,
          errors: Object.values(error.constraints ?? {}),
        })),
      }),
  });
}

export function createExecutionContext(input: {
  controllerClass: object;
  handlerName: string;
  request: Record<string, unknown>;
}): ExecutionContext {
  return {
    getArgs: () => [input.request],
    getClass: () => input.controllerClass.constructor as never,
    getHandler: () =>
      (input.controllerClass as Record<string, unknown>)[input.handlerName] as never,
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => input.request,
      getResponse: () => undefined,
      getNext: () => undefined,
    }),
  } as never;
}
