import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/entities/users.entity';
import { Difficulty } from '../enums/difficulty.enum';
import { LocationType } from '../enums/location-type.enum';
import { ProgrammeDay } from './programme-day.entity';

@Entity('programmes')
export class Programme {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty()
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  @ApiProperty()
  weekNumber: number;

  @Column({ type: 'enum', enum: Difficulty })
  @ApiProperty({ enum: Difficulty })
  difficulty: Difficulty;

  @Column({ type: 'enum', enum: LocationType })
  @ApiProperty({ enum: LocationType })
  locationType: LocationType;

  @Column()
  @ApiProperty()
  title: string;

  @Column({ type: 'text', nullable: true })
  @ApiProperty({ required: false })
  description?: string;

  @OneToMany(() => ProgrammeDay, (day) => day.programme, { cascade: true, eager: true })
  @ApiProperty({ type: () => [ProgrammeDay] })
  days: ProgrammeDay[];
}
