import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadgesController } from './badges.controller';
import { BadgesService } from './badges.service';
import { Badge } from './entities/badge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Badge])],
  controllers: [BadgesController],
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
