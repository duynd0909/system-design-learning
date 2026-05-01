import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

interface AuthResponse {
  accessToken: string;
  user: { id: string; email: string };
}

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}@stackdify.test`;
}

describe('Sprint 5 API flows (e2e)', () => {
  let app: INestApplication;
  let server: Parameters<typeof request>[0];
  let userToken = '';
  let adminToken = '';
  let instagramId = '';

  beforeAll(async () => {
    const adminEmail = uniqueEmail('admin');
    process.env.ADMIN_EMAILS = adminEmail;
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret-min-32-characters-long';
    process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://stackdify:stackdify@localhost:5432/stackdify_dev';
    process.env.REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    server = app.getHttpServer();

    const userRegister = await request(server)
      .post('/api/v1/auth/register')
      .send({
        email: uniqueEmail('player'),
        username: `player_${Date.now()}`.slice(0, 20),
        displayName: 'E2E Player',
        password: 'password123',
      })
      .expect(201);
    userToken = (userRegister.body as AuthResponse).accessToken;

    const adminRegister = await request(server)
      .post('/api/v1/auth/register')
      .send({
        email: adminEmail,
        username: `admin_${Date.now()}`.slice(0, 20),
        displayName: 'E2E Admin',
        password: 'password123',
      })
      .expect(201);
    adminToken = (adminRegister.body as AuthResponse).accessToken;
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('reports real dependency health', async () => {
    await request(server)
      .get('/api/v1/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ok');
        expect(body.db).toBe('ok');
        expect(body.redis).toBe('ok');
      });
  });

  it('loads a problem, submits a requirement, updates leaderboard, and resolves a share token', async () => {
    const detail = await request(server)
      .get('/api/v1/problems/instagram')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    instagramId = detail.body.problem.id;

    await request(server)
      .get('/api/v1/problems/instagram/requirements/1')
      .expect(200)
      .expect(({ body }) => {
        expect(body.requirement.order).toBe(1);
        expect(body.nodes.length).toBeGreaterThan(0);
      });

    await request(server)
      .post('/api/v1/submissions')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        problemId: instagramId,
        requirementOrder: 1,
        slotAnswers: { 'dns-1': 'dns', 'lb-1': 'load-balancer' },
        timeTakenMs: 1000,
      })
      .expect(201)
      .expect(({ body }) => {
        expect(body.score).toBe(100);
        expect(body.passed).toBe(true);
      });

    await request(server)
      .get('/api/v1/leaderboard')
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body)).toBe(true);
      });

    const share = await request(server)
      .post('/api/v1/problems/instagram/share')
      .expect(201);
    await request(server)
      .get(`/api/v1/share/${share.body.token}/resolve`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.slug).toBe('instagram');
      });
  });

  it('protects admin endpoints and supports content lifecycle operations', async () => {
    await request(server)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);

    await request(server)
      .get('/api/v1/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.totals.problems).toBeGreaterThanOrEqual(10);
      });

    const slug = `e2e-${Date.now()}`;
    await request(server)
      .post('/api/v1/admin/problems')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        slug,
        title: 'Design E2E System',
        description: 'A temporary problem created by the Sprint 5 API E2E suite.',
        difficulty: 'EASY',
        category: 'Testing',
      })
      .expect(201);

    await request(server)
      .put(`/api/v1/admin/problems/${slug}/requirements`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        requirements: [
          {
            order: 1,
            title: 'Route test traffic',
            description: 'Create a small valid graph for test traffic.',
            nodes: [
              { id: 'user-1', type: 'actor', position: { x: 0, y: 120 }, data: { label: 'User' } },
              { id: 'dns-1', type: 'component', position: { x: 220, y: 120 }, data: { componentSlug: 'dns', label: 'DNS' } },
            ],
            edges: [{ id: 'e-user-dns', source: 'user-1', target: 'dns-1', label: 'lookup' }],
            answer: { 'dns-1': 'dns' },
          },
        ],
      })
      .expect(200);

    await request(server)
      .patch(`/api/v1/admin/problems/${slug}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(server).get(`/api/v1/problems/${slug}`).expect(200);

    await request(server)
      .patch(`/api/v1/admin/problems/${slug}/hide`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(server).get(`/api/v1/problems/${slug}`).expect(404);

    await request(server)
      .delete(`/api/v1/admin/problems/${slug}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });
});
