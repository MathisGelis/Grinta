import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/auth.decorators';
import type { AuthenticatedRequest } from '../auth/auth-user.interface';
import { AdherenceQueryDto } from './dto/adherence-query.dto';
import { HeatmapQueryDto } from './dto/heatmap-query.dto';
import { PeriodQueryDto } from './dto/period-query.dto';
import { ProgressionQueryDto } from './dto/progression-query.dto';
import {
  AdherenceDto,
  ComparisonsDto,
  ConsistencyDto,
  HeatmapDto,
  MuscleDistributionDto,
  MuscleFrequencyDto,
  PeriodSummaryDto,
  ProgressionDto,
  RecordsDto,
  TrainingBalanceDto,
  WorkoutStatsDto,
  WorkoutTypeBreakdownDto,
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
    @Req() req: AuthenticatedRequest,
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
  getSummary(@Req() req: AuthenticatedRequest, @Query() query: PeriodQueryDto) {
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
  getMuscleDistribution(
    @Req() req: AuthenticatedRequest,
    @Query() query: PeriodQueryDto,
  ) {
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
  getBalance(@Req() req: AuthenticatedRequest, @Query() query: PeriodQueryDto) {
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
  getConsistency(@Req() req: AuthenticatedRequest) {
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
  getMuscleFrequency(@Req() req: AuthenticatedRequest) {
    return this.statsService.getMuscleFrequency(req.user);
  }

  @Get('progression')
  @ApiOperation({
    summary: 'Progression of one exercise over time',
    description:
      'One point per training day for the chosen metric, plus a summary with ' +
      'the first, latest and best points and an overall trend. Days are UTC.',
  })
  @ApiResponse({
    status: 200,
    description: 'Progression returned',
    type: ProgressionDto,
  })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  getProgression(
    @Req() req: AuthenticatedRequest,
    @Query() query: ProgressionQueryDto,
  ) {
    return this.statsService.getProgression(req.user, query);
  }

  @Get('records')
  @ApiOperation({
    summary: 'Personal records',
    description:
      'Best estimated 1RM, heaviest weight and best single-workout volume ' +
      'for every exercise, plus the longest workout, the highest-volume ' +
      'workout and the longest training streak.',
  })
  @ApiResponse({
    status: 200,
    description: 'Records returned',
    type: RecordsDto,
  })
  getRecords(@Req() req: AuthenticatedRequest) {
    return this.statsService.getRecords(req.user);
  }

  @Get('adherence')
  @ApiOperation({
    summary: 'How closely a completed workout followed its plan',
    description:
      'The completed workout must belong to the caller. The planned workout ' +
      'can be any readable plan. Exercises are listed in the stored order of ' +
      'the plan.',
  })
  @ApiResponse({
    status: 200,
    description: 'Adherence returned',
    type: AdherenceDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Completed or planned workout not found',
  })
  getAdherence(
    @Req() req: AuthenticatedRequest,
    @Query() query: AdherenceQueryDto,
  ) {
    return this.statsService.getAdherence(req.user, query);
  }

  @Get('comparisons')
  @ApiOperation({
    summary: 'Current period against your personal average',
    description:
      'Compares the period so far with the average of your previous full ' +
      'periods (8 weeks or 6 months). The average is pro-rated by the share ' +
      'of the current period already elapsed, so a Tuesday is not judged ' +
      'against a full week.',
  })
  @ApiResponse({
    status: 200,
    description: 'Comparison returned',
    type: ComparisonsDto,
  })
  getComparisons(
    @Req() req: AuthenticatedRequest,
    @Query() query: PeriodQueryDto,
  ) {
    return this.statsService.getComparisons(req.user, query);
  }

  @Get('workout-type-breakdown')
  @ApiOperation({
    summary: 'Sets and volume by exercise type and by equipment',
  })
  @ApiResponse({
    status: 200,
    description: 'Breakdown returned',
    type: WorkoutTypeBreakdownDto,
  })
  getWorkoutTypeBreakdown(
    @Req() req: AuthenticatedRequest,
    @Query() query: PeriodQueryDto,
  ) {
    return this.statsService.getWorkoutTypeBreakdown(req.user, query);
  }

  @Get('heatmap')
  @ApiOperation({
    summary: 'Yearly activity calendar',
    description:
      'Days with at least one workout, each with an intensity level from 1 ' +
      'to 4 relative to your longest day of the year. Days are UTC.',
  })
  @ApiResponse({
    status: 200,
    description: 'Heatmap returned',
    type: HeatmapDto,
  })
  getHeatmap(
    @Req() req: AuthenticatedRequest,
    @Query() query: HeatmapQueryDto,
  ) {
    return this.statsService.getHeatmap(req.user, query);
  }
}
