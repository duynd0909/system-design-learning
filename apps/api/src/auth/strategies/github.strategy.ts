import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.getOrThrow<string>('GITHUB_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('GITHUB_CLIENT_SECRET'),
      callbackURL: `${config.get('CORS_ORIGIN', 'http://localhost:3000')}/api/auth/callback/github`,
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: (error: Error | null, user?: unknown) => void,
  ) {
    const email = profile.emails?.[0]?.value ?? `${profile.id}@github.noreply`;
    const user = await this.authService.findOrCreateOAuthUser({
      githubId: profile.id,
      email,
      displayName: profile.displayName ?? profile.username ?? 'GitHub User',
      username: profile.username ?? `gh_${profile.id}`,
      avatarUrl: profile.photos?.[0]?.value,
    });
    done(null, user);
  }
}
