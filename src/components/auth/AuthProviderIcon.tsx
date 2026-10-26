import React from 'react';
import { Github } from 'lucide-react';
import type { OAuthProvider } from '@/hooks/useEnabledAuthProviders';

export const OAUTH_LABELS: Record<OAuthProvider, string> = {
  google: 'Google',
  github: 'GitHub',
  discord: 'Discord',
};

const AuthProviderIcon: React.FC<{ provider: OAuthProvider }> = ({ provider }) => {
  if (provider === 'github') return <Github className="h-4 w-4" />;
  if (provider === 'discord') {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#5865F2">
        <path d="M20.32 4.37A19.8 19.8 0 0 0 15.43 2.9l-.23.46a18.3 18.3 0 0 0-4.4 0l-.23-.46a19.7 19.7 0 0 0-4.9 1.48C2.55 9.05 1.7 13.6 2.12 18.1a19.9 19.9 0 0 0 6.07 3l.5-.8a12.9 12.9 0 0 1-1.99-.95l.49-.38a14.2 14.2 0 0 0 12.02 0l.49.38c-.64.38-1.3.7-1.99.95l.5.8a19.8 19.8 0 0 0 6.07-3c.5-5.2-.84-9.7-3.96-13.73ZM8.68 15.3c-1.17 0-2.13-1.08-2.13-2.4s.94-2.4 2.13-2.4c1.2 0 2.15 1.09 2.13 2.4 0 1.32-.94 2.4-2.13 2.4Zm6.64 0c-1.17 0-2.13-1.08-2.13-2.4s.94-2.4 2.13-2.4c1.2 0 2.15 1.09 2.13 2.4 0 1.32-.93 2.4-2.13 2.4Z" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
};

export default AuthProviderIcon;
