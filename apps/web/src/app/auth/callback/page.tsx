import { AuthCallbackClient } from './AuthCallbackClient';

interface AuthCallbackPageProps {
  searchParams: Promise<{ token?: string; linked?: string; provider?: string }>;
}

export default async function AuthCallbackPage({ searchParams }: AuthCallbackPageProps) {
  const params = await searchParams;
  return <AuthCallbackClient token={params.token ?? ''} linked={params.linked} provider={params.provider} />;
}
