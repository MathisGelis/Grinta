import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Req,
  Post,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExerciseService } from './exercise.service';
import { UpdateUserExerciseStatsDto } from './dto/update-user-exercise-stats.dto';
import { Auth } from '../auth/auth.decorators';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { CreateExerciseDto } from './dto/create-exercise.dto';

@ApiTags('exercises')
@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Get()
  @ApiOperation({ summary: 'Get all exercises' })
  @ApiResponse({ status: 200, description: 'List of exercises returned' })
  async findAll() {
    return this.exerciseService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an exercise by ID' })
  @ApiResponse({ status: 200, description: 'Exercise found' })
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
    summary: 'Get user stats for an exercise',
    description:
      'Returns PR, last reps and last weight for the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Stats returned' })
  @ApiResponse({ status: 404, description: 'Exercise or stats not found' })
  async getStats(@Req() req, @Param('id') id: string) {
    return this.exerciseService.getUserStats(req.user, id);
  }

  @Auth()
  @Patch(':id/stats')
  @ApiOperation({
    summary: 'Update user stats for an exercise',
    description:
      'Update PR, last reps or last weight for the authenticated user',
  })
  @ApiResponse({ status: 200, description: 'Stats updated successfully' })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  async updateStats(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateUserExerciseStatsDto,
  ) {
    return this.exerciseService.updateUserStats(req.user, id, dto);
  }
}
