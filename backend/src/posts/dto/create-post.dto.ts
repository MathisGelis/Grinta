import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    example: 'a3f1c9b2-7c2a-4d9e-8f12-123456789abc',
    description: 'Workout ID used to create the post',
  })
  @IsUUID()
  workoutId: string;
}
