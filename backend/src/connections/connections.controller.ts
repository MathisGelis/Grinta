import { Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConnectionsService } from './connections.service';
import { Auth } from 'src/auth/auth.decorators';
import { UserListDto } from 'src/users/dto/users-list.dto';

@ApiTags('connections')
@Controller('connections')
export class ConnectionsController {
  constructor(private readonly connectionsService: ConnectionsService) {}

  @Auth()
  @Post(':id/follow')
  @ApiOperation({ summary: 'Follow a user by ID' })
  @ApiResponse({ status: 200, description: 'User successfully followed' })
  @ApiResponse({ status: 400, description: 'Already following this user' })
  follow(@Param('id') followingId: string, @Req() req) {
    return this.connectionsService.followUser(req.user.id, followingId);
  }

  @Auth()
  @Delete(':id/unfollow')
  @ApiOperation({ summary: 'Unfollow a user by ID' })
  @ApiResponse({ status: 200, description: 'User successfully unfollowed' })
  @ApiResponse({ status: 404, description: 'Connection not found' })
  unfollow(@Param('id') followingId: string, @Req() req) {
    return this.connectionsService.unfollowUser(req.user.id, followingId);
  }

  @Auth()
  @Get(':id/followers')
  @ApiOperation({ summary: 'Get followers of a user' })
  @ApiResponse({
    status: 200,
    description: 'List of followers',
    type: UserListDto,
    isArray: true,
  })
  getFollowers(@Param('id') userId: string) {
    return this.connectionsService.getFollowers(userId);
  }

  @Auth()
  @Get(':id/following')
  @ApiOperation({ summary: 'Get users followed by a user' })
  @ApiResponse({
    status: 200,
    description: 'List of following users',
    type: UserListDto,
    isArray: true,
  })
  getFollowing(@Param('id') userId: string) {
    return this.connectionsService.getFollowing(userId);
  }

  @Auth()
  @Get('recommendations')
  @ApiOperation({ summary: 'Get user recommendations' })
  @ApiResponse({
    status: 200,
    description: 'List of recommended users',
    type: UserListDto,
    isArray: true,
  })
  getRecommendations(@Req() req) {
    return this.connectionsService.recommendUsers(req.user.id);
  }
}
