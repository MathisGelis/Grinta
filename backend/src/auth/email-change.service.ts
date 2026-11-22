import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { User } from '../users/entities/users.entity';
import { EmailChangeToken } from './entities/email-change-token.entity';
import { PasswordStateService } from './password-state.service';

const TOKEN_TTL_MS = 60 * 60_000;
const DEFAULT_CONFIRM_URL = 'grinta://confirm-email';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

/**
 * Changing the e-mail of an account: the current password is required, the
 * confirmation link goes to the NEW address (so it proves the owner reads
 * it), and the OLD address is told. Opening the link applies the change and
 * retires every token issued before, like a password change.
 */
@Injectable()
export class EmailChangeService {
  private readonly logger = new Logger(EmailChangeService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(EmailChangeToken)
    private readonly tokens: Repository<EmailChangeToken>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
    private readonly passwordState: PasswordStateService,
  ) {}

  async request(
    userId: string,
    newEmail: string,
    currentPassword: string,
  ): Promise<void> {
    const user = await this.users.findOneOrFail({ where: { id: userId } });

    if (!(await bcrypt.compare(currentPassword, user.password)))
      throw new BadRequestException({
        statusCode: 400,
        code: 'CURRENT_PASSWORD_INVALID',
        message: 'Le mot de passe actuel est incorrect.',
      });
    if (newEmail === user.email)
      throw new BadRequestException({
        statusCode: 400,
        code: 'EMAIL_UNCHANGED',
        message: "C'est déjà l'adresse de ce compte.",
      });
    if (await this.users.exists({ where: { email: newEmail } }))
      throw new BadRequestException({
        statusCode: 400,
        code: 'EMAIL_IN_USE',
        message: 'Email already in use',
      });

    const token = randomBytes(32).toString('base64url');

    await this.tokens.manager.transaction(async (manager) => {
      await manager.delete(EmailChangeToken, { user: { id: userId } });
      await manager.insert(EmailChangeToken, {
        user: { id: userId },
        newEmail,
        tokenHash: sha256(token),
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      });
    });
    // Not awaited together: a mail failure must not hide the other one.
    await Promise.all([
      this.mail.send({
        to: newEmail,
        subject: 'Confirmez votre nouvelle adresse Grinta',
        text: [
          `Bonjour ${user.displayName},`,
          '',
          "Ouvrez ce lien dans l'heure qui vient pour utiliser cette adresse avec votre compte Grinta :",
          this.linkFor(token),
          '',
          "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
        ].join('\n'),
      }),
      this.mail
        .send({
          to: user.email,
          subject: "Demande de changement d'adresse Grinta",
          text: [
            `Bonjour ${user.displayName},`,
            '',
            "Une demande de changement de l'adresse de votre compte Grinta vers une autre adresse vient d'être faite.",
            "Si c'était vous, confirmez depuis la nouvelle adresse. Sinon, changez votre mot de passe sans attendre.",
          ].join('\n'),
        })
        .catch((error: Error) =>
          this.logger.error(`Notice to old address failed: ${error.message}`),
        ),
    ]);
  }

  /** Applies the change from the link; the link then stops working. */
  async confirm(token: string): Promise<void> {
    const userId = await this.tokens.manager.transaction(async (manager) => {
      const [row] = await manager.query<
        Array<{ userId: string; newEmail: string; expiresAt: Date }>
      >(
        `SELECT "userId", "newEmail", "expiresAt" FROM email_change_tokens
          WHERE "tokenHash" = $1 FOR UPDATE`,
        [sha256(token)],
      );

      if (!row || row.expiresAt.getTime() <= Date.now())
        throw new BadRequestException({
          statusCode: 400,
          code: 'EMAIL_TOKEN_INVALID',
          message: 'Ce lien est invalide ou a expiré.',
        });
      if (await manager.exists(User, { where: { email: row.newEmail } }))
        throw new BadRequestException({
          statusCode: 400,
          code: 'EMAIL_IN_USE',
          message: 'Email already in use',
        });
      await manager.update(
        User,
        { id: row.userId },
        { email: row.newEmail, passwordChangedAt: new Date() },
      );
      await manager.delete(EmailChangeToken, { user: { id: row.userId } });
      return row.userId;
    });

    this.passwordState.forget(userId);
  }

  private linkFor(token: string): string {
    const base =
      this.config.get<string>('CONFIRM_EMAIL_URL') || DEFAULT_CONFIRM_URL;

    return `${base}${base.includes('?') ? '&' : '?'}token=${token}`;
  }
}
