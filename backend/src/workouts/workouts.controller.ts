import {
  Controller,
  Post,
  Body,
  Req,
  Patch,
  Param,
  Get,
  Delete,
  Put,
  Query,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Auth } from '../auth/auth.decorators';
import type { AuthenticatedRequest } from '../auth/auth-user.interface';
import { CreateCompletedWorkoutDto } from './dto/create-completed-workout.dto';
import { CreatePlannedWorkoutDto } from './dto/create-planned-workout.dto';
import { CompletedWorkoutListDto } from './dto/list-completed-workout.dto';
import { ListCompletedWorkoutsQueryDto } from './dto/list-completed-workouts-query.dto';
import { PlannedWorkoutListDto } from './dto/list-planned-workout.dto';
import { UpdateCompletedWorkoutDto } from './dto/update-completed-workout.dto';
import { UpdatePlannedWorkoutDto } from './dto/update-planned.workout.dto';
import { WorkoutService } from './workouts.service';
import { PhotoUpload } from '../photos/photo-upload.decorator';

@ApiTags('workouts')
@Auth()
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutService: WorkoutService) {}

  @Post('planned')
  @ApiOperation({ summary: 'Create a planned workout' })
  @ApiResponse({ status: 201, description: 'Planned workout created' })
  createPlanned(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreatePlannedWorkoutDto,
  ) {
    return this.workoutService.createPlannedWorkout(req.user, dto);
  }

  @Post('completed')
  @ApiOperation({ summary: 'Create a completed workout' })
  @ApiResponse({ status: 201, description: 'Completed workout saved' })
  createCompleted(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCompletedWorkoutDto,
  ) {
    return this.workoutService.createCompletedWorkout(req.user, dto);
  }

  @Patch('planned/:id')
  @ApiOperation({ summary: 'Update a planned workout' })
  @ApiResponse({ status: 200, description: 'Planned workout updated' })
  updatePlanned(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePlannedWorkoutDto,
  ) {
    return this.workoutService.updatePlannedWorkout(req.user, id, dto);
  }

  @Patch('completed/:id')
  @ApiOperation({ summary: 'Update a completed workout' })
  @ApiResponse({ status: 200, description: 'Completed workout updated' })
  updateCompleted(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCompletedWorkoutDto,
  ) {
    return this.workoutService.updateCompletedWorkout(req.user, id, dto);
  }

  @Get('planned')
  @ApiOperation({ summary: 'Get all planned workouts for current user' })
  @ApiResponse({
    status: 200,
    description: 'List returned',
    type: PlannedWorkoutListDto,
    isArray: true,
  })
  getPlanned(
    @Req() req: AuthenticatedRequest,
  ): Promise<PlannedWorkoutListDto[]> {
    return this.workoutService.getPlannedWorkouts(req.user);
  }

  @Get('completed')
  @ApiOperation({ summary: 'Get all completed workouts for current user' })
  @ApiResponse({
    status: 200,
    description: 'List returned',
    type: CompletedWorkoutListDto,
    isArray: true,
  })
  getCompleted(
    @Req() req: AuthenticatedRequest,
    @Query() page: ListCompletedWorkoutsQueryDto,
  ): Promise<CompletedWorkoutListDto[]> {
    return this.workoutService.getCompletedWorkouts(req.user, page);
  }

  @Get('planned/:id')
  @ApiOperation({ summary: 'Get a planned workout by ID' })
  @ApiResponse({
    status: 200,
    description: 'Workout returned',
    type: PlannedWorkoutListDto,
  })
  getPlannedById(@Param('id') id: string) {
    return this.workoutService.getPlannedWorkoutById(id);
  }

  @Get('completed/:id')
  @ApiOperation({ summary: 'Get a completed workout by ID' })
  @ApiResponse({
    status: 200,
    description: 'Workout returned',
    type: CompletedWorkoutListDto,
  })
  getCompletedById(@Param('id') id: string) {
    return this.workoutService.getCompletedWorkoutById(id);
  }

  @Put('completed/:id/photo')
  @PhotoUpload()
  @ApiOperation({
    summary: 'Set the photo of a completed workout',
    description:
      'Owner only. Multipart upload in the `photo` field. The photo is scaled down to 1600 px at most, re-encoded as WebP and stripped of its metadata (EXIF, GPS), and a 600 px thumbnail is made for lists and feeds. Replaces and deletes the previous one. Visible to whoever can read the workout, and the URL itself is public.',
  })
  @ApiResponse({ status: 200, description: '{ photoUrl, photoThumbnailUrl }' })
  @ApiResponse({ status: 400, description: 'No photo, or not an image' })
  @ApiResponse({ status: 404, description: 'Not a workout of the user' })
  @ApiResponse({ status: 413, description: 'Over 10 MB or 50 megapixels' })
  @ApiResponse({ status: 415, description: 'Not JPEG, PNG or WebP' })
  setCompletedPhoto(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.workoutService.setCompletedWorkoutPhoto(req.user, id, file);
  }

  @Delete('completed/:id/photo')
  @ApiOperation({ summary: 'Remove the photo of a completed workout' })
  @ApiResponse({
    status: 200,
    description: '{ photoUrl: null, photoThumbnailUrl: null }',
  })
  @ApiResponse({ status: 404, description: 'Not a workout of the user' })
  removeCompletedPhoto(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.workoutService.removeCompletedWorkoutPhoto(req.user, id);
  }

  @Delete('planned/:id')
  @ApiOperation({ summary: 'Delete a planned workout' })
  @ApiResponse({ status: 200, description: 'Planned workout deleted' })
  deletePlanned(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.workoutService.deletePlannedWorkout(req.user, id);
  }

  @Delete('completed/:id')
  @ApiOperation({ summary: 'Delete a completed workout' })
  @ApiResponse({ status: 200, description: 'Completed workout deleted' })
  deleteCompleted(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.workoutService.deleteCompletedWorkout(req.user, id);
  }
}
