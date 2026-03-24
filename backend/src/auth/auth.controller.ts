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
import { UserLoginDto } from './dto/user-login.dto';
import { Auth } from './auth.decorators';

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

  @Auth()
  @Get('me')
  @ApiOperation({ summary: 'Check token validity and get current user' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 401, description: 'Token is invalid or expired' })
  me(@Req() req) {
    return req.user;
  }
}
