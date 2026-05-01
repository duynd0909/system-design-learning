import { defineConfig, devices } from '@playwright/test';

const webPort = Number(process.env.PLAYWRIGHT_WEB_PORT ?? 3000);
const apiPort = Number(process.env.PLAYWRIGHT_API_PORT ?? 3001);

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${webPort}`,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run deploy:db --workspace=@stackdify/api && npm run start --workspace=@stackdify/api',
      url: `http://127.0.0.1:${apiPort}/api/v1/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        PORT: String(apiPort),
        DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://stackdify:stackdify@localhost:5432/stackdify_dev',
        REDIS_URL: process.env.REDIS_URL ?? 'redis://localhost:6379',
        JWT_SECRET: process.env.JWT_SECRET ?? 'test-secret-min-32-characters-long',
        CORS_ORIGIN: process.env.CORS_ORIGIN ?? `http://127.0.0.1:${webPort}`,
      },
    },
    {
      command: 'npm run build --workspace=@stackdify/web && npm run start --workspace=@stackdify/web',
      url: `http://127.0.0.1:${webPort}`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        PORT: String(webPort),
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? `http://127.0.0.1:${apiPort}/api/v1`,
      },
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, testIgnore: /mobile\.spec\.ts/ },
    { name: 'mobile', use: { ...devices['Pixel 5'] }, testMatch: /mobile\.spec\.ts/ },
  ],
});
