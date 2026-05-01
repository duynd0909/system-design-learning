import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProblemsModule } from './problems/problems.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { ComponentsModule } from './components/components.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { ShareModule } from './share/share.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.local' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    RedisModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    ProblemsModule,
    SubmissionsModule,
    LeaderboardModule,
    ComponentsModule,
    HealthModule,
    ShareModule,
  ],
})
export class AppModule {}
