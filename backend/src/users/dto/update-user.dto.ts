import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsNumber,
  IsDateString,
  Matches,
} from 'class-validator';
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
}
