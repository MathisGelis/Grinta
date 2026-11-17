type EnvGetter = (key: string) => string | undefined;

export type MailConfig =
  | { transport: 'log'; production: boolean }
  | {
      transport: 'smtp';
      host: string;
      port: number;
      secure: boolean;
      user?: string;
      password?: string;
      from: string;
    };

/**
 * How emails leave. MAIL_TRANSPORT picks the transport; without it, SMTP
 * when SMTP_HOST is set, else the log (development).
 *
 * SMTP_HOST, SMTP_PORT (587 by default), SMTP_SECURE (true for port 465),
 * SMTP_USER, SMTP_PASSWORD, MAIL_FROM ("Grinta <no-reply@example.com>").
 */
export function readMailConfig(get: EnvGetter): MailConfig {
  const transport =
    get('MAIL_TRANSPORT') || (get('SMTP_HOST') ? 'smtp' : 'log');

  if (transport === 'log')
    return { transport, production: get('NODE_ENV') === 'production' };
  if (transport !== 'smtp')
    throw new Error('MAIL_TRANSPORT must be "smtp" or "log"');
  const host = get('SMTP_HOST');
  const from = get('MAIL_FROM');

  if (!host || !from)
    throw new Error('Email over SMTP needs SMTP_HOST and MAIL_FROM');
  return {
    transport,
    host,
    port: Number(get('SMTP_PORT') || 587),
    secure: get('SMTP_SECURE') === 'true',
    user: get('SMTP_USER') || undefined,
    password: get('SMTP_PASSWORD') || undefined,
    from,
  };
}
