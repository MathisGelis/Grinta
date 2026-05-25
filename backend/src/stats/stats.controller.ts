import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/auth.decorators';
import { PeriodQueryDto } from './dto/period-query.dto';
import {
  ConsistencyDto,
  MuscleDistributionDto,
  MuscleFrequencyDto,
  PeriodSummaryDto,
  TrainingBalanceDto,
  WorkoutStatsDto,
} from './dto/stats-response.dto';
import { WorkoutStatsQueryDto } from './dto/workout-stats-query.dto';
import { StatsService } from './stats.service';

@ApiTags('stats')
@Auth()
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('workout/:id')
  @ApiOperation({
    summary: 'Get stats for a completed workout',
  })
  @ApiResponse({
    status: 200,
    description: 'Stats returned',
    type: WorkoutStatsDto,
  })
  @ApiResponse({ status: 404, description: 'Completed workout not found' })
  getWorkoutStats(
    @Req() req,
    @Param('id') id: string,
    @Query() query: WorkoutStatsQueryDto,
  ) {
    return this.statsService.getWorkoutStats(req.user, id, query.bodyWeightKg);
  }

  @Get('summary')
  @ApiOperation({
    summary: 'Weekly/monthly training summary',
  })
  @ApiResponse({
    status: 200,
    description: 'Summary returned',
    type: PeriodSummaryDto,
  })
  getSummary(@Req() req, @Query() query: PeriodQueryDto) {
    return this.statsService.getPeriodSummary(req.user, query);
  }

  @Get('muscle-distribution')
  @ApiOperation({
    summary: 'Weekly/monthly muscle distribution',
  })
  @ApiResponse({
    status: 200,
    description: 'Distribution returned',
    type: MuscleDistributionDto,
  })
  getMuscleDistribution(@Req() req, @Query() query: PeriodQueryDto) {
    return this.statsService.getMuscleDistribution(req.user, query);
  }

  @Get('balance')
  @ApiOperation({
    summary: 'Training balance (push/pull, upper/lower)',
  })
  @ApiResponse({
    status: 200,
    description: 'Balance returned',
    type: TrainingBalanceDto,
  })
  getBalance(@Req() req, @Query() query: PeriodQueryDto) {
    return this.statsService.getTrainingBalance(req.user, query);
  }

  @Get('consistency')
  @ApiOperation({
    summary: 'Consistency and streaks',
  })
  @ApiResponse({
    status: 200,
    description: 'Consistency returned',
    type: ConsistencyDto,
  })
  getConsistency(@Req() req) {
    return this.statsService.getConsistency(req.user);
  }

  @Get('muscle-frequency')
  @ApiOperation({
    summary: 'Muscle training frequency and recovery',
  })
  @ApiResponse({
    status: 200,
    description: 'Frequency returned',
    type: MuscleFrequencyDto,
  })
  getMuscleFrequency(@Req() req) {
    return this.statsService.getMuscleFrequency(req.user);
  }
}
