import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Put,
  Query,
  Req,
  UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Auth } from 'src/auth/auth.decorators';
import type { AuthenticatedRequest } from 'src/auth/auth-user.interface';
import { UserListDto } from './dto/users-list.dto';
import { PhotoUpload } from 'src/photos/photo-upload.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async register(@Body() user: CreateUserDto) {
    return this.usersService.registerUser(user);
  }

  // Static segments are declared before ':id' so they are never captured as an id.
  @Auth()
  @Get('search')
  @ApiOperation({
    summary: 'Search for users by name',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users returned',
    type: UserListDto,
    isArray: true,
  })
  searchUsers(@Query('q') query: string, @Req() req: AuthenticatedRequest) {
    return this.usersService.searchUsers(query, req.user.id);
  }

  @Auth()
  @Patch('me/toggle-visibility')
  @ApiOperation({ summary: 'Toggle profile visibility' })
  @ApiResponse({
    status: 200,
    description: 'Profile visibility updated successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async toggleVisibility(@Req() req: AuthenticatedRequest) {
    return this.usersService.toggleProfileVisibility(req.user.id);
  }

  @Auth()
  @Put('me/avatar')
  @PhotoUpload()
  @ApiOperation({
    summary: 'Set the profile photo of the current user',
    description:
      'Multipart upload in the `photo` field. The photo is cropped to a 512 px square, re-encoded as WebP and stripped of its metadata (EXIF, GPS). Replaces and deletes the previous one. The URL is public: anyone it is shared with can open it.',
  })
  @ApiResponse({ status: 200, description: '{ avatarUrl }' })
  @ApiResponse({ status: 400, description: 'No photo, or not an image' })
  @ApiResponse({ status: 413, description: 'Over 10 MB or 50 megapixels' })
  @ApiResponse({ status: 415, description: 'Not JPEG, PNG or WebP' })
  setAvatar(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    return this.usersService.setAvatar(req.user.id, file);
  }

  @Auth()
  @Delete('me/avatar')
  @ApiOperation({ summary: 'Remove the profile photo of the current user' })
  @ApiResponse({ status: 200, description: '{ avatarUrl: null }' })
  removeAvatar(@Req() req: AuthenticatedRequest) {
    return this.usersService.removeAvatar(req.user.id);
  }

  @Auth()
  @Get(':id')
  @ApiOperation({
    summary: 'Find a user by ID',
    description:
      'Returns the full account for the authenticated user and only the public identity (id, displayName, uniqueName, isPublic, avatarUrl) for anyone else.',
  })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.usersService.getUserForViewer(req.user.id, id);
  }

  @Auth()
  @Patch(':id')
  @ApiOperation({
    summary: 'Update a user by ID',
    description: 'Only the authenticated user can update their own account.',
  })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 403, description: 'Not your account' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateData: UpdateUserDto,
  ) {
    return this.usersService.updateUser(req.user.id, id, updateData);
  }

  @Auth()
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a user by ID',
    description: 'Only the authenticated user can delete their own account.',
  })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 403, description: 'Not your account' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.usersService.deleteUser(req.user.id, id);
  }

  @Auth()
  @Get(':id/profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.usersService.getUserProfile(req.user.id, id);
  }
}
