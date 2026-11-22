import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { GROUP_MAX_MEMBERS } from '../entities/group.entity';
import { GroupNameDto } from './group-name.dto';

export class CreateGroupDto extends GroupNameDto {
  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    maxItems: GROUP_MAX_MEMBERS - 1,
    description:
      'People invited as the group is created. Each one must follow the ' +
      'creator and be followed back, as for POST /groups/:id/invitations; ' +
      'they join by accepting.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(GROUP_MAX_MEMBERS - 1, {
    message: `${GROUP_MAX_MEMBERS - 1} invités au plus : le groupe compte ${GROUP_MAX_MEMBERS} membres, créateur compris.`,
  })
  @ArrayUnique()
  @IsUUID('all', { each: true, message: 'Identifiant invalide' })
  userIds?: string[];
}
