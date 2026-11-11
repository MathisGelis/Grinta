import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciseController } from './exercise.controller';
import { Exercise } from './entities/exercise.entity';
import { ExerciseService } from './exercise.service';
import { UserExerciseStats } from './entities/user-exercise-stats.entity';
import { ExerciseStatsService } from './exercise-stats.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ExerciseLocaleInterceptor } from './i18n/exercise-locale.interceptor';
import { ExerciseTranslationService } from './i18n/exercise-translation.service';

@Module({
  imports: [TypeOrmModule.forFeature([Exercise, UserExerciseStats])],
  controllers: [ExerciseController],
  providers: [
    ExerciseService,
    ExerciseStatsService,
    ExerciseTranslationService,
    { provide: APP_INTERCEPTOR, useClass: ExerciseLocaleInterceptor },
  ],
  exports: [ExerciseStatsService, ExerciseTranslationService],
})
export class ExerciseModule {}
