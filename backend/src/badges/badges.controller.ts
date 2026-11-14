import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/auth.decorators';
import type { AuthenticatedRequest } from '../auth/auth-user.interface';
import { BadgesService } from './badges.service';
import { BadgeDto } from './dto/badge.dto';
import { ListBadgesQueryDto } from './dto/list-badges-query.dto';

@ApiTags('badges')
@Auth()
@Controller('badges')
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  @ApiOperation({
    summary: 'Personal record badges of the current user',
    description:
      'Newest first. A badge is earned when a completed workout beats the ' +
      'best of every other workout on an exercise: heaviest weight, best ' +
      'estimated 1RM, best session volume, or most reps without added weight. ' +
      'The first session of an exercise sets the baseline without a badge.',
  })
  @ApiResponse({
    status: 200,
    description: 'Badges returned',
    type: BadgeDto,
    isArray: true,
  })
  list(@Req() req: AuthenticatedRequest, @Query() query: ListBadgesQueryDto) {
    return this.badgesService.listForUser(req.user.id, query);
  }
}
