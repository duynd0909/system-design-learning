import type { Metadata } from 'next';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

function titleFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const fallbackTitle = `Design ${titleFromSlug(slug)}`;

  try {
    const response = await fetch(`${API_BASE}/problems/${slug}`, {
      cache: 'no-store',
    });
    if (response.ok) {
      const payload = (await response.json()) as {
        data?: {
          problem?: {
            title?: string;
            description?: string;
            category?: string;
          };
        };
        problem?: {
          title?: string;
          description?: string;
          category?: string;
        };
      };
      const problem = payload.data?.problem ?? payload.problem;
      const title = problem?.title ?? fallbackTitle;
      const description =
        problem?.description ??
        'Practice this system design problem with an interactive architecture graph.';

      return {
        title: `${title} | Stackdify`,
        description,
        openGraph: {
          title: `${title} | Stackdify`,
          description,
          type: 'article',
          images: [{ url: '/og-default.svg', width: 1200, height: 630, alt: title }],
        },
        twitter: {
          card: 'summary_large_image',
          title: `${title} | Stackdify`,
          description,
          images: ['/og-default.svg'],
        },
      };
    }
  } catch {
    // Metadata should not block page rendering when the API is unavailable.
  }

  return {
    title: `${fallbackTitle} | Stackdify`,
    description: 'Practice this system design problem with an interactive architecture graph.',
    openGraph: {
      title: `${fallbackTitle} | Stackdify`,
      description: 'Practice this system design problem with an interactive architecture graph.',
      images: [{ url: '/og-default.svg', width: 1200, height: 630, alt: fallbackTitle }],
    },
  };
}

export default function ProblemLayout({ children }: { children: React.ReactNode }) {
  return children;
}
