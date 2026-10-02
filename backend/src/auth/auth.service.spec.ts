import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { BCRYPT_ROUNDS } from './auth.constants';

// Wrap compare in a spy while keeping the real implementation, so the test can
// observe the call without a faster fake hiding the real cost.
jest.mock('bcrypt', () => {
  const actual = jest.requireActual<typeof import('bcrypt')>('bcrypt');

  return {
    ...actual,
    compare: jest.fn((data: string, hash: string) =>
      actual.compare(data, hash),
    ),
  };
});

describe('AuthService.validateUser', () => {
  const usersService = { findByIdentifier: jest.fn() };
  const jwtService = { sign: jest.fn() };
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    usersService.findByIdentifier.mockReset();
    service = new AuthService(usersService as never, jwtService as never);
  });

  it('still runs a bcrypt comparison when the account does not exist', async () => {
    const compare = bcrypt.compare as unknown as jest.Mock;

    usersService.findByIdentifier.mockResolvedValue(null);
    await expect(
      service.validateUser('ghost', 'Password123!'),
    ).resolves.toBeNull();
    expect(compare).toHaveBeenCalledTimes(1);
  });

  it('uses a dummy hash with the production cost factor', () => {
    const dummy = (service as unknown as { dummyHash: string }).dummyHash;

    expect(bcrypt.getRounds(dummy)).toBe(BCRYPT_ROUNDS);
  });

  it('normalises the identifier before the lookup', async () => {
    usersService.findByIdentifier.mockResolvedValue(null);
    await service.validateUser('  Foo@Mail.com ', 'Password123!');
    expect(usersService.findByIdentifier).toHaveBeenCalledWith('foo@mail.com');
  });

  it('accepts the right password and rejects a wrong one', async () => {
    const password = await bcrypt.hash('Password123!', BCRYPT_ROUNDS);
    const user = { id: 'u1', password };

    usersService.findByIdentifier.mockResolvedValue(user);
    await expect(service.validateUser('u', 'Password123!')).resolves.toBe(user);
    await expect(
      service.validateUser('u', 'Wrong-password1'),
    ).resolves.toBeNull();
  });
});
