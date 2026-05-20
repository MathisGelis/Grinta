import { ApiProperty } from '@nestjs/swagger';

export class UserListDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  uniqueName: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty({ required: false })
  image_url?: string;
}
