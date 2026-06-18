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
import { Throttle } from '@nestjs/throttler';
import { Auth } from 'src/auth/auth.decorators';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { ReportCommentDto } from './dto/report-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { PostsService } from './posts.service';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Auth()
  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a new post from a workout' })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  async createPost(@Req() req, @Body() dto: CreatePostDto) {
    return this.postsService.createPost(req.user.id, dto.workoutId);
  }

  @Auth()
  @Delete(':postId')
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully' })
  @ApiResponse({ status: 403, description: 'Not allowed' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async deletePost(@Req() req, @Param('postId') postId: string) {
    return this.postsService.deletePost(req.user.id, postId);
  }

  @Auth()
  @Patch(':postId/like')
  @ApiOperation({ summary: 'Toggle like on a post' })
  @ApiResponse({ status: 200, description: 'Like toggled' })
  async toggleLike(@Req() req, @Param('postId') postId: string) {
    return this.postsService.toggleLike(req.user.id, postId);
  }

  @Auth()
  @Get(':postId/likes')
  @ApiOperation({ summary: 'Get list of users who liked a post' })
  @ApiResponse({ status: 200, description: 'Likes list returned' })
  async getLikes(@Param('postId') postId: string) {
    return this.postsService.getLikesList(postId);
  }

  @Auth()
  @Post(':postId/comments')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Comment on a post' })
  @ApiResponse({ status: 201, description: 'Comment added' })
  @ApiResponse({ status: 400, description: 'Comment rejected by moderation' })
  async commentPost(
    @Req() req,
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postsService.commentPost(req.user.id, postId, dto.content);
  }

  @Auth()
  @Patch('comments/:commentId')
  @ApiOperation({ summary: 'Edit your own comment' })
  @ApiResponse({ status: 200, description: 'Comment updated' })
  @ApiResponse({ status: 400, description: 'Comment rejected by moderation' })
  @ApiResponse({ status: 403, description: 'Not allowed' })
  async editComment(
    @Req() req,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.postsService.editComment(req.user.id, commentId, dto.content);
  }

  @Auth()
  @Delete('comments/:commentId')
  @ApiOperation({ summary: 'Delete a comment (own comment or on your post)' })
  @ApiResponse({ status: 200, description: 'Comment deleted' })
  @ApiResponse({ status: 403, description: 'Not allowed' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async deleteComment(@Req() req, @Param('commentId') commentId: string) {
    return this.postsService.deleteComment(req.user.id, commentId);
  }

  @Auth()
  @Post('comments/:commentId/report')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Report a comment' })
  @ApiResponse({ status: 201, description: 'Comment reported' })
  @ApiResponse({
    status: 400,
    description: 'Own comment, or already reported by this user',
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async reportComment(
    @Req() req,
    @Param('commentId') commentId: string,
    @Body() dto: ReportCommentDto,
  ) {
    return this.postsService.reportComment(req.user.id, commentId, dto.reason);
  }

  @Auth()
  @Get(':postId/comments')
  @ApiOperation({ summary: 'Get comments for a post' })
  @ApiResponse({ status: 200, description: 'Comments list returned' })
  async getComments(@Param('postId') postId: string) {
    return this.postsService.getCommentsList(postId);
  }

  @Auth()
  @Get('feed/following')
  @ApiOperation({ summary: 'Get feed from followed users' })
  @ApiResponse({ status: 200, description: 'Following feed returned' })
  async getFollowingFeed(@Req() req, @Query('limit') limit?: number) {
    return this.postsService.getFollowingFeed(req.user.id, limit || 20);
  }

  @Auth()
  @Get('feed/top')
  @ApiOperation({ summary: "Get this month's top posts" })
  @ApiResponse({ status: 200, description: 'Top posts returned' })
  async getTopPosts(@Req() req, @Query('limit') limit?: number) {
    return this.postsService.getTopPostsThisMonth(req.user.id, limit || 20);
  }
}
