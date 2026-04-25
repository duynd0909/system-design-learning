import { Controller, Post, Body, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {
    // Redirect to GitHub handled by Passport
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  githubCallback(@Req() req: { user: { accessToken: string } }, @Res() res: Response) {
    const { accessToken } = req.user;
    res.redirect(`${process.env.CORS_ORIGIN}/auth/callback?token=${accessToken}`);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Redirect to Google handled by Passport
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: { user: { accessToken: string } }, @Res() res: Response) {
    const { accessToken } = req.user;
    res.redirect(`${process.env.CORS_ORIGIN}/auth/callback?token=${accessToken}`);
  }
}
