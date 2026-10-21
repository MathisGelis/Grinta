import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from './entities/exercise.entity';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { GetExercisesQueryDto } from './dto/get-exercises.query.dto';
import { DetailedMuscleGroup } from './enums/detailed-muscle.enum';

@Injectable()
export class ExerciseService {
  constructor(
    @InjectRepository(Exercise)
    private readonly exerciseRepository: Repository<Exercise>,
  ) {}

  async findAll(query: GetExercisesQueryDto): Promise<Exercise[]> {
    const qb = this.exerciseRepository.createQueryBuilder('exercise');

    if (query.equipmentType)
      qb.andWhere('exercise.equipment_type = :equipmentType', {
        equipmentType: query.equipmentType,
      });

    if (query.primaryMuscles) {
      const muscles = query.primaryMuscles
        .split(',')
        .map((m) => m.trim()) as DetailedMuscleGroup[];

      qb.andWhere('exercise.primary_muscle IN (:...muscles)', { muscles });
    }
    return qb.getMany();
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
}
