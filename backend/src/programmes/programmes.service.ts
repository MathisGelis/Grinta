import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Programme } from './entities/programme.entity';
import { ProgrammeDay } from './entities/programme-day.entity';
import { PlannedWorkout } from 'src/workouts/entities/planned-workout.entity';
import { User } from 'src/users/entities/users.entity';
import {
  CreateProgrammeDto,
  ProgrammeDayDto,
} from './dto/create-programme.dto';
import { UpdateProgrammeDto } from './dto/update-programme.dto';

@Injectable()
export class ProgrammesService {
  constructor(
    @InjectRepository(Programme)
    private programmeRepo: Repository<Programme>,

    @InjectRepository(ProgrammeDay)
    private dayRepo: Repository<ProgrammeDay>,

    @InjectRepository(PlannedWorkout)
    private workoutRepo: Repository<PlannedWorkout>,
  ) {}

  async createProgramme(
    user: User,
    dto: CreateProgrammeDto,
  ): Promise<Programme> {
    const programme = this.programmeRepo.create({
      user: { id: user.id },
      weekNumber: dto.weekNumber,
      difficulty: dto.difficulty,
      locationType: dto.locationType,
      title: dto.title,
      description: dto.description,
    });

    programme.days = await Promise.all(
      dto.days.map((dayDto) => this.buildDay(user, dayDto)),
    );
    return this.programmeRepo.save(programme);
  }

  async updateProgramme(
    user: User,
    id: string,
    dto: UpdateProgrammeDto,
  ): Promise<Programme> {
    const programme = await this.programmeRepo.findOne({
      where: { id, user: { id: user.id } },
      relations: ['days', 'days.workout'],
    });
    if (!programme) throw new NotFoundException('Programme not found');

    Object.assign(programme, dto);
    if (dto.days) {
      await this.dayRepo.delete({ programme: { id: programme.id } });
      programme.days = await Promise.all(
        dto.days.map((dayDto) => this.buildDay(user, dayDto)),
      );
    }
    return this.programmeRepo.save(programme);
  }

  async getProgrammesByUser(user: User) {
    const programmes = await this.programmeRepo.find({
      where: { user: { id: user.id } },
      order: { weekNumber: 'ASC' },
    });

    return programmes.map((p) => ({
      id: p.id,
      title: p.title,
      weekNumber: p.weekNumber,
      difficulty: p.difficulty,
    }));
  }

  async getProgrammeById(user: User, id: string) {
    const programme = await this.programmeRepo.findOne({
      where: { id, user: { id: user.id } },
      relations: ['days', 'days.workout'],
    });

    if (!programme) throw new NotFoundException('Programme not found');

    const days = [...programme.days].sort((a, b) => a.dayNumber - b.dayNumber);
    const workoutDays = days.filter((d) => d.workout !== null);

    return {
      id: programme.id,
      weekNumber: programme.weekNumber,
      difficulty: programme.difficulty,
      locationType: programme.locationType,
      title: programme.title,
      description: programme.description,
      totalWorkoutDays: workoutDays.length,
      days: days.map((day) => ({
        dayNumber: day.dayNumber,
        workout: day.workout
          ? {
              id: day.workout.id,
              title: day.workout.title,
              description: day.workout.description,
            }
          : null,
      })),
    };
  }

  async deleteProgramme(user: User, id: string): Promise<{ message: string }> {
    const programme = await this.programmeRepo.findOne({
      where: { id, user: { id: user.id } },
    });

    if (!programme) throw new NotFoundException('Programme not found');
    await this.programmeRepo.remove(programme);
    return { message: 'Programme deleted successfully' };
  }

  private async buildDay(
    user: User,
    dayDto: ProgrammeDayDto,
  ): Promise<ProgrammeDay> {
    let workout: PlannedWorkout | null = null;

    if (dayDto.workoutId) {
      workout = await this.workoutRepo.findOne({
        where: { id: dayDto.workoutId, user: { id: user.id } },
      });
      if (!workout)
        throw new NotFoundException(`Workout ${dayDto.workoutId} not found`);
    }
    return this.dayRepo.create({ dayNumber: dayDto.dayNumber, workout });
  }
}
