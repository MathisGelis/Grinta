import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readMailConfig } from './mail.config';
import { LogMailService, MailService, SmtpMailService } from './mail.service';

@Global()
@Module({
  providers: [
    {
      provide: MailService,
      inject: [ConfigService],
      useFactory: (config: ConfigService): MailService => {
        const mail = readMailConfig((key) => config.get<string>(key));
        const logger = new Logger('Mail');

        if (mail.transport === 'smtp') {
          logger.log(`Emails sent through ${mail.host}:${mail.port}`);
          return new SmtpMailService(mail, mail.from);
        }
        logger.warn(
          mail.production
            ? 'No SMTP configured (SMTP_HOST, MAIL_FROM): emails are not sent'
            : 'Emails are written to the log (development)',
        );
        return new LogMailService(mail.production);
      },
    },
  ],
  exports: [MailService],
})
export class MailModule {}
