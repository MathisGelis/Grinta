import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
  Req,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserLoginDto } from './dto/user-login.dto';
import { Auth } from './auth.decorators';
import { AttemptLimit } from '../common/throttling/attempt-limit';
import {
  FORGOT_PASSWORD_ATTEMPTS,
  LOGIN_ATTEMPTS,
  RESET_PASSWORD_ATTEMPTS,
} from './auth.constants';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/password.dto';
import { PasswordResetService } from './password-reset.service';
import type { AuthenticatedRequest } from './auth-user.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordReset: PasswordResetService,
  ) {}

  @Post('forgot-password')
  @HttpCode(204)
  @AttemptLimit(FORGOT_PASSWORD_ATTEMPTS)
  @ApiOperation({
    summary: 'Email a password reset link',
    description:
      'Always 204, whether or not the email has an account, and as fast, so the route tells nothing about who is registered. The link works once, for one hour; asking again replaces it. 3 requests per hour per email and address, 10 per address.',
  })
  @ApiResponse({ status: 204, description: 'Done (or nothing to do)' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    this.passwordReset.requestResetInBackground(dto.email);
  }

  @Post('reset-password')
  @HttpCode(204)
  @AttemptLimit(RESET_PASSWORD_ATTEMPTS)
  @ApiOperation({
    summary: 'Set a new password from a reset link',
    description:
      'The link stops working, and every session of the account is logged out (tokens issued before are refused). The user then logs in with the new password.',
  })
  @ApiResponse({ status: 204, description: 'Password changed' })
  @ApiResponse({
    status: 400,
    description:
      'Validation error, or { code: "RESET_TOKEN_INVALID" } for a link unknown, used or expired',
  })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.passwordReset.resetPassword(dto.token, dto.password);
  }

  @Post('login')
  @AttemptLimit(LOGIN_ATTEMPTS)
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
