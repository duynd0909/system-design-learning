import { AuthCallbackClient } from './AuthCallbackClient';

interface AuthCallbackPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AuthCallbackPage({ searchParams }: AuthCallbackPageProps) {
  const params = await searchParams;
  return <AuthCallbackClient token={params.token ?? ''} />;
}
