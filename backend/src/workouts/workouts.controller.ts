import { Controller, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Auth } from '../auth/auth.decorators';
import { WorkoutsService } from './workouts.service';
import { CreateWorkoutPlannedDto } from './dto/create-workout-planned.dto';
import { CreateWorkoutCompletedDto } from './dto/create-workout-completed.entity';

@ApiTags('workouts')
@Auth()
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutService: WorkoutsService) {}

  @Post('planned')
  @ApiOperation({ summary: 'Create a planned workout' })
  @ApiResponse({ status: 201, description: 'Planned workout created' })
  createPlanned(@Req() req, @Body() dto: CreateWorkoutPlannedDto) {
    return this.workoutService.createPlanned(req.user, dto);
  }

  @Post('completed')
  @ApiOperation({ summary: 'Create a completed workout' })
  @ApiResponse({ status: 201, description: 'Completed workout saved' })
  createCompleted(@Req() req, @Body() dto: CreateWorkoutCompletedDto) {
    return this.workoutService.createCompleted(req.user, dto);
  }
}
