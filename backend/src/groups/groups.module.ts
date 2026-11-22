import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsModule } from '../posts/posts.module';
import { GroupShare } from './entities/group-share.entity';
import { GroupInvitation } from './entities/group-invitation.entity';
import { GroupMember } from './entities/group-member.entity';
import { Group } from './entities/group.entity';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupMember, GroupInvitation, GroupShare]),
    PostsModule,
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
})
export class GroupsModule {}
