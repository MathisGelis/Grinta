import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/users.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.password))) return user;
    return null;
  }

  login(user: User): { access_token: string } {
    const payload: { email: string; sub: string } = {
      email: user.email,
      sub: user.id,
    };
    const token: string = this.jwtService.sign(payload);

    return { access_token: token };
  }
}
