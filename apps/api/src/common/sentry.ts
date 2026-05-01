import * as Sentry from '@sentry/node';

let initialized = false;

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || initialized) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.RAILWAY_GIT_COMMIT_SHA ?? process.env.GIT_SHA,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
  });
  initialized = true;
}

export function captureException(exception: unknown) {
  if (!initialized) return;
  Sentry.captureException(exception);
}
