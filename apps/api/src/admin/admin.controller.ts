import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { AdminService } from './admin.service';
import {
  AdminProblemDto,
  ReplaceRequirementsDto,
  UpdateAdminProblemDto,
} from './dto/admin-problem.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('problems')
  listProblems(@Query('status') status?: string) {
    return this.adminService.listProblems(status);
  }

  @Post('problems')
  createProblem(@Body() dto: AdminProblemDto) {
    return this.adminService.createProblem(dto);
  }

  @Get('problems/:slug')
  getProblem(@Param('slug') slug: string) {
    return this.adminService.getProblem(slug);
  }

  @Patch('problems/:slug')
  updateProblem(@Param('slug') slug: string, @Body() dto: UpdateAdminProblemDto) {
    return this.adminService.updateProblem(slug, dto);
  }

  @Put('problems/:slug/requirements')
  replaceRequirements(@Param('slug') slug: string, @Body() dto: ReplaceRequirementsDto) {
    return this.adminService.replaceRequirements(slug, dto);
  }

  @Patch('problems/:slug/publish')
  publishProblem(@Param('slug') slug: string) {
    return this.adminService.publishProblem(slug);
  }

  @Patch('problems/:slug/hide')
  hideProblem(@Param('slug') slug: string) {
    return this.adminService.hideProblem(slug);
  }

  @Delete('problems/:slug')
  deleteProblem(@Param('slug') slug: string) {
    return this.adminService.deleteProblem(slug);
  }

  @Patch('problems/:slug/restore')
  restoreProblem(@Param('slug') slug: string) {
    return this.adminService.restoreProblem(slug);
  }
}
