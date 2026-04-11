import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Connection } from './entities/connections.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
  ) {}

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId)
      throw new BadRequestException('You cannot follow yourself');

    const existing = await this.connectionRepository.findOne({
      where: {
        follower: { id: followerId },
        following: { id: followingId },
      },
    });

    if (existing) throw new BadRequestException('Already following this user');
    const connection = this.connectionRepository.create({
      follower: { id: followerId },
      following: { id: followingId },
    });

    return this.connectionRepository.save(connection);
  }

  async unfollowUser(followerId: string, followingId: string) {
    const result = await this.connectionRepository.delete({
      follower: { id: followerId },
      following: { id: followingId },
    });

    if (result.affected === 0)
      throw new NotFoundException('Connection not found');
    return { message: 'Unfollowed successfully' };
  }

  async getFollowers(userId: string) {
    return (
      this.connectionRepository
        .createQueryBuilder('connection')
        .innerJoin('connection.follower', 'user')
        .select([
          'user.id AS id',
          'user.uniqueName AS "uniqueName"',
          'user.displayName AS "displayName"',
        ])
        .where('connection.followingId = :userId', { userId })
        .getRawMany() ?? []
    );
  }

  async getFollowing(userId: string) {
    return (
      this.connectionRepository
        .createQueryBuilder('connection')
        .innerJoin('connection.following', 'user')
        .select([
          'user.id AS id',
          'user.uniqueName AS "uniqueName"',
          'user.displayName AS "displayName"',
        ])
        .where('connection.followerId = :userId', { userId })
        .getRawMany() ?? []
    );
  }

  async getMutualFollowersRecommendations(currentUserId: string) {
    return this.connectionRepository
      .createQueryBuilder('c1')
      .innerJoin('c1.following', 'c1Following')
      .innerJoin(Connection, 'c2', 'c2.follower = c1Following.id')
      .innerJoin('c2.following', 'user')
      .select([
        'user.id AS id',
        'user.uniqueName AS "uniqueName"',
        'user.displayName AS "displayName"',
        'COUNT(*) AS score',
      ])
      .where('c1.follower = :currentUserId', { currentUserId })
      .andWhere('user.id != :currentUserId', { currentUserId })
      .andWhere(
        `
        user.id NOT IN (
          SELECT c3."followingId" FROM "connections" c3 WHERE c3."followerId" = :currentUserId
        )
        `,
        { currentUserId },
      )
      .groupBy('user.id')
      .orderBy('score', 'DESC')
      .limit(10)
      .getRawMany();
  }

  async getPopularUsers(limit = 10, excludeIds: string[] = []) {
    const qb = this.connectionRepository
      .createQueryBuilder('c')
      .innerJoin('c.following', 'user')
      .select([
        'user.id AS id',
        'user.uniqueName AS "uniqueName"',
        'user.displayName AS "displayName"',
        'COUNT(c.id) AS followersCount',
      ])
      .groupBy('user.id')
      .orderBy('followersCount', 'DESC')
      .limit(limit);

    if (excludeIds.length > 0)
      qb.where('user.id NOT IN (:...excludeIds)', { excludeIds });
    return qb.getRawMany();
  }

  async getRandomUsers(limit = 10, excludeIds: string[] = []) {
    const qb = this.connectionRepository.manager
      .getRepository('User')
      .createQueryBuilder('user')
      .select([
        'user.id AS id',
        'user.uniqueName AS "uniqueName"',
        'user.displayName AS "displayName"',
      ])
      .orderBy('RANDOM()')
      .limit(limit);

    if (excludeIds.length > 0)
      qb.where('user.id NOT IN (:...excludeIds)', { excludeIds });
    return qb.getRawMany();
  }

  async recommendUsers(currentUserId: string) {
    let recommended =
      await this.getMutualFollowersRecommendations(currentUserId);
    const alreadyRecommendedIds = recommended.map((u) => u.id);

    const following = await this.getFollowing(currentUserId);
    const followingIds = following.map((u) => u.id);
    const excludeIds = [
      currentUserId,
      ...alreadyRecommendedIds,
      ...followingIds,
    ];

    if (recommended.length === 0)
      recommended = await this.getPopularUsers(10, excludeIds);
    if (recommended.length === 0)
      recommended = await this.getRandomUsers(10, excludeIds);
    return recommended;
  }
}
