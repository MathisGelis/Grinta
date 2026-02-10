import { Controller, Post, Body, Req, Patch, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Auth } from '../auth/auth.decorators';
import { CreateCompletedWorkoutDto } from './dto/create-completed-workout.dto';
import { CreatePlannedWorkoutDto } from './dto/create-planned-workout.dto';
import { UpdateCompletedWorkoutDto } from './dto/update-completed-workout.dto';
import { UpdatePlannedWorkoutDto } from './dto/update-planned.workout.dto';
import { WorkoutService } from './workouts.service';

@ApiTags('workouts')
@Auth()
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Post('planned')
  @ApiOperation({ summary: 'Create a planned workout' })
  @ApiResponse({ status: 201, description: 'Planned workout created' })
  createPlanned(@Req() req, @Body() dto: CreatePlannedWorkoutDto) {
    return this.workoutService.createPlannedWorkout(req.user, dto);
  }

  @Post('completed')
  @ApiOperation({ summary: 'Create a completed workout' })
  @ApiResponse({ status: 201, description: 'Completed workout saved' })
  createCompleted(@Req() req, @Body() dto: CreateCompletedWorkoutDto) {
    return this.workoutService.createCompletedWorkout(req.user, dto);
  }

  @Patch('planned/:id')
  @ApiOperation({ summary: 'Update a planned workout' })
  @ApiResponse({ status: 200, description: 'Planned workout updated' })
  updatePlanned(@Req() req, @Param('id') id: string, @Body() dto: UpdatePlannedWorkoutDto) {
    return this.workoutService.updatePlannedWorkout(req.user, id, dto);
  }

  @Patch('completed/:id')
  @ApiOperation({ summary: 'Update a completed workout' })
  @ApiResponse({ status: 200, description: 'Completed workout updated' })
  updateCompleted(@Req() req, @Param('id') id: string, @Body() dto: UpdateCompletedWorkoutDto) {
    return this.workoutService.updateCompletedWorkout(req.user, id, dto);
  }
}
