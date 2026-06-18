import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/users.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';
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
    const hashedPassword = await bcrypt.hash(userData.password, 10);
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

  async updateUser(id: string, updateData: UpdateUserDto): Promise<User> {
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

    if (updateData.password)
      updateData.password = await bcrypt.hash(updateData.password, 10);
    Object.assign(user, updateData);
    return await this.userRepository.save(user);
  }

  async deleteUser(id: string): Promise<{ message: string }> {
    const result = await this.userRepository.delete(id);

    if (result.affected === 0)
      throw new NotFoundException(`User with ID ${id} not found`);
    return { message: 'User deleted successfully' };
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
    const [isFollowing, followStatus] = await Promise.all([
      this.connectionRepository.exist({
        where: {
          follower: { id: currentUserId },
          following: { id: targetUserId },
        },
      }),
      this.connectionsService.getFollowStatus(currentUserId, targetUserId),
    ]);
    const canSeePosts = user.isPublic || isOwner || isFollowing;
    const [followersCount, followingCount, workoutsCount, postsCount] =
      await Promise.all([
        this.connectionRepository.count({
          where: { following: { id: targetUserId } },
        }),
        this.connectionRepository.count({
          where: { follower: { id: targetUserId } },
        }),
        this.completedWorkoutRepository.count({
          where: { user: { id: targetUserId } },
        }),
        this.postRepository.count({
          where: { user: { id: targetUserId } },
        }),
      ]);
    let posts = [];

    if (canSeePosts) {
      posts = await this.postRepository
        .createQueryBuilder('post')
        .where('post."userId" = :targetUserId', { targetUserId })
        .select([
          'post.id AS id',
          'post."createdAt" AS "createdAt"',
          `(SELECT COUNT(*) FROM post_likes l WHERE l."postId" = post.id) AS "likesCount"`,
          `(SELECT COUNT(*) FROM post_comments c WHERE c."postId" = post.id) AS "commentsCount"`,
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

    return {
      id: user.id,
      displayName: user.displayName,
      uniqueName: user.uniqueName,
      followersCount,
      followingCount,
      workoutsCount,
      postsCount,
      followStatus,
      posts: canSeePosts ? posts : undefined,
      isPrivate: !user.isPublic && !isOwner && !isFollowing,
    };
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
