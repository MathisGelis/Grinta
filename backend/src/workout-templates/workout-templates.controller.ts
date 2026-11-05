import { Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from '../auth/auth.decorators';
import type { AuthenticatedRequest } from '../auth/auth-user.interface';
import { TemplatesQueryDto } from './dto/templates-query.dto';
import { WorkoutTemplatesService } from './workout-templates.service';

@ApiTags('workout templates')
@Auth()
@Controller('workouts/templates')
export class WorkoutTemplatesController {
  constructor(private readonly templates: WorkoutTemplatesService) {}

  @Get()
  @ApiOperation({
    summary: 'Ready-made programmes, the best fit first',
    description:
      'Ranked by goal, level, days per week and location. Each criterion ' +
      'defaults to the onboarding answer stored on the profile. The best ' +
      'fits are flagged `recommended`. Weights are 0: the user sets them.',
  })
  @ApiResponse({ status: 200, description: 'Templates returned' })
  list(@Req() req: AuthenticatedRequest, @Query() query: TemplatesQueryDto) {
    return this.templates.listTemplates(req.user, query);
  }

  @Post(':key/use')
  @ApiOperation({
    summary: 'Copy a template into my workouts',
    description:
      'Creates one planned workout per session of the template and a ' +
      'programme over one week (rest days included), not started.',
  })
  @ApiResponse({ status: 201, description: 'Programme created' })
  @ApiResponse({ status: 404, description: 'Unknown template' })
  use(@Req() req: AuthenticatedRequest, @Param('key') key: string) {
    return this.templates.useTemplate(req.user, key);
  }
}
