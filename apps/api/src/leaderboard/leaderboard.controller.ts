import { Controller, Get, Query } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  getGlobal(@Query('limit') limit?: string) {
    return this.leaderboardService.getGlobal(limit ? parseInt(limit, 10) : 50);
  }
}
