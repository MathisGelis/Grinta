import {
  ArgumentsHost,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { AllExceptionsFilter } from './all-exceptions.filter';

function buildHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let logError: jest.SpyInstance;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    logError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('forwards HttpException status and payload', () => {
    const { host, status, json } = buildHost();

    filter.catch(new NotFoundException('Post not found'), host);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Post not found',
    });
  });

  it('keeps validation errors readable', () => {
    const { host, status } = buildHost();

    filter.catch(new BadRequestException(['name must be a string']), host);
    expect(status).toHaveBeenCalledWith(400);
  });

  it('maps a malformed uuid to a generic 400 without leaking the SQL error', () => {
    const { host, status, json } = buildHost();
    const driverError = Object.assign(
      new Error('invalid input syntax for type uuid: "x"'),
      { code: '22P02' },
    );

    filter.catch(new QueryFailedError('SELECT 1', [], driverError), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(JSON.stringify(json.mock.calls[0][0])).not.toContain('uuid');
  });

  it('turns a body-parser size error into 413 PAYLOAD_TOO_LARGE', () => {
    const { host, status, json } = buildHost();

    filter.catch(
      Object.assign(new Error('request entity too large'), {
        status: 413,
        type: 'entity.too.large',
      }),
      host,
    );
    expect(status).toHaveBeenCalledWith(413);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PAYLOAD_TOO_LARGE' }),
    );
  });

  it('hides unexpected error details behind a generic 500 and logs them', () => {
    const { host, status, json } = buildHost();

    filter.catch(
      new Error('duplicate key value violates unique constraint "UQ_secret"'),
      host,
    );
    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
    expect(logError).toHaveBeenCalled();
  });
});
