import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  IsNumber,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ example: 'johnny123', required: false })
  @IsOptional()
  @IsString()
  @MinLength(3)
  uniqueName?: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'NewPassword123!', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8)
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
