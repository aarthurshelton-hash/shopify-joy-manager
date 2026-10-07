/**
 * Redeem — landing page for En Pensent reward codes.
 * /redeem?code=EP-CHAMP-XXXX-XXXX (or typed manually).
 *
 * Codes come from tournament prize pools (Matcherino CSVs). Redeeming:
 *   1. creates a premium_grants row via the redeem_reward_code RPC
 *      (expiry stacks on top of any grant you already hold)
 *   2. stores the code in localStorage so cartStore attaches it as a
 *      Shopify discount on the next checkout
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Gift, Crown, BadgePercent, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { DISCOUNT_CODE_STORAGE } from '@/stores/cartStore';
import { recordFunnelEvent } from '@/lib/analytics/membershipFunnel';

interface RedeemResult {
  ok: boolean;
  error?: string;
  already_redeemed?: boolean;
  tier?: 'champion' | 'supporter';
  discount_percent?: number;
  premium_days?: number;
  expires_at?: string;
}

const ERROR_COPY: Record<string, string> = {
  not_authenticated: 'Sign in to redeem this code.',
  invalid_code: "That code isn't valid — check the card and try again.",
  code_used: 'This code has already been redeemed by another account.',
};

const Redeem: React.FC = () => {
  const { user, isLoading, checkSubscription } = useAuth();
  const [searchParams] = useSearchParams();
  const initialCode = (searchParams.get('code') || '').toUpperCase();

  const [code, setCode] = useState(initialCode);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<RedeemResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  // Code waiting on sign-in — auto-redeemed once a session exists.
  const pendingRef = useRef<string | null>(null);

  const redeem = useCallback(async (raw: string) => {
    const normalized = raw.trim().toUpperCase();
    if (!normalized) return;
    if (!user) {
      pendingRef.current = normalized;
      setAuthOpen(true);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('redeem_reward_code', {
        p_code: normalized,
      });
      if (rpcError) throw rpcError;
      const res = data as unknown as RedeemResult;

      if (!res?.ok) {
        setError(ERROR_COPY[res?.error ?? ''] || 'Redemption failed — try again.');
        setResult(null);
        return;
      }

      // Attach the Shopify discount to the next checkout.
      try {
        localStorage.setItem(DISCOUNT_CODE_STORAGE, normalized);
      } catch { /* non-fatal */ }

      setResult(res);
      recordFunnelEvent('reward_redeemed', { trigger_source: `reward_${res.tier}` }).catch(() => {});
      toast.success(
        res.tier === 'champion' ? 'Champion reward claimed.' : 'Supporter reward claimed.',
        { description: `${res.discount_percent}% off + ${res.premium_days} days of premium.` },
      );
      // Refresh premium state so gated features unlock immediately.
      checkSubscription().catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Redemption failed — try again.');
    } finally {
      setBusy(false);
    }
  }, [user, checkSubscription]);

  // Auto-redeem once signed in (covers URL-code + post-auth flows).
  useEffect(() => {
    if (isLoading || !user) return;
    const pending = pendingRef.current;
    if (pending) {
      pendingRef.current = null;
      redeem(pending);
    } else if (initialCode && !result && !busy) {
      redeem(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    redeem(code);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-28 pb-20 max-w-2xl">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-6">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-display text-4xl mb-3">Claim Your Reward</h1>
          <p className="text-muted-foreground mb-10">
            Codes from tournament prize pools unlock store credit and premium time.
            Enter the code printed on your card.
          </p>
        </div>

        {result?.ok ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
            <ShieldCheck className="h-10 w-10 text-emerald-400 mx-auto mb-4" />
            <h2 className="font-display text-2xl mb-2">
              {result.tier === 'champion' ? 'Champion Tier' : 'Supporter Tier'}
              {result.already_redeemed ? ' — already yours' : ' unlocked'}
            </h2>
            <div className="flex items-center justify-center gap-6 mt-5 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <BadgePercent className="h-5 w-5 text-primary" />
                <span>{result.discount_percent}% off — applied at checkout</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <span>{result.premium_days} days premium</span>
              </div>
            </div>
            {result.expires_at && (
              <p className="text-xs text-muted-foreground mb-6">
                Premium active until{' '}
                {new Date(result.expires_at).toLocaleDateString(undefined, {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
                . Redeem another code to stack more time.
              </p>
            )}
            <div className="flex items-center justify-center gap-3">
              <Button asChild>
                <Link to="/order-print">
                  Browse the shop <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">Turn a game into art</Link>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Tip: your card's artwork is scannable — try the{' '}
              <Link to="/vision-scanner" className="text-primary underline underline-offset-2">
                Vision Scanner
              </Link>{' '}
              on the front.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="max-w-md mx-auto">
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="EP-XXXX-XXXX-XXXX"
                className="font-mono tracking-wider text-center text-lg h-12"
                autoFocus
                spellCheck={false}
                autoComplete="off"
              />
              <Button type="submit" disabled={busy || !code.trim()} className="h-12 px-6">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Redeem'}
              </Button>
            </div>
            {error && <p className="text-sm text-destructive mt-3 text-center">{error}</p>}
            {!user && !isLoading && (
              <p className="text-xs text-muted-foreground mt-4 text-center">
                You'll be asked to sign in or create a free account to claim it.
              </p>
            )}
          </form>
        )}
      </main>
      <Footer />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultMode="signup" />
    </div>
  );
};

export default Redeem;
