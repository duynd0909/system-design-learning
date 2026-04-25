import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: `${config.get('CORS_ORIGIN', 'http://localhost:3000')}/api/auth/callback/google`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: unknown) => void,
  ) {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('No email from Google OAuth'));
      return;
    }
    const user = await this.authService.findOrCreateOAuthUser({
      googleId: profile.id,
      email,
      displayName: profile.displayName ?? 'Google User',
      username: `g_${profile.id}`,
      avatarUrl: profile.photos?.[0]?.value,
    });
    done(null, user);
  }
}
