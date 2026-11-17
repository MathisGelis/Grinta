import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsNumber,
  IsDateString,
  Matches,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Gender } from '../enums/gender.enum';
import { Goal } from '../enums/goal.enum';
import { TrainingLevel } from '../enums/level.enum';
import { TrainingLocation } from '../enums/training-location.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { toLowerTrimmed } from 'src/common/utils/normalize';
import { USERNAME_PATTERN, USERNAME_RULE_MESSAGE } from '../username';

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @ApiProperty({ example: 'johnny123', required: false })
  @IsOptional()
  @Transform(toLowerTrimmed)
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(USERNAME_PATTERN, { message: USERNAME_RULE_MESSAGE })
  uniqueName?: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @Transform(toLowerTrimmed)
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @ApiProperty({ example: 'NewPassword123!', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password?: string;

  @ApiProperty({ example: '1995-06-15', required: false })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiProperty({ example: 175.5, required: false })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiProperty({ example: 70.0, required: false })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiProperty({
    enum: Gender,
    required: false,
    nullable: true,
    description: 'Private, null clears it',
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender | null;

  @ApiProperty({
    enum: Goal,
    required: false,
    nullable: true,
    description: 'Private, null clears it',
  })
  @IsOptional()
  @IsEnum(Goal)
  goal?: Goal | null;

  @ApiProperty({
    enum: TrainingLevel,
    required: false,
    nullable: true,
    description: 'Private, null clears it',
  })
  @IsOptional()
  @IsEnum(TrainingLevel)
  level?: TrainingLevel | null;

  @ApiProperty({
    example: 3,
    minimum: 1,
    maximum: 7,
    required: false,
    nullable: true,
    description: 'Private, null clears it',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  trainingDaysPerWeek?: number | null;

  @ApiProperty({
    enum: TrainingLocation,
    required: false,
    nullable: true,
    description: 'Private, null clears it',
  })
  @IsOptional()
  @IsEnum(TrainingLocation)
  trainingLocation?: TrainingLocation | null;
}
