import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/users.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(
    identifier: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.usersService.findByIdentifier(
      identifier.toLowerCase().trim(),
    );

    if (!user) {
      await bcrypt.compare(
        password,
        '$2b$10$invalidsaltinvalidsaltinvalidsaltinvalidsaltinvalidsa',
      );
      return null;
    }
    return (await bcrypt.compare(password, user.password)) ? user : null;
  }

  login(user: User): { access_token: string } {
    const payload: { sub: string; email: string; uniqueName: string } = {
      sub: user.id,
      email: user.email,
      uniqueName: user.uniqueName,
    };
    const token: string = this.jwtService.sign(payload);

    return { access_token: token };
  }
}
