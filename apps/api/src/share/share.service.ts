import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { RedisService } from '../redis/redis.service';
import type { ShareTokenResponse } from '@stackdify/shared-types';

const TOKEN_TTL = 604800; // 7 days in seconds

@Injectable()
export class ShareService {
  private readonly logger = new Logger(ShareService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  async createToken(slug: string): Promise<ShareTokenResponse> {
    const token = randomBytes(6).toString('base64url');
    const key = `share:token:${token}`;

    await this.redis.set(key, slug, TOKEN_TTL);
    this.logger.debug(`Created share token ${token} for problem ${slug}`);

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    return {
      token,
      url: `${frontendUrl}/share/${token}`,
      expiresIn: TOKEN_TTL,
    };
  }

  async resolveToken(token: string): Promise<string> {
    const slug = await this.redis.get(`share:token:${token}`);
    if (!slug) {
      throw new NotFoundException('Share link expired or invalid');
    }
    return slug;
  }
}
