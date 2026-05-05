import { Module } from '@nestjs/common';
import { ComponentsService } from './components.service';
import { ComponentsController } from './components.controller';
import { RedisService } from '../redis/redis.service';

@Module({
  providers: [ComponentsService, RedisService],
  controllers: [ComponentsController],
  exports: [ComponentsService],
})
export class ComponentsModule {}
