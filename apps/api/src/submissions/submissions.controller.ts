import { Controller, Post, Get, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';

@Controller('submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @UseGuards(ThrottlerGuard)
  create(@Body() dto: CreateSubmissionDto, @CurrentUser() user: User) {
    return this.submissionsService.create(user.id, dto);
  }

  @Get('me')
  findMine(
    @CurrentUser() user: User,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.submissionsService.findMySubmissions(user.id, page, limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.submissionsService.findOne(id, user.id);
  }
}
