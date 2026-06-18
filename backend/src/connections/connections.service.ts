import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Connection } from './entities/connections.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/users.entity';
import { FollowRequest } from './entities/follow-request.entity';

@Injectable()
export class ConnectionsService {
  constructor(
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(FollowRequest)
    private readonly followRequestRepository: Repository<FollowRequest>,
  ) {}

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId)
      throw new BadRequestException('You cannot follow yourself');
    const existingConnection = await this.connectionRepository.exists({
      where: {
        follower: { id: followerId },
        following: { id: followingId },
      },
    });

    if (existingConnection) throw new BadRequestException('Already following');
    const targetUser = await this.userRepository.findOne({
      where: { id: followingId },
    });

    if (!targetUser) throw new NotFoundException('User not found');
    if (!targetUser.isPublic) {
      const existingRequest = await this.followRequestRepository.exists({
        where: {
          follower: { id: followerId },
          following: { id: followingId },
        },
      });

      if (existingRequest)
        throw new BadRequestException('Request already sent');
      await this.followRequestRepository.save({
        follower: { id: followerId },
        following: { id: followingId },
      });
      return { status: 'REQUEST_SENT' };
    }
    await this.connectionRepository.save({
      follower: { id: followerId },
      following: { id: followingId },
    });
    return { status: 'FOLLOWING' };
  }

  async acceptFollowRequest(userId: string, requestId: string) {
    const request = await this.followRequestRepository.findOne({
      where: { id: requestId },
      relations: ['follower', 'following'],
    });

    if (!request) throw new NotFoundException('Request not found');
    if (request.following.id !== userId)
      throw new ForbiddenException('Not allowed');
    await this.connectionRepository.save({
      follower: { id: request.follower.id },
      following: { id: userId },
    });
    await this.followRequestRepository.delete(requestId);
    return { message: 'Request accepted' };
  }

  async deleteFollowRequest(userId: string, requestId: string) {
    const request = await this.followRequestRepository.findOne({
      where: { id: requestId },
      relations: ['follower', 'following'],
    });

    if (!request) throw new NotFoundException('Request not found');
    const isSender = request.follower.id === userId;
    const isReceiver = request.following.id === userId;

    if (!isSender && !isReceiver) throw new ForbiddenException('Not allowed');
    await this.followRequestRepository.delete(requestId);
    return { message: 'Request removed' };
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

  async getFollowStatus(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) return 'SELF';

    const [isFollowing, isFollowedBack, requestSent] = await Promise.all([
      this.connectionRepository.exists({
        where: {
          follower: { id: currentUserId },
          following: { id: targetUserId },
        },
      }),
      this.connectionRepository.exists({
        where: {
          follower: { id: targetUserId },
          following: { id: currentUserId },
        },
      }),
      this.followRequestRepository.exists({
        where: {
          follower: { id: currentUserId },
          following: { id: targetUserId },
        },
      }),
    ]);

    if (isFollowing) return 'FOLLOWING';
    if (requestSent) return 'REQUEST_SENT';
    if (isFollowedBack) return 'FOLLOW_BACK';
    return 'FOLLOW';
  }

  async getIncomingFollowRequests(userId: string) {
    return this.followRequestRepository
      .createQueryBuilder('request')
      .innerJoin('request.follower', 'user')
      .innerJoin('request.following', 'following')
      .where('following.id = :userId', { userId })
      .select([
        'request.id',
        'request.createdAt',
        'user.id',
        'user.displayName',
        'user.uniqueName',
      ])
      .orderBy('request.createdAt', 'DESC')
      .getRawMany();
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
          SELECT c3."followingId"
          FROM "connections" c3
          WHERE c3."followerId" = :currentUserId
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
      .getRepository(User)
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
