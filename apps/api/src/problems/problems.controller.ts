import { Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProblemsService } from './problems.service';
import { ShareService } from '../share/share.service';

@Controller('problems')
export class ProblemsController {
  constructor(
    private readonly problemsService: ProblemsService,
    private readonly shareService: ShareService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @CurrentUser() user: User | null,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('difficulty') difficulty?: string,
    @Query('category') category?: string,
    @Query('solved') solved?: string,
  ) {
    return this.problemsService.findAll(user?.id, page, limit, difficulty, category, solved);
  }

  @Get('categories')
  findCategories() {
    return this.problemsService.findCategories();
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(@Param('slug') slug: string, @CurrentUser() user: User | null) {
    return this.problemsService.findBySlug(slug, user?.id);
  }

  @Get(':slug/requirements/:order')
  getRequirementGraph(
    @Param('slug') slug: string,
    @Param('order', ParseIntPipe) order: number,
  ) {
    return this.problemsService.getRequirementGraph(slug, order);
  }

  @Post(':slug/share')
  @UseGuards(OptionalJwtAuthGuard)
  createShareToken(@Param('slug') slug: string) {
    return this.shareService.createToken(slug);
  }

  @Get(':slug/solution')
  @UseGuards(JwtAuthGuard)
  getSolution(@Param('slug') slug: string, @CurrentUser() user: User) {
    return this.problemsService.getSolution(slug, user.id);
  }
}
