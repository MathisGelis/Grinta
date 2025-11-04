import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('users')
@Unique(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @ApiProperty()
  email: string;

  @Column()
  @ApiProperty()
  password: string;

  @Column()
  @ApiProperty()
  name: string;

  @Column({ type: 'date', nullable: true })
  @ApiProperty({ required: false })
  birthDate?: string;

  @Column({ type: 'float', nullable: true })
  @ApiProperty({ required: false })
  height?: number;

  @Column({ type: 'float', nullable: true })
  @ApiProperty({ required: false })
  weight?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @ApiProperty()
  createdAt: Date;
}
