import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { toLowerTrimmed } from 'src/common/utils/normalize';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MaxLength(50)
  displayName: string;

  @ApiProperty({ example: 'johnny123' })
  @Transform(toLowerTrimmed)
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  uniqueName: string;

  @ApiProperty({ example: 'user@example.com' })
  @Transform(toLowerTrimmed)
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
