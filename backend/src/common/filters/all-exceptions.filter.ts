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
import { ValidationFailedException } from '../validation/validation-errors';

// Postgres error code for a malformed value, e.g. a non-uuid string compared
// against a uuid column.
const PG_INVALID_TEXT_REPRESENTATION = '22P02';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Validation errors keep their structured body at the top level:
    // { statusCode, code, message, errors }.
    if (exception instanceof ValidationFailedException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: unknown = { message: 'Internal server error' };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'object' ? res : { message: res };
    } else if (this.isInvalidIdentifier(exception)) {
      status = HttpStatus.BAD_REQUEST;
      message = { message: 'Identifiant invalide' };
    } else {
      // Anything else is an unexpected failure. The detail (SQL fragments,
      // constraint names, stack) stays in the server log and never reaches
      // the client.
      this.logger.error(
        exception instanceof Error ? exception.message : String(exception),
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      statusCode: status,
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
