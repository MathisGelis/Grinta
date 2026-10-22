import { ApiProperty } from '@nestjs/swagger';

export class UserListDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  uniqueName: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty({ type: String, nullable: true })
  avatarUrl?: string | null;
}
