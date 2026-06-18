import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({
    example: 'Great workout',
    description: 'New content of the comment',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content: string;
}
