import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AttemptLimit } from '../../common/throttling/attempt-limit';
import { appleLoginAttempts, googleLoginAttempts } from './social.constants';
import { AppleLoginDto, GoogleLoginDto } from './dto/social-login.dto';
import { SocialAuthService } from './social-auth.service';
import { IdentityProvider } from './user-identity.entity';

const DESCRIPTION =
  'Verifies the token against the provider keys, issuer and our client ids. ' +
  'Signs in the linked account, else links the account with the same ' +
  'verified email, else creates one (generated username). Returns ' +
  '{ access_token, isNewUser }: show the onboarding when isNewUser is true.';

@ApiTags('auth')
@Controller('auth')
export class SocialAuthController {
  constructor(private readonly social: SocialAuthService) {}

  @Post('apple')
  @HttpCode(200)
  @AttemptLimit(appleLoginAttempts)
  @ApiOperation({ summary: 'Sign in with Apple', description: DESCRIPTION })
  @ApiResponse({ status: 200, description: '{ access_token, isNewUser }' })
  @ApiResponse({
    status: 401,
    description: 'SOCIAL_TOKEN_INVALID or SOCIAL_EMAIL_NOT_VERIFIED',
  })
  @ApiResponse({ status: 503, description: 'SOCIAL_LOGIN_NOT_CONFIGURED' })
  apple(@Body() dto: AppleLoginDto) {
    const name = [dto.fullName?.givenName, dto.fullName?.familyName]
      .filter(Boolean)
      .join(' ');

    return this.social.login(
      IdentityProvider.APPLE,
      dto.identityToken,
      name || null,
    );
  }

  @Post('google')
  @HttpCode(200)
  @AttemptLimit(googleLoginAttempts)
  @ApiOperation({ summary: 'Sign in with Google', description: DESCRIPTION })
  @ApiResponse({ status: 200, description: '{ access_token, isNewUser }' })
  @ApiResponse({
    status: 401,
    description: 'SOCIAL_TOKEN_INVALID or SOCIAL_EMAIL_NOT_VERIFIED',
  })
  @ApiResponse({ status: 503, description: 'SOCIAL_LOGIN_NOT_CONFIGURED' })
  google(@Body() dto: GoogleLoginDto) {
    return this.social.login(IdentityProvider.GOOGLE, dto.idToken);
  }
}
