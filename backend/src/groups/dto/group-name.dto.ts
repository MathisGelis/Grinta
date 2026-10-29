import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';
import { GROUP_NAME_MAX_LENGTH } from '../entities/group.entity';

const trimmed = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** Name of a group, to create one or rename it. */
export class GroupNameDto {
  @ApiProperty({ example: 'Team du mardi', maxLength: GROUP_NAME_MAX_LENGTH })
  @Transform(trimmed)
  @IsString()
  @Length(1, GROUP_NAME_MAX_LENGTH, {
    message: `Le nom du groupe doit faire entre 1 et ${GROUP_NAME_MAX_LENGTH} caractères.`,
  })
  name: string;
}
