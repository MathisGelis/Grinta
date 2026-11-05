import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

// A signed JWT from Apple or Google is about 1 KB; the cap only stops abuse.
const MAX_TOKEN_LENGTH = 8192;

export class AppleFullNameDto {
  @ApiPropertyOptional({ example: 'Lucas' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  givenName?: string | null;

  @ApiPropertyOptional({ example: 'Moreau' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  familyName?: string | null;
}

export class AppleLoginDto {
  @ApiProperty({ description: 'identityToken from Sign in with Apple' })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_TOKEN_LENGTH)
  identityToken: string;

  @ApiPropertyOptional({
    type: AppleFullNameDto,
    description:
      'Apple gives the name to the app on the first sign-in only, outside ' +
      'the token: send it then, it becomes the display name.',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AppleFullNameDto)
  fullName?: AppleFullNameDto;
}

export class GoogleLoginDto {
  @ApiProperty({ description: 'idToken from Google Sign-In' })
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_TOKEN_LENGTH)
  idToken: string;
}
