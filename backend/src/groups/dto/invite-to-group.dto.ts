import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength } from 'class-validator';

// "@Paul.M " and "paul.m" name the same person.
const handle = ({ value }: { value: unknown }) =>
  typeof value === 'string'
    ? value.trim().replace(/^@/, '').toLowerCase()
    : value;

export class InviteToGroupDto {
  @ApiProperty({
    example: 'paul.martin',
    description: 'Username of the person to invite, with or without the @',
  })
  @Transform(handle)
  @IsString()
  @MaxLength(30)
  uniqueName: string;
}
