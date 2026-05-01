import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { redirect } from 'next/navigation';
import { GET } from '../route';

jest.mock('next/navigation', () => ({
  redirect: jest.fn((url: string) => {
    const error = new Error('NEXT_REDIRECT') as Error & { digest: string };
    error.digest = `NEXT_REDIRECT;replace;${url};307;`;
    throw error;
  }),
}));

const fetchMock = jest.fn<typeof fetch>();

describe('/share/[token] route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock;
  });

  it('redirects a resolved share token to the problem page', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ slug: 'instagram' }),
    } as Response);

    await expect(
      GET({} as Parameters<typeof GET>[0], { params: Promise.resolve({ token: 'Vogk64X9' }) }),
    ).rejects.toMatchObject({
      digest: 'NEXT_REDIRECT;replace;/problems/instagram;307;',
    });

    expect(redirect).toHaveBeenCalledWith('/problems/instagram');
    expect(redirect).not.toHaveBeenCalledWith('/problems');
  });
});
