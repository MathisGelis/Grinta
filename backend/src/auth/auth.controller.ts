import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserLoginDto } from './dto/user-login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login user and get JWT token' })
  @ApiResponse({ status: 200, description: 'Returns JWT token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() body: UserLoginDto) {
    const user = await this.authService.validateUser(body.email, body.password);

    if (!user) throw new UnauthorizedException('Invalid credentials');
    return this.authService.login(user);
  }
}
