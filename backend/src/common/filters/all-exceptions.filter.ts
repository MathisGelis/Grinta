import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

// Postgres error code for a malformed value, e.g. a non-uuid string compared
// against a uuid column.
const PG_INVALID_TEXT_REPRESENTATION = '22P02';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Errors with a stable code keep their structured body at the top level:
    // validation ({ statusCode, code, message, errors }), rate limits
    // ({ statusCode, code, message, retryAfterSeconds }).
    if (
      exception instanceof HttpException &&
      hasCode(exception.getResponse())
    ) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = readMessage(exception.getResponse());
    } else if (isPayloadTooLarge(exception)) {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      message = 'Requête trop volumineuse';
    } else if (this.isInvalidIdentifier(exception)) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Identifiant invalide';
    } else {
      // Anything else is an unexpected failure. The detail (SQL fragments,
      // constraint names, stack) stays in the server log and never reaches
      // the client.
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    // One shape for every error: { statusCode, code, message }.
    response.status(status).json({
      statusCode: status,
      code: codeForStatus(status),
      message,
    });
  }

  private isInvalidIdentifier(exception: unknown): boolean {
    return (
      exception instanceof QueryFailedError &&
      (exception.driverError as { code?: string } | undefined)?.code ===
        PG_INVALID_TEXT_REPRESENTATION
    );
  }
}

function hasCode(body: unknown): boolean {
  return (
    typeof body === 'object' &&
    body !== null &&
    typeof (body as { code?: unknown }).code === 'string'
  );
}

const STATUS_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
};

/** Stable machine-readable code for errors that carry no code of their own. */
function codeForStatus(status: number): string {
  return (
    STATUS_CODES[status] ??
    (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED')
  );
}

/** Flattens Nest's response body (string, { message }, or a list) to text. */
function readMessage(body: unknown): string {
  if (typeof body === 'string') return body;
  const message = (body as { message?: unknown } | null)?.message;
  if (Array.isArray(message)) return message.map(String).join(', ');
  if (typeof message === 'string') return message;
  return 'Erreur';
}

// body-parser rejects an oversized body before any controller runs.
function isPayloadTooLarge(exception: unknown): boolean {
  const error = exception as { type?: unknown; status?: unknown } | null;
  return error?.type === 'entity.too.large' || error?.status === 413;
}
