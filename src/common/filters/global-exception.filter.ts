import {
  ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type ErrorResponseBody = {
  code: string;
  details?: unknown;
  message: string;
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { requestId?: string }>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorBody = this.buildErrorBody(exception, status);

    response.status(status).json({
      ...errorBody,
      path: request.url,
      requestId: request.requestId ?? request.headers['x-request-id'] ?? 'unknown',
      timestamp: new Date().toISOString(),
    });
  }

  private buildErrorBody(exception: unknown, status: number): ErrorResponseBody {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return {
          code: this.defaultCode(status),
          message: response,
        };
      }

      const body = response as Partial<ErrorResponseBody> & { error?: string };

      return {
        code: body.code ?? this.defaultCode(status),
        details: body.details,
        message: body.message ?? body.error ?? exception.message,
      };
    }

    return {
      code: 'INTERNAL_SERVER_ERROR',
      details:
        exception instanceof Error
          ? {
              name: exception.name,
            }
          : undefined,
      message: 'An unexpected error occurred.',
    };
  }

  private defaultCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
