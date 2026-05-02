import { Module } from '@nestjs/common';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { RedisService } from '../redis/redis.service';

@Module({
  providers: [StatsService, RedisService],
  controllers: [StatsController],
  exports: [StatsService]
})
export class StatsModule {}
