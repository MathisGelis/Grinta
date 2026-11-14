/**
 * class-transformer helper that trims and lowercases a string before it is
 * validated, so that "Foo@Mail.com" and "foo@mail.com" resolve to the same
 * account. AuthService lowercases the login identifier, so anything stored with
 * capitals could never be matched again.
 */
export const toLowerTrimmed = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;
