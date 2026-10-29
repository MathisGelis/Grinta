import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ShareToGroupDto {
  @ApiProperty({ description: 'Post to send to the group' })
  @IsUUID('all', { message: 'Identifiant invalide' })
  postId: string;
}
