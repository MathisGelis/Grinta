import { ApiProperty } from '@nestjs/swagger';

export class UserListDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  uniqueName: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty({
    type: String,
    nullable: true,
    description: '128 px profile photo, or the full one if it has none',
  })
  avatarThumbnailUrl: string | null;
}
