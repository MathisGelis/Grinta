import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Req,
  Post,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExerciseService } from './exercise.service';
import { ExerciseStatsService } from './exercise-stats.service';
import { ExerciseStatsDto } from './dto/exercise-stats.dto';
import { Auth } from '../auth/auth.decorators';
import type { AuthenticatedRequest } from '../auth/auth-user.interface';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { ExerciseDetailDto, ExerciseListDto } from './dto/exercise-list.dto';
import { GetExercisesQueryDto } from './dto/get-exercises.query.dto';

@ApiTags('exercises')
@Controller('exercises')
export class ExerciseController {
  constructor(
    private readonly exerciseService: ExerciseService,
    private readonly exerciseStats: ExerciseStatsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get all exercises',
    description:
      'Light list for browsing: use GET /exercises/:id for the description, instructions and photos.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of exercises returned',
    type: ExerciseListDto,
    isArray: true,
  })
  async findAll(@Query() query: GetExercisesQueryDto) {
    return this.exerciseService.findAll(query);
  }

  // Declared before ':id', otherwise 'stats' would be read as an exercise id.
  @Auth()
  @Get('stats')
  @ApiOperation({
    summary: 'Stats of every exercise the current user has trained',
    description:
      'Most recently trained first. Updated automatically each time a ' +
      'completed workout is saved, edited or deleted.',
  })
  @ApiResponse({
    status: 200,
    description: 'Stats returned',
    type: ExerciseStatsDto,
    isArray: true,
  })
  listMyStats(@Req() req: AuthenticatedRequest) {
    return this.exerciseStats.listForUser(req.user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get an exercise by ID',
    description:
      'Includes the description, the step-by-step instructions and the start and end position photos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Exercise found',
    type: ExerciseDetailDto,
  })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  async findOne(@Param('id') id: string) {
    return this.exerciseService.findOne(id);
  }

  @Auth()
  @Post()
  @ApiOperation({ summary: 'Create a new exercise' })
  @ApiResponse({ status: 201, description: 'Exercise created' })
  create(@Body() dto: CreateExerciseDto) {
    return this.exerciseService.create(dto);
  }

  @Auth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update an exercise' })
  @ApiResponse({ status: 200, description: 'Exercise updated' })
  update(@Param('id') id: string, @Body() dto: UpdateExerciseDto) {
    return this.exerciseService.update(id, dto);
  }

  @Auth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an exercise' })
  @ApiResponse({ status: 200, description: 'Exercise deleted' })
  delete(@Param('id') id: string) {
    return this.exerciseService.delete(id);
  }

  @Auth()
  @Get(':id/stats')
  @ApiOperation({
    summary: 'Stats of the current user for one exercise',
    description:
      'Last performance (top set and every set of the most recent session), ' +
      'personal records and totals. Updated automatically each time a ' +
      'completed workout is saved, edited or deleted.',
  })
  @ApiResponse({
    status: 200,
    description: 'Stats returned',
    type: ExerciseStatsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No completed workout contains this exercise yet',
  })
  async getStats(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.exerciseStats.getForUser(req.user.id, id);
  }
}
