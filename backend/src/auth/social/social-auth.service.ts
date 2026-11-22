import { randomBytes } from 'crypto';
import { HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, QueryFailedError } from 'typeorm';
import { User } from '../../users/entities/users.entity';
import { UsersService } from '../../users/users.service';
import { BCRYPT_ROUNDS } from '../auth.constants';
import { AuthService } from '../auth.service';
import { SocialClaims, SocialTokenVerifier } from './social-token.verifier';
import { IdentityProvider, UserIdentity } from './user-identity.entity';

const MAX_DISPLAY_NAME = 50;

const isUniqueViolation = (error: unknown) =>
  error instanceof QueryFailedError &&
  (error.driverError as { code?: string } | undefined)?.code === '23505';

/**
 * Sign in with Apple or Google. In order:
 * 1. the provider account is already linked: that Grinta account;
 * 2. a Grinta account has the same email, verified by the provider: it is
 *    linked, then signed in;
 * 3. otherwise a new account is created, with a generated username and a
 *    random password (« Mot de passe oublié » sets a real one).
 * The answer tells the app whether to show the onboarding: `isNewUser`.
 */
@Injectable()
export class SocialAuthService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly verifier: SocialTokenVerifier,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  async login(
    provider: IdentityProvider,
    token: string,
    displayName?: string | null,
  ): Promise<{ access_token: string; isNewUser: boolean }> {
    const claims = await this.verifier.verify(provider, token);

    try {
      return await this.signIn(provider, claims, displayName);
    } catch (error) {
      // Two first sign-ins at once: the other one linked or created first.
      if (!isUniqueViolation(error)) throw error;
      return this.signIn(provider, claims, displayName);
    }
  }

  private async signIn(
    provider: IdentityProvider,
    claims: SocialClaims,
    displayName?: string | null,
  ) {
    const identities = this.dataSource.getRepository(UserIdentity);
    const linked = await identities.findOne({
      where: { provider, subject: claims.subject },
      relations: ['user'],
    });

    if (linked)
      return { ...this.authService.login(linked.user), isNewUser: false };
    if (!claims.email || !claims.emailVerified)
      throw new UnauthorizedException({
        statusCode: HttpStatus.UNAUTHORIZED,
        code: 'SOCIAL_EMAIL_NOT_VERIFIED',
        message:
          'Connexion refusée : l’adresse e-mail de ce compte n’est pas vérifiée.',
      });
    const email = claims.email;
    const name = this.displayNameOf(displayName ?? claims.name, email);

    return this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(User, { where: { email } });
      const user =
        existing ??
        (await manager.save(
          manager.create(User, {
            email,
            password: await bcrypt.hash(
              randomBytes(32).toString('hex'),
              BCRYPT_ROUNDS,
            ),
            displayName: name,
            uniqueName:
              await this.usersService.generateUniqueUsernameFromDisplayName(
                name,
              ),
          }),
        ));

      await manager.insert(UserIdentity, {
        provider,
        subject: claims.subject,
        user: { id: user.id },
      });
      return { ...this.authService.login(user), isNewUser: !existing };
    });
  }

  /** The name the provider gave, else the start of the email. */
  private displayNameOf(name: string | null | undefined, email: string) {
    const fromName = name?.trim().replace(/\s+/g, ' ');

    return (fromName || email.split('@')[0]).slice(0, MAX_DISPLAY_NAME);
  }
}
