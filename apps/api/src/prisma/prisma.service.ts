import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const poolMax = Number(process.env.DATABASE_POOL_MAX ?? '10');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL ?? 'postgresql://stackdify:stackdify@localhost:5432/stackdify_dev',
      max: Number.isInteger(poolMax) && poolMax > 0 ? poolMax : 10,
    });
    super({ adapter: new PrismaPg(pool) });
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
