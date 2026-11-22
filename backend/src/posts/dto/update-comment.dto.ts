import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';
import { COMMENT_MAX_LENGTH } from './comment-content';

export class UpdateCommentDto {
  @ApiProperty({
    example: 'Great workout',
    description: 'New content of the comment',
    minLength: 1,
    maxLength: COMMENT_MAX_LENGTH,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(COMMENT_MAX_LENGTH)
  content: string;
}
