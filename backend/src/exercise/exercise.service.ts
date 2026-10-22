import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from './entities/exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { GetExercisesQueryDto } from './dto/get-exercises.query.dto';

/**
 * How long the catalogue list is served from memory. Writes through this
 * service clear it at once; the TTL only bounds how stale another API process
 * (PM2 cluster mode) can be after a write it did not see.
 */
export const CATALOGUE_TTL_MS = 5 * 60_000;

@Injectable()
export class ExerciseService {
  private catalogue: { loadedAt: number; exercises: Exercise[] } | null = null;
  // Bumped by every write, so a list read before a write is never cached.
  private catalogueVersion = 0;

  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
  ) {}

  /**
   * The catalogue list leaves out description, instructions and image_urls:
   * with them the response grows from about 100 KB to 260 KB for the base
   * catalogue, and the app downloads and caches the whole list. They are
   * returned by GET /exercises/:id, where the exercise is shown in detail.
   *
   * The list is the same for every user and changes only when an exercise
   * is created, edited or deleted, so it is kept in memory and filtered
   * there: about 100 KB read from the database once instead of on every call.
   */
  async findAll(query: GetExercisesQueryDto): Promise<Exercise[]> {
    const exercises = await this.loadCatalogue();
    const muscles = query.primaryMuscles
      ? new Set(query.primaryMuscles.split(',').map((m) => m.trim()))
      : null;

    if (!query.equipmentType && !muscles) return exercises;
    return exercises.filter(
      (e) =>
        (!query.equipmentType || e.equipment_type === query.equipmentType) &&
        (!muscles || muscles.has(e.primary_muscle)),
    );
  }

  private async loadCatalogue(): Promise<Exercise[]> {
    if (
      this.catalogue &&
      Date.now() - this.catalogue.loadedAt < CATALOGUE_TTL_MS
    )
      return this.catalogue.exercises;
    const loadedAt = Date.now();
    const version = this.catalogueVersion;
    const exercises = await this.exerciseRepository
      .createQueryBuilder('exercise')
      .select([
        'exercise.id',
        'exercise.name',
        'exercise.equipment_type',
        'exercise.primary_muscle',
        'exercise.secondary_muscles',
        'exercise.exercise_type',
        'exercise.image_url',
        'exercise.createdAt',
      ])
      .orderBy('exercise.createdAt', 'ASC')
      .addOrderBy('exercise.id', 'ASC')
      .getMany();

    if (version === this.catalogueVersion)
      this.catalogue = { loadedAt, exercises };
    return exercises;
  }

  private invalidateCatalogue() {
    this.catalogue = null;
    this.catalogueVersion++;
  }

  async findOne(id: string): Promise<Exercise> {
    const exercise = await this.exerciseRepository
      .createQueryBuilder('exercise')
      .addSelect([
        'exercise.description',
        'exercise.instructions',
        'exercise.image_urls',
      ])
      .where('exercise.id = :id', { id })
      .getOne();

    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  async create(dto: CreateExerciseDto) {
    const exercise = this.exerciseRepository.create(dto);
    const saved = await this.exerciseRepository.save(exercise);

    this.invalidateCatalogue();
    return saved;
  }

  async update(id: string, dto: UpdateExerciseDto) {
    const exercise = await this.findOne(id);

    Object.assign(exercise, dto);
    const saved = await this.exerciseRepository.save(exercise);

    this.invalidateCatalogue();
    return saved;
  }

  async delete(id: string) {
    const exercise = await this.findOne(id);

    await this.exerciseRepository.remove(exercise);
    this.invalidateCatalogue();
    return { message: 'Exercise deleted successfully' };
  }
}
