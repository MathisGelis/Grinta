import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from '../exercise/entities/exercise.entity';
import { ExerciseTranslationService } from '../exercise/i18n/exercise-translation.service';
import { ExerciseMatcher } from './exercise-matcher';
import { parseWorkoutText, WorkoutDraft } from './parse-workout-text';

@Injectable()
export class WorkoutImportService {
  private matcher?: ExerciseMatcher;

  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepo: Repository<Exercise>,
    private readonly translations: ExerciseTranslationService,
  ) {}

  /** Reads the notes into a draft; nothing is saved. */
  async importText(text: string): Promise<WorkoutDraft> {
    return parseWorkoutText(text, await this.catalogueMatcher());
  }

  /**
   * Built once from the catalogue, which only changes with a deployment.
   * Not kept while the catalogue is still empty.
   */
  private async catalogueMatcher(): Promise<ExerciseMatcher> {
    if (this.matcher) return this.matcher;
    const exercises = await this.exerciseRepo.find({ select: ['id', 'name'] });
    const matcher = new ExerciseMatcher(
      exercises.map((e) => ({
        id: e.id,
        name: e.name,
        altNames: this.translations.allNames(e.name),
      })),
    );

    if (exercises.length) this.matcher = matcher;
    return matcher;
  }
}
