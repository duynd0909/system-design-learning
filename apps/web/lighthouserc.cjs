const webPort = process.env.LHCI_WEB_PORT ?? '3200';
const apiPort = process.env.LHCI_API_PORT ?? '3201';
const webUrl = `http://127.0.0.1:${webPort}`;
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? `http://127.0.0.1:${apiPort}/api/v1`;

module.exports = {
  ci: {
    collect: {
      url: [`${webUrl}/problems/instagram`],
      startServerCommand: `(PORT=${apiPort} CORS_ORIGIN=${webUrl} npm run deploy:db --workspace=@stackdify/api && PORT=${apiPort} CORS_ORIGIN=${webUrl} npm run start --workspace=@stackdify/api) & (NEXT_PUBLIC_API_URL=${apiUrl} NEXT_PUBLIC_APP_URL=${webUrl} npm run build --workspace=@stackdify/web && PORT=${webPort} npm run start --workspace=@stackdify/web)`,
      startServerReadyPattern: 'Ready|started server|Application running|Local:',
      startServerReadyTimeout: 120000,
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.85 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
