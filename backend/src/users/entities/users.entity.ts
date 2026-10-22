import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

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

  /** Set through PUT /users/me/avatar only, never through PATCH /users/:id. */
  @Column({ type: 'text', nullable: true })
  @ApiProperty({ type: String, required: false, nullable: true })
  avatarUrl?: string | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @ApiProperty()
  createdAt: Date;
}
