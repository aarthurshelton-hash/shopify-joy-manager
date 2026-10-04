/**
 * SponsorQuest™ Custom Callback — client side.
 *
 * Matcherino redirects quest-clickers to our Visit URL with
 * `?matcherino_key=<click-id>-<40hex>`. We capture it, hold it in
 * localStorage (tokens don't expire; campaign caps might close), and
 * when the user performs the quest action we hand it to our server —
 * which posts it back to Matcherino server-to-server. The token never
 * leaves except: URL -> localStorage -> our API -> Matcherino.
 */

const KEY_STORAGE = 'ep_matcherino_key';
const COMPLETED_PREFIX = 'ep_matcherino_done_';

/** Call once on app load. Captures + strips matcherino_key from the URL. */
export function captureMatcherinoKey(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('matcherino_key');
    if (!token) return;
    // Newest click wins — overwrite per their spec
    localStorage.setItem(KEY_STORAGE, token);
    // Strip from the URL so it can't leak via share/copy/referrers
    url.searchParams.delete('matcherino_key');
    window.history.replaceState({}, '', url.toString());
  } catch {
    /* non-fatal */
  }
}

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(KEY_STORAGE);
  } catch {
    return null;
  }
}

/**
 * Mark a quest action as earned. Idempotent per action — fires once.
 * Sends the token to our server endpoint; Matcherino moves the reward
 * into the prize pool on their side.
 */
export function completeMatcherinoQuest(action: string): void {
  if (typeof window === 'undefined') return;
  const token = getStoredToken();
  if (!token) return;
  try {
    if (localStorage.getItem(COMPLETED_PREFIX + action)) return;
    localStorage.setItem(COMPLETED_PREFIX + action, '1');
  } catch {
    /* continue anyway */
  }
  // Fire-and-forget; server validates + posts back.
  fetch('/api/matcherino-quest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, action }),
    keepalive: true,
  }).then((res) => {
    // If the token was invalid/not a quest token, re-allow retry next session
    if (!res.ok && res.status === 400) {
      localStorage.removeItem(COMPLETED_PREFIX + action);
    }
  }).catch(() => {
    localStorage.removeItem(COMPLETED_PREFIX + action);
  });
}

/** True if the user arrived carrying a matcherino_key. */
export function hasMatcherinoQuestToken(): boolean {
  return !!getStoredToken();
}
