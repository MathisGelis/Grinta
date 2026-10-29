import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/auth.decorators';
import type { AuthenticatedRequest } from '../auth/auth-user.interface';
import { GroupActivityQueryDto } from './dto/group-activity-query.dto';
import { GroupNameDto } from './dto/group-name.dto';
import { InviteToGroupDto } from './dto/invite-to-group.dto';
import { GroupsService } from './groups.service';

const GROUP_DETAIL =
  '{ id, name, creatorId, createdAt, members: [{ id, uniqueName, displayName, avatarThumbnailUrl, joinedAt }], invitations: [{ id, createdAt, invitee: { id, uniqueName, displayName, avatarThumbnailUrl }, invitedById }] }';

// Invitation routes come before the :id ones, which would otherwise take
// "invitations" for a group id.
@ApiTags('groups')
@Auth()
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a group',
    description: 'The creator is its first member. 20 members at most.',
  })
  @ApiResponse({ status: 201, description: GROUP_DETAIL })
  create(@Req() req: AuthenticatedRequest, @Body() dto: GroupNameDto) {
    return this.groupsService.create(req.user.id, dto.name);
  }

  @Get()
  @ApiOperation({ summary: 'My groups, the last one joined first' })
  @ApiResponse({
    status: 200,
    description: '[{ id, name, creatorId, createdAt, joinedAt, memberCount }]',
  })
  listMine(@Req() req: AuthenticatedRequest) {
    return this.groupsService.listMine(req.user.id);
  }

  @Get('invitations')
  @ApiOperation({ summary: 'Group invitations I received' })
  @ApiResponse({
    status: 200,
    description:
      '[{ id, createdAt, group: { id, name, memberCount }, invitedBy: { id, uniqueName, displayName, avatarThumbnailUrl } }]',
  })
  myInvitations(@Req() req: AuthenticatedRequest) {
    return this.groupsService.myInvitations(req.user.id);
  }

  @Post('invitations/:invitationId/accept')
  @ApiOperation({ summary: 'Accept an invitation and join the group' })
  @ApiResponse({ status: 201, description: GROUP_DETAIL })
  @ApiResponse({ status: 404, description: 'Not an invitation of mine' })
  @ApiResponse({ status: 409, description: 'Group full' })
  accept(
    @Req() req: AuthenticatedRequest,
    @Param('invitationId') invitationId: string,
  ) {
    return this.groupsService.accept(req.user.id, invitationId);
  }

  @Delete('invitations/:invitationId')
  @ApiOperation({ summary: 'Decline an invitation' })
  @ApiResponse({ status: 200, description: '{ declined: true }' })
  @ApiResponse({ status: 404, description: 'Not an invitation of mine' })
  decline(
    @Req() req: AuthenticatedRequest,
    @Param('invitationId') invitationId: string,
  ) {
    return this.groupsService.decline(req.user.id, invitationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'A group, its members and pending invitations' })
  @ApiResponse({ status: 200, description: GROUP_DETAIL })
  @ApiResponse({ status: 404, description: 'Not a member of this group' })
  detail(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.groupsService.detail(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a group', description: 'Any member.' })
  @ApiResponse({ status: 200, description: GROUP_DETAIL })
  @ApiResponse({ status: 404, description: 'Not a member of this group' })
  rename(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: GroupNameDto,
  ) {
    return this.groupsService.rename(req.user.id, id, dto.name);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a group', description: 'Creator only.' })
  @ApiResponse({ status: 200, description: '{ deleted: true }' })
  @ApiResponse({ status: 403, description: 'Not the creator' })
  @ApiResponse({ status: 404, description: 'Not a member of this group' })
  remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.groupsService.remove(req.user.id, id);
  }

  @Post(':id/invitations')
  @ApiOperation({
    summary: 'Invite someone to the group by username',
    description:
      'Any member can invite, provided the member and the invitee follow each other. The invitee joins by accepting. Pending invitations count towards the 20 members.',
  })
  @ApiResponse({
    status: 201,
    description: 'The pending invitations of the group, the new one included',
  })
  @ApiResponse({ status: 403, description: 'Not following each other' })
  @ApiResponse({ status: 404, description: 'Unknown user, or not a member' })
  @ApiResponse({
    status: 409,
    description: 'Already a member, already invited, or group full',
  })
  invite(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: InviteToGroupDto,
  ) {
    return this.groupsService.invite(req.user.id, id, dto.uniqueName);
  }

  @Delete(':id/members/me')
  @ApiOperation({
    summary: 'Leave a group',
    description:
      'A leaving creator hands the group over to the member who joined first; the last member to leave deletes it.',
  })
  @ApiResponse({ status: 200, description: '{ left: true }' })
  @ApiResponse({ status: 404, description: 'Not a member of this group' })
  leave(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.groupsService.leave(req.user.id, id);
  }

  @Get(':id/activity')
  @ApiOperation({
    summary: 'Group feed: workouts members published, with their records',
    description:
      'One event per workout a member published (posted) after joining the group, most recent first, with the personal records that workout set. Unpublished workouts never appear. Next page: `before` = `at` of the last event.',
  })
  @ApiResponse({
    status: 200,
    description:
      '[{ postId, at, user: { id, uniqueName, displayName, avatarThumbnailUrl }, workout: { id, title }, records: [{ exercise: { id, name }, type, value, unit }] }]',
  })
  @ApiResponse({ status: 404, description: 'Not a member of this group' })
  activity(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query() query: GroupActivityQueryDto,
  ) {
    return this.groupsService.activity(req.user.id, id, query);
  }
}
