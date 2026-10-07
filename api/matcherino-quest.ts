/**
 * SponsorQuest™ Custom Callback — server postback.
 *
 * Receives { token, action } from our client when a user earns a quest
 * completion, then POSTs the token to Matcherino's callback endpoint.
 * Server-side only per their spec — the token is a bearer credential
 * that must never transit client-to-Matcherino directly.
 *
 * Response classification follows their docs:
 *   - "already been completed" / "already performed this action" -> SUCCESS
 *   - invalid token / wrong kind / region blocks -> permanent failure, no retry
 *   - funds exhausted / cap reached / paused -> campaign-state, report
 *   - anything else -> transient failure (their 500 catch-all)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const CALLBACK_URL =
  'https://api.matcherino.com/__api/rewards/campaign/action/callback';

// Quest actions we actually award — extend only when a client call site exists.
// 'first_vision' = "generate your first vision" quest.
const ALLOWED_ACTIONS = new Set(['first_vision']);

// Best-effort per-instance rate limit (serverless instances are ephemeral).
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;
const hits = new Map<string, { count: number; start: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW_MS) {
    hits.set(ip, { count: 1, start: now });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_MAX;
}

interface QuestBody {
  token?: string;
  action?: string;
}

function classifyStatus(
  status: number,
  message: string,
): { ok: boolean; category: string } {
  if (status === 200) return { ok: true, category: 'completed' };
  const m = message.toLowerCase();
  if (
    m.includes('already been completed') ||
    m.includes('already performed this action')
  ) {
    return { ok: true, category: 'already_done' };
  }
  if (
    status === 400 ||
    status === 401 ||
    m.includes('invalid token') ||
    m.includes('incorrect campaign action kind') ||
    m.includes('not allowed to perform') ||
    m.includes('not available in your region') ||
    m.includes('blacklisted') ||
    m.includes('cannot be performed on tournaments') ||
    m.includes('not attached to this donation pool')
  ) {
    return { ok: false, category: 'permanent' };
  }
  if (
    m.includes('enough funds') ||
    m.includes('distribution cap') ||
    m.includes('has been paused') ||
    m.includes('disabled for the time being')
  ) {
    return { ok: false, category: 'campaign_state' };
  }
  return { ok: false, category: 'transient' };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const forwarded = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0])?.trim() || 'unknown';
  if (rateLimited(ip)) {
    return res.status(429).json({ ok: false, reason: 'rate_limited' });
  }

  const { token, action } = (req.body ?? {}) as QuestBody;
  if (!token || typeof token !== 'string' || token.length > 128) {
    return res.status(400).json({ ok: false, reason: 'missing_token' });
  }
  if (!action || !ALLOWED_ACTIONS.has(action)) {
    return res.status(202).json({ ok: false, reason: 'unknown_action' });
  }

  const payload: Record<string, unknown> = { token };

  try {
    const upstream = await fetch(CALLBACK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const text = await upstream.text();
    let message = '';
    try {
      const parsed = JSON.parse(text);
      message =
        (parsed && (parsed.message || parsed.reason || parsed.error)) || text;
    } catch {
      message = text;
    }

    const { ok, category } = classifyStatus(upstream.status, String(message));

    if (category === 'campaign_state') {
      console.error('matcherino-quest campaign-state rejection:', message);
      return res.status(202).json({ ok: false, reason: 'campaign_state' });
    }
    if (!ok) {
      const code = category === 'permanent' ? 400 : 502;
      console.error('matcherino-quest rejection:', upstream.status, message);
      return res.status(code).json({ ok: false, reason: category });
    }
    return res.status(200).json({ ok: true, category });
  } catch (err) {
    console.error('matcherino-quest upstream error:', err);
    return res.status(502).json({ ok: false, reason: 'upstream_error' });
  }
}
