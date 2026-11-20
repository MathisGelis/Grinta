import {
  Controller,
  Get,
  HttpCode,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';

// Polled by the app and by monitoring, so never rate limited.
@ApiTags('health')
@SkipThrottle()
@Controller()
export class AppController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'The API process answers' })
  @ApiResponse({ status: 200, description: '{ status: "ok" }' })
  root() {
    return { status: 'ok' };
  }

  @Get('health')
  @HttpCode(200)
  @ApiOperation({
    summary: 'The API and its database answer',
    description:
      'Runs SELECT 1 on the database. No authentication, no rate limit.',
  })
  @ApiResponse({ status: 200, description: '{ status: "ok", database: "ok" }' })
  @ApiResponse({
    status: 503,
    description: '{ status: "error", database: "unreachable" }',
  })
  async health() {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        database: 'unreachable',
      });
    }
    return { status: 'ok', database: 'ok' };
  }
}
