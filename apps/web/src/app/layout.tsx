import type { Metadata } from 'next';
import '@xyflow/react/dist/style.css';
import '@/styles/globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ToastProvider } from '@/components/ui/Toast';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
const DESCRIPTION = 'Gamified system design practice for software engineers — drag, drop, and learn.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Stackdify',
    template: '%s | Stackdify',
  },
  description: DESCRIPTION,
  icons: { icon: '/icon.svg' },
  openGraph: {
    type: 'website',
    url: APP_URL,
    siteName: 'Stackdify',
    title: 'Stackdify — Practice system design',
    description: DESCRIPTION,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@stackdify',
    title: 'Stackdify — Practice system design',
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-body antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <QueryProvider>
              <ToastProvider>{children}</ToastProvider>
            </QueryProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
