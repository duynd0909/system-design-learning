import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ProblemsService } from './problems.service';

@Controller('problems')
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Get()
  findAll() {
    return this.problemsService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.problemsService.findBySlug(slug);
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
