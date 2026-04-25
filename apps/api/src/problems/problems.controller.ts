import { Controller, Get, Param } from '@nestjs/common';
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
}
