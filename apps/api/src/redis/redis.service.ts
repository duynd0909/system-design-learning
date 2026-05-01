import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.module';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async ping(): Promise<boolean> {
    try {
      return (await this.redis.ping()) === 'PONG';
    } catch (err) {
      this.logger.warn(`Redis ping failed: ${String(err)}`);
      return false;
    }
  }

  async zadd(key: string, score: number, member: string): Promise<void> {
    try {
      await this.redis.zadd(key, score, member);
    } catch (err) {
      this.logger.warn(`Redis zadd failed for key ${key}: ${String(err)}`);
    }
  }

  async zrevrangeWithScores(key: string, start: number, stop: number): Promise<Array<{ member: string; score: number }>> {
    try {
      const raw = await this.redis.zrevrange(key, start, stop, 'WITHSCORES');
      const result: Array<{ member: string; score: number }> = [];
      for (let i = 0; i < raw.length; i += 2) {
        result.push({ member: raw[i], score: parseFloat(raw[i + 1]) });
      }
      return result;
    } catch (err) {
      this.logger.warn(`Redis zrevrange failed for key ${key}: ${String(err)}`);
      return [];
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.redis.expire(key, seconds);
    } catch (err) {
      this.logger.warn(`Redis expire failed for key ${key}: ${String(err)}`);
    }
  }

  async set(key: string, value: string, exSeconds?: number): Promise<void> {
    try {
      if (exSeconds !== undefined) {
        await this.redis.set(key, value, 'EX', exSeconds);
      } else {
        await this.redis.set(key, value);
      }
    } catch (err) {
      this.logger.warn(`Redis set failed for key ${key}: ${String(err)}`);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (err) {
      this.logger.warn(`Redis get failed for key ${key}: ${String(err)}`);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (err) {
      this.logger.warn(`Redis del failed for key ${key}: ${String(err)}`);
    }
  }
}
