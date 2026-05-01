import { Module } from '@nestjs/common';
import { ShareService } from './share.service';
import { ShareController } from './share.controller';
import { RedisService } from '../redis/redis.service';

@Module({
  providers: [ShareService, RedisService],
  controllers: [ShareController],
  exports: [ShareService],
})
export class ShareModule {}
