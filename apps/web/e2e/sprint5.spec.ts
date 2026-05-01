import { expect, test } from '@playwright/test';

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:3001/api/v1';

test('critical path: login, browse problems, open game, and resolve a share link', async ({ page, request }) => {
  const suffix = `${Date.now()}${Math.random().toString(16).slice(2)}`;
  const register = await request.post(`${apiBase}/auth/register`, {
    data: {
      email: `pw-${suffix}@stackdify.test`,
      username: `pw_${suffix}`.slice(0, 20),
      displayName: 'Playwright User',
      password: 'password123',
    },
  });
  expect(register.ok()).toBeTruthy();
  const session = await register.json();

  await page.addInitScript(
    ({ token, user }) => {
      window.localStorage.setItem('joy.auth.token', token);
      window.localStorage.setItem('joy.auth.user', JSON.stringify(user));
    },
    { token: session.accessToken, user: session.user },
  );

  await page.goto('/problems');
  await expect(page.getByRole('heading', { name: 'Problems' })).toBeVisible();
  await expect(page.getByText(/Design Instagram/i)).toBeVisible();

  await page.goto('/problems/instagram');
  await expect(page.getByText(/Requirement 1/i)).toBeVisible();
  await expect(page.getByText(/Drop on an open slot|open slots|open slot/i)).toBeVisible();

  const submission = await request.post(`${apiBase}/submissions`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    data: {
      problemId: (await (await request.get(`${apiBase}/problems/instagram`)).json()).problem.id,
      requirementOrder: 1,
      slotAnswers: { 'dns-1': 'dns', 'lb-1': 'load-balancer' },
      timeTakenMs: 1000,
    },
  });
  expect(submission.ok()).toBeTruthy();
  expect((await submission.json()).passed).toBe(true);

  const share = await request.post(`${apiBase}/problems/instagram/share`);
  expect(share.ok()).toBeTruthy();
  const { token } = await share.json();

  await page.goto(`/share/${token}`);
  await expect(page).toHaveURL(/\/problems\/instagram/);
});
