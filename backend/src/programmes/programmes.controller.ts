import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Req,
  Body,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Auth } from '../auth/auth.decorators';
import type { AuthenticatedRequest } from '../auth/auth-user.interface';
import { ProgrammesService } from './programmes.service';
import { CreateProgrammeDto } from './dto/create-programme.dto';
import { UpdateProgrammeDto } from './dto/update-programme.dto';
import { Programme } from './entities/programme.entity';
import { ProgrammeListDto } from './dto/programme-list.dto';
import {
  ProgrammeDayQueryDto,
  StartProgrammeDto,
} from './dto/programme-date.dto';

@ApiTags('programmes')
@Auth()
@Controller('programmes')
export class ProgrammesController {
  constructor(private readonly programmesService: ProgrammesService) {}

  @Post(':id/start')
  @ApiOperation({
    summary: 'Start following one of my programmes',
    description:
      'One programme at a time: starting one replaces the one followed until now. `startDate` (YYYY-MM-DD) is day 1, today (UTC) by default. Returns what that day holds, as GET /programmes/active/today.',
  })
  @ApiResponse({
    status: 201,
    description: 'Same body as GET /programmes/active/today',
  })
  @ApiResponse({ status: 400, description: 'Date not in YYYY-MM-DD' })
  @ApiResponse({ status: 404, description: 'Not a programme of mine' })
  start(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: StartProgrammeDto,
  ) {
    return this.programmesService.startProgramme(req.user, id, dto.startDate);
  }

  @Get('active/today')
  @ApiOperation({
    summary: 'The workout my programme plans for today',
    description:
      'Day counted in calendar days from the start (day 1), whether or not I trained, and the programme starts over after its last day (`cycle` counts the rounds). Send `date`, my local date (YYYY-MM-DD), to ask about another day or to avoid the UTC date around midnight. `status`: `workout` (the planned workout is in `workout`, as in GET /workouts/planned/:id), `rest`, or `not_started` (start date later, see `daysUntilStart`).',
  })
  @ApiResponse({
    status: 200,
    description:
      '{ programme: { id, title }, startedOn, date, cycleLength, status, dayNumber, cycle, workout, daysUntilStart? }',
  })
  @ApiResponse({ status: 404, description: 'No programme started' })
  today(
    @Req() req: AuthenticatedRequest,
    @Query() query: ProgrammeDayQueryDto,
  ) {
    return this.programmesService.todaysWorkout(req.user, query.date);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new programme' })
  @ApiResponse({
    status: 201,
    description: 'Programme created',
    type: Programme,
  })
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateProgrammeDto) {
    return this.programmesService.createProgramme(req.user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a programme' })
  @ApiResponse({
    status: 200,
    description: 'Programme updated',
    type: Programme,
  })
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateProgrammeDto,
  ) {
    return this.programmesService.updateProgramme(req.user, id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all programmes for current user' })
  @ApiResponse({
    status: 200,
    description: 'List returned',
    type: ProgrammeListDto,
    isArray: true,
  })
  getAll(@Req() req: AuthenticatedRequest) {
    return this.programmesService.getProgrammesByUser(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a programme by ID' })
  @ApiResponse({
    status: 200,
    description: 'Programme returned',
    type: Programme,
  })
  getById(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.programmesService.getProgrammeById(req.user, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a programme' })
  @ApiResponse({ status: 200, description: 'Programme deleted' })
  delete(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.programmesService.deleteProgramme(req.user, id);
  }
}
