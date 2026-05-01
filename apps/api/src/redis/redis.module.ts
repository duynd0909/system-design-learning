import {
  Global,
  Inject,
  Module,
  OnModuleDestroy,
  type Provider,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

const redisProvider: Provider = {
  provide: REDIS_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Redis => {
    return new Redis(config.get<string>('REDIS_URL', 'redis://localhost:6379'), {
      lazyConnect: false,
      maxRetriesPerRequest: 3,
    });
  },
};

@Global()
@Module({
  providers: [redisProvider],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  onModuleDestroy() {
    void this.redis.quit();
  }
}
