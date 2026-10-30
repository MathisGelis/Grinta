import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Gender } from '../enums/gender.enum';
import { Goal } from '../enums/goal.enum';

@Entity('users')
@Unique(['email'])
@Unique(['uniqueName'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @ApiProperty()
  email: string;

  // Stripped from every serialized response by the global
  // ClassSerializerInterceptor, including when a User is nested in another
  // entity. The hash must only ever be read server-side.
  @Column()
  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  password: string;

  @Column()
  @ApiProperty()
  displayName: string;

  @Column()
  @ApiProperty()
  uniqueName: string;

  @Column({ default: true })
  @ApiProperty()
  isPublic: boolean;

  @Column({ type: 'date', nullable: true })
  @ApiProperty({ required: false })
  birthDate?: string;

  @Column({ type: 'float', nullable: true })
  @ApiProperty({ required: false })
  height?: number;

  @Column({ type: 'float', nullable: true })
  @ApiProperty({ required: false })
  weight?: number;

  /** Onboarding answers, private like the body measurements. */
  @Column({ type: 'enum', enum: Gender, nullable: true })
  @ApiProperty({ enum: Gender, required: false, nullable: true })
  gender?: Gender | null;

  @Column({ type: 'enum', enum: Goal, nullable: true })
  @ApiProperty({ enum: Goal, required: false, nullable: true })
  goal?: Goal | null;

  /** Set through PUT /users/me/avatar only, never through PATCH /users/:id. */
  @Column({ type: 'text', nullable: true })
  @ApiProperty({ type: String, required: false, nullable: true })
  avatarUrl?: string | null;

  /** 128 px copy of the profile photo, for lists. */
  @Column({ type: 'text', nullable: true })
  @ApiProperty({ type: String, required: false, nullable: true })
  avatarThumbnailUrl?: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @ApiProperty()
  createdAt: Date;

  /**
   * Last password change or reset. Tokens issued before it are refused by
   * JwtStrategy, so a reset logs out every other session.
   */
  @Column({ type: 'timestamp', nullable: true })
  @Exclude({ toPlainOnly: true })
  @ApiHideProperty()
  passwordChangedAt?: Date | null;
}
