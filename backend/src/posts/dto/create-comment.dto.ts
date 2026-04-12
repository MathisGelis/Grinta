import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Great workout',
    description: 'Content of the comment',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  content: string;
}
