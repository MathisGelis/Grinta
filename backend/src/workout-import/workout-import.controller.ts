import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/auth.decorators';
import { ImportWorkoutDto } from './dto/import-workout.dto';
import { WorkoutImportService } from './workout-import.service';

@ApiTags('workout import')
@Auth()
@Controller('workouts/import')
export class WorkoutImportController {
  constructor(private readonly importer: WorkoutImportService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Read workout notes into a draft (nothing is saved)',
    description:
      'French and English notes: « dc 45x8 », « tractions 3x10 », ' +
      '« 4x8 à 60kg », « gainage 3x45s ». A first number above 12 or with a ' +
      'unit is a load (45x8 = 8 reps at 45 kg), otherwise a set count. Day ' +
      'headers (Lundi, Jour 1, Séance A, Day 1, Push :) make a programme. ' +
      'Lines that could not be read are listed in `unrecognized`.',
  })
  @ApiResponse({ status: 200, description: 'Draft returned' })
  importText(@Body() dto: ImportWorkoutDto) {
    return this.importer.importText(dto.text);
  }
}
