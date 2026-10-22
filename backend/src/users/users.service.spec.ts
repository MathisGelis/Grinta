import { ForbiddenException, NotFoundException } from '@nestjs/common';
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
      avatarUrl: null,
      avatarThumbnailUrl: null,
    });
  });
});

describe('UsersService profile photo', () => {
  const old = {
    avatarUrl: '/uploads/avatars/11111111-1111-4111-8111-111111111111.webp',
    avatarThumbnailUrl:
      '/uploads/avatars/33333333-3333-4333-8333-333333333333.webp',
  };
  const fresh = {
    avatarUrl: '/uploads/avatars/22222222-2222-4222-8222-222222222222.webp',
    avatarThumbnailUrl:
      '/uploads/avatars/44444444-4444-4444-8444-444444444444.webp',
  };
  const file = { buffer: Buffer.from('jpeg') } as Express.Multer.File;
  const manager = { findOne: jest.fn(), update: jest.fn() };
  const userRepository = {
    manager: {
      transaction: jest.fn((work: (m: typeof manager) => unknown) =>
        work(manager),
      ),
    },
  };
  const photos = { uploadWithThumbnail: jest.fn(), removeAll: jest.fn() };
  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    photos.uploadWithThumbnail.mockResolvedValue({
      url: fresh.avatarUrl,
      thumbnailUrl: fresh.avatarThumbnailUrl,
    });
    manager.findOne.mockResolvedValue({ id: 'user-1', ...old });
    service = new UsersService(
      userRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      photos as never,
    );
  });

  it('stores the new photo and thumbnail under a row lock, then deletes the old files', async () => {
    await expect(service.setAvatar('user-1', file)).resolves.toEqual(fresh);
    expect(photos.uploadWithThumbnail).toHaveBeenCalledWith('avatar', file);
    expect(manager.findOne).toHaveBeenCalledWith(expect.anything(), {
      where: { id: 'user-1' },
      lock: { mode: 'pessimistic_write' },
    });
    expect(manager.update).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      fresh,
    );
    expect(photos.removeAll).toHaveBeenCalledTimes(1);
    expect(photos.removeAll).toHaveBeenCalledWith([
      old.avatarUrl,
      old.avatarThumbnailUrl,
    ]);
  });

  it('deletes the new files and keeps the old ones when the account is gone', async () => {
    manager.findOne.mockResolvedValue(null);

    await expect(service.setAvatar('user-1', file)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(manager.update).not.toHaveBeenCalled();
    expect(photos.removeAll).toHaveBeenCalledTimes(1);
    expect(photos.removeAll).toHaveBeenCalledWith([
      fresh.avatarUrl,
      fresh.avatarThumbnailUrl,
    ]);
  });

  it('removes the photo and thumbnail from the account, then their files', async () => {
    const none = { avatarUrl: null, avatarThumbnailUrl: null };

    await expect(service.removeAvatar('user-1')).resolves.toEqual(none);
    expect(manager.update).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      none,
    );
    expect(photos.removeAll).toHaveBeenCalledWith([
      old.avatarUrl,
      old.avatarThumbnailUrl,
    ]);
  });
});
