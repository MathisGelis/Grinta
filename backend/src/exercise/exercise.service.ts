import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from './entities/exercise.entity';
import { UserExerciseStats } from './entities/user-exercise-stats.entity';
import { UpdateUserExerciseStatsDto } from './dto/update-user-exercise-stats.dto';
import { User } from '../users/entities/users.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

@Injectable()
export class ExerciseService {
  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,

    @InjectRepository(UserExerciseStats)
    private readonly statsRepository: Repository<UserExerciseStats>,
  ) {}

  findAll(): Promise<Exercise[]> {
    return this.exerciseRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string): Promise<Exercise> {
    const exercise = await this.exerciseRepository.findOne({ where: { id } });

    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  async create(dto: CreateExerciseDto) {
    const exercise = this.exerciseRepository.create(dto);

    return this.exerciseRepository.save(exercise);
  }

  async update(id: string, dto: UpdateExerciseDto) {
    const exercise = await this.findOne(id);

    Object.assign(exercise, dto);
    return this.exerciseRepository.save(exercise);
  }

  async delete(id: string) {
    const exercise = await this.findOne(id);

    await this.exerciseRepository.remove(exercise);
    return { message: 'Exercise deleted successfully' };
  }

  // USER-SPECIFIC STATS
  async updateUserStats(
    user: User,
    exerciseId: string,
    dto: UpdateUserExerciseStatsDto,
  ): Promise<UserExerciseStats> {
    const exercise = await this.findOne(exerciseId);

    let stats = await this.statsRepository.findOne({
      where: {
        user: { id: user.id },
        exercise: { id: exercise.id },
      },
      relations: ['user', 'exercise'],
    });

    if (!stats) {
      stats = this.statsRepository.create({
        user,
        exercise,
      });
    }

    Object.assign(stats, dto);
    return this.statsRepository.save(stats);
  }

  async getUserStats(user: User, exerciseId: string) {
    return this.statsRepository.findOne({
      where: {
        user: { id: user.id },
        exercise: { id: exerciseId },
      },
    });
  }
}
