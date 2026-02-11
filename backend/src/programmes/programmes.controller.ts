import { Controller, Post, Get, Patch, Param, Req, Body, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Auth } from '../auth/auth.decorators';
import { ProgrammesService } from './programmes.service';
import { CreateProgrammeDto } from './dto/create-programme.dto';
import { UpdateProgrammeDto } from './dto/update-programme.dto';
import { Programme } from './entities/programme.entity';

@ApiTags('programmes')
@Auth()
@Controller('programmes')
export class ProgrammesController {
  constructor(private readonly programmesService: ProgrammesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new programme' })
  @ApiResponse({ status: 201, description: 'Programme created', type: Programme })
  create(@Req() req, @Body() dto: CreateProgrammeDto) {
    return this.programmesService.createProgramme(req.user, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a programme' })
  @ApiResponse({ status: 200, description: 'Programme updated', type: Programme })
  update(@Req() req, @Param('id') id: string, @Body() dto: UpdateProgrammeDto) {
    return this.programmesService.updateProgramme(req.user, id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all programmes for current user' })
  @ApiResponse({ status: 200, description: 'List returned', type: [Programme] })
  getAll(@Req() req) {
    return this.programmesService.getProgrammesByUser(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a programme by ID' })
  @ApiResponse({ status: 200, description: 'Programme returned', type: Programme })
  getById(@Req() req, @Param('id') id: string) {
    return this.programmesService.getProgrammeById(req.user, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a programme' })
  @ApiResponse({ status: 200, description: 'Programme deleted' })
  delete(@Req() req, @Param('id') id: string) {
    return this.programmesService.deleteProgramme(req.user, id);
  }
}
