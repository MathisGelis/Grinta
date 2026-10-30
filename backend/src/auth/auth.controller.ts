import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserLoginDto } from './dto/user-login.dto';
import { Auth } from './auth.decorators';
import { LoginThrottleGuard } from './login-throttle.guard';
import type { AuthenticatedRequest } from './auth-user.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LoginThrottleGuard)
  @ApiOperation({
    summary: 'Login user and get JWT token',
    description:
      'Limited to 5 attempts per 15 minutes per account and address, and 50 per address across accounts. Over the limit: 429 with a Retry-After header and { code: "TOO_MANY_LOGIN_ATTEMPTS", message, retryAfterSeconds }.',
  })
  @ApiResponse({ status: 200, description: 'Returns JWT token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({
    status: 429,
    description: '{ statusCode, code, message, retryAfterSeconds }',
  })
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
