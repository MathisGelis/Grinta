import { isSwaggerEnabled } from './app.setup';

describe('isSwaggerEnabled', () => {
  const saved = { ...process.env };

  afterEach(() => {
    process.env = { ...saved };
  });

  it('is on in development and off in production', () => {
    process.env.NODE_ENV = 'development';
    expect(isSwaggerEnabled()).toBe(true);
    process.env.NODE_ENV = 'production';
    delete process.env.SWAGGER_ENABLED;
    expect(isSwaggerEnabled()).toBe(false);
  });

  it('can be turned back on in production on purpose', () => {
    process.env.NODE_ENV = 'production';
    process.env.SWAGGER_ENABLED = 'true';
    expect(isSwaggerEnabled()).toBe(true);
  });
});
