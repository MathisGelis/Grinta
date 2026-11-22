import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/users.entity';
import { BCRYPT_ROUNDS } from './auth.constants';

@Injectable()
export class AuthService {
  /**
   * Hash compared against when the identifier matches no account, so that an
   * unknown user costs the same bcrypt work as a known one. It is generated at
   * startup with the production cost factor rather than hardcoded, which keeps
   * it valid and equally slow if the cost factor ever changes.
   */
  private readonly dummyHash = bcrypt.hashSync(
    randomBytes(16).toString('hex'),
    BCRYPT_ROUNDS,
  );

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
      await bcrypt.compare(password, this.dummyHash);
      return null;
    }
    return (await bcrypt.compare(password, user.password)) ? user : null;
  }

  login(user: User): { access_token: string } {
    // No e-mail in the token: it is readable by anyone who holds it, and
    // nothing server-side reads it from there.
    const payload: { sub: string; uniqueName: string } = {
      sub: user.id,
      uniqueName: user.uniqueName,
    };
    const token: string = this.jwtService.sign(payload);

    return { access_token: token };
  }

  /** { id, email } of a valid token's account, as GET /auth/me returns it. */
  async currentUser(id: string): Promise<{ id: string; email: string }> {
    const { email } = await this.usersService.findUserById(id);

    return { id, email };
  }
}
