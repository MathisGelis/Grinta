import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { User } from '../users/entities/users.entity';
import { BCRYPT_ROUNDS } from './auth.constants';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { PasswordStateService } from './password-state.service';

const RESET_TOKEN_TTL_MS = 60 * 60_000;
const DEFAULT_RESET_URL = 'grinta://reset-password';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

/**
 * Forgotten and changed passwords. A reset link carries a random 256-bit
 * token; only its hash is stored, it works once, for one hour, and a new
 * request drops the previous links. Changing the password, by link or with
 * the current one, sets passwordChangedAt, which retires every token issued
 * before (see PasswordStateService).
 */
@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(PasswordResetToken)
    private readonly tokens: Repository<PasswordResetToken>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly passwordState: PasswordStateService,
  ) {}

  /**
   * Sends a reset link if the email belongs to an account, without waiting:
   * the caller answers the same way, as fast, whether or not it does, so
   * the route cannot tell which emails have an account.
   */
  requestResetInBackground(email: string): void {
    this.requestReset(email).catch((error: Error) =>
      this.logger.error(`Reset email failed: ${error.message}`),
    );
  }

  async requestReset(email: string): Promise<void> {
    const user = await this.users.findOne({ where: { email } });

    if (!user) return;
    const token = randomBytes(32).toString('base64url');

    await this.tokens.manager.transaction(async (manager) => {
      await manager.delete(PasswordResetToken, { user: { id: user.id } });
      await manager.insert(PasswordResetToken, {
        user: { id: user.id },
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      });
    });
    await this.mail.send({
      to: user.email,
      subject: 'Réinitialisation de votre mot de passe Grinta',
      text: [
        `Bonjour ${user.displayName},`,
        '',
        "Vous avez demandé à réinitialiser votre mot de passe Grinta. Ouvrez ce lien dans l'heure qui vient pour en choisir un nouveau :",
        this.linkFor(token),
        '',
        "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail : votre mot de passe ne change pas.",
      ].join('\n'),
    });
  }

  /** Sets the new password from a reset link, which then stops working. */
  async resetPassword(token: string, password: string): Promise<void> {
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const userId = await this.tokens.manager.transaction(async (manager) => {
      const [row] = await manager.query<
        Array<{ id: string; userId: string; expiresAt: Date }>
      >(
        `SELECT id, "userId", "expiresAt" FROM password_reset_tokens
          WHERE "tokenHash" = $1 AND "usedAt" IS NULL
          FOR UPDATE`,
        [sha256(token)],
      );

      if (!row || row.expiresAt.getTime() <= Date.now())
        throw new BadRequestException({
          statusCode: 400,
          code: 'RESET_TOKEN_INVALID',
          message: 'Ce lien de réinitialisation est invalide ou a expiré.',
        });
      await manager.update(
        User,
        { id: row.userId },
        {
          password: hash,
          passwordChangedAt: new Date(),
        },
      );
      await manager.query(
        `DELETE FROM password_reset_tokens WHERE "userId" = $1`,
        [row.userId],
      );
      return row.userId;
    });

    this.passwordState.forget(userId);
  }

  /** Changes the password of a logged-in user who knows the current one. */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<User> {
    const user = await this.users.findOneOrFail({ where: { id: userId } });

    // 400 and not 401: the app reads a 401 as an expired session.
    if (!(await bcrypt.compare(currentPassword, user.password)))
      throw new BadRequestException({
        statusCode: 400,
        code: 'CURRENT_PASSWORD_INVALID',
        message: 'Le mot de passe actuel est incorrect.',
      });
    user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    user.passwordChangedAt = new Date();
    await this.users.save(user);
    await this.tokens.delete({ user: { id: userId } });
    this.passwordState.forget(userId);
    return user;
  }

  private linkFor(token: string): string {
    const base =
      this.config.get<string>('RESET_PASSWORD_URL') || DEFAULT_RESET_URL;

    return `${base}${base.includes('?') ? '&' : '?'}token=${token}`;
  }
}
