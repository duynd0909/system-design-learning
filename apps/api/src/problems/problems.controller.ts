import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProblemsService } from './problems.service';

@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @CurrentUser() user: User | null,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('difficulty') difficulty?: string,
    @Query('category') category?: string,
  ) {
    return this.problemsService.findAll(user?.id, page, limit, difficulty, category);
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

  @Get(':slug/solution')
  @UseGuards(JwtAuthGuard)
  getSolution(@Param('slug') slug: string, @CurrentUser() user: User) {
    return this.problemsService.getSolution(slug, user.id);
  }
}
