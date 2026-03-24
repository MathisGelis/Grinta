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
  name?: string;

  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'newpassword123', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
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
