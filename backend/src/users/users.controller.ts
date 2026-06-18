import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Auth } from 'src/auth/auth.decorators';
import { UserListDto } from './dto/users-list.dto';

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
  searchUsers(@Query('q') query: string, @Req() req) {
    return this.usersService.searchUsers(query, req.user.id);
  }

  @Auth()
  @Get(':id')
  @ApiOperation({ summary: 'Find a user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('id') id: string) {
    return this.usersService.findUserById(id);
  }

  @Auth()
  @Patch(':id')
  @ApiOperation({ summary: 'Update a user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(@Param('id') id: string, @Body() updateData: UpdateUserDto) {
    return this.usersService.updateUser(id, updateData);
  }

  @Auth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Auth()
  @Get(':id/profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(@Req() req, @Param('id') id: string) {
    return this.usersService.getUserProfile(req.user.id, id);
  }

  @Auth()
  @Patch('me/toggle-visibility')
  @ApiOperation({ summary: 'Toggle profile visibility' })
  @ApiResponse({
    status: 200,
    description: 'Profile visibility updated successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async toggleVisibility(@Req() req) {
    return this.usersService.toggleProfileVisibility(req.user.id);
  }
}
