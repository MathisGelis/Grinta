import { readMailConfig } from './mail.config';

const from = (env: Record<string, string>) => (key: string) => env[key];

describe('readMailConfig', () => {
  it('logs emails without SMTP setup', () => {
    expect(readMailConfig(from({}))).toEqual({
      transport: 'log',
      production: false,
    });
    expect(readMailConfig(from({ NODE_ENV: 'production' }))).toEqual({
      transport: 'log',
      production: true,
    });
  });

  it('sends over SMTP once SMTP_HOST is set', () => {
    expect(
      readMailConfig(
        from({
          SMTP_HOST: 'smtp.example.com',
          SMTP_PORT: '465',
          SMTP_SECURE: 'true',
          SMTP_USER: 'grinta',
          SMTP_PASSWORD: 'secret',
          MAIL_FROM: 'Grinta <no-reply@example.com>',
        }),
      ),
    ).toEqual({
      transport: 'smtp',
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      user: 'grinta',
      password: 'secret',
      from: 'Grinta <no-reply@example.com>',
    });
  });

  it('refuses an incomplete SMTP setup or an unknown transport', () => {
    expect(() =>
      readMailConfig(from({ SMTP_HOST: 'smtp.example.com' })),
    ).toThrow(/MAIL_FROM/);
    expect(() =>
      readMailConfig(from({ MAIL_TRANSPORT: 'carrier-pigeon' })),
    ).toThrow();
  });
});
