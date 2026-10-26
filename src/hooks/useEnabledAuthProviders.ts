import { useEffect, useState } from 'react';

export type OAuthProvider = 'google' | 'github' | 'discord';

const ALL: OAuthProvider[] = ['google', 'github', 'discord'];

const configured = (import.meta.env.VITE_AUTH_PROVIDERS as string | undefined)
  ?.split(',')
  .map((p) => p.trim().toLowerCase())
  .filter((p): p is OAuthProvider => (ALL as string[]).includes(p));

const candidates: OAuthProvider[] = configured && configured.length > 0 ? configured : ALL;

let cached: OAuthProvider[] | null = null;

async function loadEnabled(): Promise<OAuthProvider[]> {
  if (cached) return cached;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;
  if (!url || !key) return [];
  try {
    const res = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } });
    if (!res.ok) return [];
    const json = await res.json();
    cached = candidates.filter((p) => json?.external?.[p] === true);
    return cached;
  } catch {
    return [];
  }
}

/** Providers that are both allowed by the app and actually enabled in Supabase. */
export function useEnabledAuthProviders(active: boolean): OAuthProvider[] {
  const [providers, setProviders] = useState<OAuthProvider[]>(cached ?? []);

  useEffect(() => {
    if (!active || cached) return;
    let live = true;
    loadEnabled().then((p) => live && setProviders(p));
    return () => {
      live = false;
    };
  }, [active]);

  return providers;
}
