import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserLoginDto } from './dto/user-login.dto';
import { Auth } from './auth.decorators';
import { LOGIN_THROTTLE } from './auth.constants';
import type { AuthenticatedRequest } from './auth-user.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: LOGIN_THROTTLE })
  @ApiOperation({ summary: 'Login user and get JWT token' })
  @ApiResponse({ status: 200, description: 'Returns JWT token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  async login(@Body() body: UserLoginDto) {
    const user = await this.authService.validateUser(
      body.identifier,
      body.password,
    );

    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.authService.login(user);
  }

  @Auth()
  @Get('me')
  @ApiOperation({ summary: 'Check token validity and get current user' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Token is invalid or expired' })
  me(@Req() req: AuthenticatedRequest) {
    return req.user;
  }
}
