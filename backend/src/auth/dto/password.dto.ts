import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { toLowerTrimmed } from '../../common/utils/normalize';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @Transform(toLowerTrimmed)
  @IsEmail()
  @MaxLength(254)
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'The token of the link received by email' })
  @IsString()
  @Length(20, 200)
  token: string;

  @ApiProperty({ example: 'NewPassword123!', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MaxLength(72)
  currentPassword: string;

  @ApiProperty({ example: 'NewPassword123!', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword: string;
}
