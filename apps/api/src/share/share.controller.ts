import { Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ShareService } from './share.service';

@Controller('share')
export class ShareController {
  constructor(
    private readonly shareService: ShareService,
    private readonly config: ConfigService,
  ) {}

  @Get(':token/resolve')
  async resolveShareTokenJson(@Param('token') token: string) {
    const slug = await this.shareService.resolveToken(token);
    return { slug };
  }

  @Get(':token')
  async resolveShareToken(@Param('token') token: string, @Res() res: Response) {
    const slug = await this.shareService.resolveToken(token);
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    res.redirect(302, `${frontendUrl}/problems/${slug}`);
  }
}
