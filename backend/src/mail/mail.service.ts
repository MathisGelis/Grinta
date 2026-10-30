import { Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

/** Sends the emails of the API. See mail.config.ts for the transports. */
export abstract class MailService {
  abstract send(message: MailMessage): Promise<void>;
}

export class SmtpMailService extends MailService {
  private readonly transporter: Transporter;

  constructor(
    config: {
      host: string;
      port: number;
      secure: boolean;
      user?: string;
      password?: string;
    },
    private readonly from: string,
  ) {
    super();
    this.transporter = createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user
        ? { user: config.user, pass: config.password }
        : undefined,
    });
  }

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({ from: this.from, ...message });
  }
}

/**
 * Development transport: writes the email to the log instead of sending
 * it, reset links included. In production it writes nothing but a warning,
 * so that a missing SMTP setup never puts reset links in the process log.
 */
export class LogMailService extends MailService {
  private readonly logger = new Logger('Mail');

  constructor(private readonly production: boolean) {
    super();
  }

  send(message: MailMessage): Promise<void> {
    if (this.production)
      this.logger.warn(
        `Email "${message.subject}" not sent: set SMTP_HOST and MAIL_FROM to send emails`,
      );
    else
      this.logger.log(
        `Email to ${message.to}: ${message.subject}\n${message.text}`,
      );
    return Promise.resolve();
  }
}
