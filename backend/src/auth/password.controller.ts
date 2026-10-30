import { Body, Controller, Patch, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AttemptLimit } from '../common/throttling/attempt-limit';
import { CHANGE_PASSWORD_ATTEMPTS } from './auth.constants';
import { Auth } from './auth.decorators';
import type { AuthenticatedRequest } from './auth-user.interface';
import { AuthService } from './auth.service';
import { ChangePasswordDto } from './dto/password.dto';
import { PasswordResetService } from './password-reset.service';

@ApiTags('users')
@Controller('users')
export class PasswordController {
  constructor(
    private readonly passwordReset: PasswordResetService,
    private readonly authService: AuthService,
  ) {}

  // AttemptLimit above Auth: guards run in the reverse order of the
  // decorators, and the limit counts per authenticated user.
  @Patch('me/password')
  @AttemptLimit(CHANGE_PASSWORD_ATTEMPTS)
  @Auth()
  @ApiOperation({
    summary: 'Change my password',
    description:
      'Needs the current password. Every other session is logged out: tokens issued before the change are refused from then on. Returns a new token for the current session. 5 attempts per 15 minutes.',
  })
  @ApiResponse({ status: 200, description: '{ access_token }' })
  @ApiResponse({
    status: 400,
    description:
      'Validation error, or { code: "CURRENT_PASSWORD_INVALID" } for a wrong current password',
  })
  @ApiResponse({ status: 429, description: 'Too many attempts' })
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    const user = await this.passwordReset.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );

    return this.authService.login(user);
  }
}
