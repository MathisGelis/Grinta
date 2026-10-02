import { ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { User } from './entities/users.entity';

describe('UsersService access control', () => {
  const owner = Object.assign(new User(), {
    id: 'owner-id',
    email: 'owner@example.com',
    password: 'hash',
    displayName: 'Owner',
    uniqueName: 'owner',
    isPublic: true,
    birthDate: '1990-01-01',
    height: 180,
    weight: 80,
  });
  const userRepository = {
    findOne: jest.fn(),
    save: jest.fn((u: User) => Promise.resolve(u)),
    delete: jest.fn().mockResolvedValue({ affected: 1 }),
  };
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository.findOne.mockResolvedValue({ ...owner });
    service = new UsersService(
      userRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('refuses to update another user and never touches the database', async () => {
    await expect(
      service.updateUser('attacker-id', owner.id, { password: 'Hacked12345!' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(userRepository.findOne).not.toHaveBeenCalled();
    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it('refuses to delete another user', async () => {
    await expect(
      service.deleteUser('attacker-id', owner.id),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(userRepository.delete).not.toHaveBeenCalled();
  });

  it('lets a user update their own account and hashes a new password', async () => {
    const saved = await service.updateUser(owner.id, owner.id, {
      height: 182,
      password: 'NewPassword123!',
    });

    expect(saved.height).toBe(182);
    expect(saved.password).not.toBe('NewPassword123!');
    await expect(
      bcrypt.compare('NewPassword123!', saved.password),
    ).resolves.toBe(true);
  });

  it('returns the full account to its owner', async () => {
    const result = await service.getUserForViewer(owner.id, owner.id);

    expect(result).toMatchObject({ email: owner.email, height: 180 });
  });

  it('returns only the public identity to other users', async () => {
    const result = await service.getUserForViewer('someone-else', owner.id);

    expect(result).toEqual({
      id: owner.id,
      displayName: 'Owner',
      uniqueName: 'owner',
      isPublic: true,
    });
  });
});
