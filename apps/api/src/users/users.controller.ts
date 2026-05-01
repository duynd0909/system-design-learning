import { Body, Controller, Get, HttpCode, Logger, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: User) {
    return this.usersService.findById(user.id);
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  getMyStats(@CurrentUser() user: User) {
    return this.usersService.getStats(user.id);
  }

  @Get('me/activity')
  @UseGuards(JwtAuthGuard)
  getMyActivity(@CurrentUser() user: User, @Query('year') year?: string) {
    const y = year ? parseInt(year, 10) : new Date().getFullYear();
    return this.usersService.getActivity(user.id, y);
  }

  @Post('me/notifications')
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  createNotification(@Body() _body: unknown, @CurrentUser() user: User) {
    this.logger.debug(`Notification mock received for user ${user.id}`);
    return { received: true };
  }

  // Public profile — no auth required. Must come before /:id to avoid routing conflict.
  @Get('profile/:username')
  getPublicProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfile(username);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}
