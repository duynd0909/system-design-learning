import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';

interface OAuthUserData {
  githubId?: string;
  googleId?: string;
  email: string;
  displayName: string;
  username: string;
  avatarUrl?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { username: dto.username }] },
    });
    if (existing) {
      throw new ConflictException('Email or username already taken');
    }

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        displayName: dto.displayName,
        password: hashed,
      },
    });

    return this.issueToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.password) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueToken(user);
  }

  async findOrCreateOAuthUser(data: OAuthUserData) {
    const where = data.githubId
      ? { githubId: data.githubId }
      : { googleId: data.googleId };

    let user = await this.prisma.user.findFirst({ where });
    let wasLinked = false;

    if (!user) {
      const emailUser = await this.prisma.user.findUnique({ where: { email: data.email } });
      if (emailUser) {
        user = await this.prisma.user.update({
          where: { id: emailUser.id },
          data: {
            ...(data.githubId ? { githubId: data.githubId } : {}),
            ...(data.googleId ? { googleId: data.googleId } : {}),
            avatarUrl: data.avatarUrl ?? emailUser.avatarUrl,
          },
        });
        wasLinked = true;
      } else {
        const username = await this.makeUniqueUsername(data.username);
        user = await this.prisma.user.create({
          data: {
            email: data.email,
            username,
            displayName: data.displayName,
            avatarUrl: data.avatarUrl,
            ...(data.githubId ? { githubId: data.githubId } : {}),
            ...(data.googleId ? { googleId: data.googleId } : {}),
          },
        });
      }
    }

    return { ...this.issueToken(user), wasLinked };
  }

  private issueToken(user: User) {
    const payload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwt.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl ?? undefined,
        role: user.role,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }

  private async makeUniqueUsername(base: string): Promise<string> {
    const sanitized = base.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 18);
    let candidate = sanitized;
    let counter = 1;
    while (await this.prisma.user.findUnique({ where: { username: candidate } })) {
      candidate = `${sanitized}${counter++}`;
    }
    return candidate;
  }
}
