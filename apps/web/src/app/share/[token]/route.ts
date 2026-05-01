import { redirect } from 'next/navigation';
import { type NextRequest } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  let slug: string | undefined;

  try {
    const res = await fetch(`${API_BASE}/share/${token}/resolve`, { cache: 'no-store' });
    if (res.ok) {
      const body = (await res.json()) as { data?: { slug: string }; slug?: string };
      slug = body.data?.slug ?? body.slug;
    }
  } catch {
    // API unreachable — fall through to problems page
  }

  if (slug) redirect(`/problems/${slug}`);
  redirect('/problems');
}
