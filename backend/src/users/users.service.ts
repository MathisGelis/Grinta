import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { BCRYPT_ROUNDS } from 'src/auth/auth.constants';
import { UserListDto } from './dto/users-list.dto';
import { Connection } from 'src/connections/entities/connections.entity';
import { CompletedWorkout } from 'src/workouts/entities/completed-workout.entity';
import { Post } from 'src/posts/entities/post.entity';
import { ConnectionsService } from 'src/connections/connections.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,

    @InjectRepository(CompletedWorkout)
    private readonly completedWorkoutRepository: Repository<CompletedWorkout>,

    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,

    private readonly connectionsService: ConnectionsService,
  ) {}

  async registerUser(userData: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: userData.email },
    });

    if (existing) throw new BadRequestException('Email already in use');
    const existingUsername = await this.userRepository.findOne({
      where: { uniqueName: userData.uniqueName },
    });

    if (existingUsername) {
      const generatedName = await this.generateUniqueUsernameFromDisplayName(
        userData.displayName,
      );

      throw new BadRequestException(
        `Username already in use, recommended: ${generatedName}`,
      );
    }
    const hashedPassword = await bcrypt.hash(userData.password, BCRYPT_ROUNDS);
    const newUser = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return await this.userRepository.save(newUser);
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  /**
   * Returns the full account for its owner and only the public identity for
   * anyone else. Email, birth date and body measurements never leave the
   * owner's own session.
   */
  async getUserForViewer(viewerId: string, id: string) {
    const user = await this.findUserById(id);

    if (user.id === viewerId) return user;
    return {
      id: user.id,
      displayName: user.displayName,
      uniqueName: user.uniqueName,
      isPublic: user.isPublic,
    };
  }

  async updateUser(
    currentUserId: string,
    id: string,
    updateData: UpdateUserDto,
  ): Promise<User> {
    this.assertSelf(currentUserId, id);
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    if (updateData.email && updateData.email !== user.email) {
      const existing = await this.userRepository.findOne({
        where: { email: updateData.email },
      });

      if (existing) throw new BadRequestException('Email already in use');
    }
    if (updateData.uniqueName && updateData.uniqueName !== user.uniqueName) {
      const existing = await this.userRepository.findOne({
        where: { uniqueName: updateData.uniqueName },
      });

      if (existing) {
        const generatedName = await this.generateUniqueUsernameFromDisplayName(
          user.displayName,
        );

        throw new BadRequestException(
          `Username already in use, recommended: ${generatedName}`,
        );
      }
    }

    const { password, ...profileFields } = updateData;

    Object.assign(user, profileFields);
    if (password) user.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
    return await this.userRepository.save(user);
  }

  async deleteUser(
    currentUserId: string,
    id: string,
  ): Promise<{ message: string }> {
    this.assertSelf(currentUserId, id);
    const result = await this.userRepository.delete(id);

    if (result.affected === 0)
      throw new NotFoundException(`User with ID ${id} not found`);
    return { message: 'User deleted successfully' };
  }

  private assertSelf(currentUserId: string, targetUserId: string) {
    if (currentUserId !== targetUserId)
      throw new ForbiddenException(
        'Vous ne pouvez modifier que votre propre compte.',
      );
  }

  async findByIdentifier(identifier: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: [{ email: identifier }, { uniqueName: identifier }],
    });
  }

  async toggleProfileVisibility(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) throw new NotFoundException('User not found');
    user.isPublic = !user.isPublic;
    await this.userRepository.save(user);
    return { isPublic: user.isPublic };
  }

  async getUserProfile(currentUserId: string, targetUserId: string) {
    const user = await this.userRepository.findOne({
      where: { id: targetUserId },
    });

    if (!user) throw new NotFoundException('User not found');
    const isOwner = currentUserId === targetUserId;
    // A public profile or the owner's own page never depends on the follow
    // status, so the posts are fetched alongside the rest instead of after it.
    const postsAreOpen = user.isPublic || isOwner;
    const [followStatus, counts, openPosts] = await Promise.all([
      this.connectionsService.getFollowStatus(currentUserId, targetUserId),
      this.getProfileCounts(targetUserId),
      postsAreOpen
        ? this.findProfilePosts(currentUserId, targetUserId)
        : Promise.resolve(null),
    ]);
    const isFollowing = followStatus === 'FOLLOWING';
    const canSeePosts = postsAreOpen || isFollowing;
    const posts = canSeePosts
      ? (openPosts ??
        (await this.findProfilePosts(currentUserId, targetUserId)))
      : undefined;

    return {
      id: user.id,
      displayName: user.displayName,
      uniqueName: user.uniqueName,
      ...counts,
      followStatus,
      posts,
      isPrivate: !user.isPublic && !isOwner && !isFollowing,
    };
  }

  // One statement for the four counters instead of one round trip each.
  private async getProfileCounts(userId: string): Promise<{
    followersCount: number;
    followingCount: number;
    workoutsCount: number;
    postsCount: number;
  }> {
    const [counts] = await this.userRepository.query(
      `SELECT
         (SELECT COUNT(*)::int FROM connections WHERE "followingId" = $1) AS "followersCount",
         (SELECT COUNT(*)::int FROM connections WHERE "followerId" = $1) AS "followingCount",
         (SELECT COUNT(*)::int FROM completed_workouts WHERE "userId" = $1) AS "workoutsCount",
         (SELECT COUNT(*)::int FROM posts WHERE "userId" = $1) AS "postsCount"`,
      [userId],
    );

    return counts;
  }

  private findProfilePosts(currentUserId: string, targetUserId: string) {
    return this.postRepository
      .createQueryBuilder('post')
      .where('post."userId" = :targetUserId', { targetUserId })
      .select([
        'post.id AS id',
        'post."createdAt" AS "createdAt"',
        `(SELECT COUNT(*)::int FROM post_likes l WHERE l."postId" = post.id) AS "likesCount"`,
        `(SELECT COUNT(*)::int FROM post_comments c WHERE c."postId" = post.id AND c."isHidden" = false) AS "commentsCount"`,
        `EXISTS (
          SELECT 1 FROM post_likes ml
          WHERE ml."postId" = post.id
          AND ml."userId" = :currentUserId
        ) AS "isLiked"`,
      ])
      .orderBy('post."createdAt"', 'DESC')
      .setParameter('currentUserId', currentUserId)
      .getRawMany();
  }

  async generateUniqueUsernameFromDisplayName(
    displayName: string,
  ): Promise<string> {
    const base = displayName
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
    let username = base;
    let counter = 1;

    while (true) {
      const existing = await this.userRepository.findOne({
        where: { uniqueName: username },
      });

      if (!existing) return username;
      username = `${base}${counter}`;
      counter++;
    }
  }

  async searchUsers(
    search: string,
    currentUserId: string,
  ): Promise<UserListDto[]> {
    const normalized = search.toLowerCase().trim();

    if (!normalized) return [];
    return this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.uniqueName', 'user.displayName'])
      .where('user.id != :currentUserId', { currentUserId })
      .andWhere(
        `
        similarity(LOWER(user.uniqueName), :search) > 0.2
        OR LOWER(user.uniqueName) LIKE :likeSearch
        `,
        {
          search: normalized,
          likeSearch: `%${normalized}%`,
        },
      )
      .orderBy(
        `
        CASE
          WHEN LOWER(user.uniqueName) LIKE :prefix THEN 0
          ELSE 1
        END
        `,
        'ASC',
      )
      .addOrderBy(`similarity(LOWER(user.uniqueName), :search)`, 'DESC')
      .setParameter('prefix', `${normalized}%`)
      .setParameter('search', normalized)
      .limit(10)
      .getMany();
  }
}
