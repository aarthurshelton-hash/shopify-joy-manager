import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Check, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import ScrollBackdrop from '@/components/homepage/ScrollBackdrop';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const AuthModal = lazy(() => import('@/components/auth/AuthModal'));

type Plan = 'monthly' | 'annual';

const PLANS: Record<Plan, { price: string; per: string; note: string }> = {
  monthly: { price: '$6.99', per: '/month', note: 'Cancel anytime' },
  annual: { price: '$59.99', per: '/year', note: 'Best value: about $5 a month' },
};

const PERKS = [
  'The full palette collection, including every new theme',
  'HD downloads of every visualization',
  'The complete visualization toolkit',
  'Cancel or change plan anytime from your account',
];

const Join: React.FC = () => {
  const [params] = useSearchParams();
  const { user, isPremium, isCheckingSubscription, openCheckout, openCustomerPortal } = useAuth();
  const [plan, setPlan] = useState<Plan>(params.get('plan') === 'annual' ? 'annual' : 'monthly');
  const [showAuth, setShowAuth] = useState(false);
  const [busy, setBusy] = useState(false);

  const start = async () => {
    if (!user) {
      localStorage.setItem('ep_pending_checkout', JSON.stringify({ plan, ts: Date.now() }));
      setShowAuth(true);
      return;
    }
    setBusy(true);
    try {
      await openCheckout(plan);
    } catch (err) {
      toast.error('Could not open checkout', { description: err instanceof Error ? err.message : 'Please try again' });
      setBusy(false);
    }
  };

  const manage = async () => {
    setBusy(true);
    try {
      await openCustomerPortal();
    } catch (err) {
      toast.error('Could not open billing', { description: err instanceof Error ? err.message : 'Please try again' });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (params.get('go') === '1' && user && !isPremium && !isCheckingSubscription && !busy) {
      void start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isPremium, isCheckingSubscription]);

  const p = PLANS[plan];

  return (
    <div className="min-h-screen bg-background">
      <ScrollBackdrop />
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-xl">
        <div className="rounded-2xl border border-primary/30 bg-black/60 backdrop-blur-sm p-8 text-center space-y-6">
          <Crown className="h-8 w-8 text-primary mx-auto" />
          <p className="font-display text-xs uppercase tracking-[0.3em] text-primary">En Pensent Premium</p>
          <h1 className="font-royal text-3xl font-bold">Go further with every game</h1>

          {isPremium ? (
            <>
              <p className="text-muted-foreground">Premium is active on your account. Thank you for supporting En Pensent.</p>
              <Button className="w-full" onClick={manage} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Manage billing'}
              </Button>
              <Link to="/" className="block text-sm text-primary underline">Back to your visualizations</Link>
            </>
          ) : (
            <>
              <div className="inline-flex rounded-lg border border-border overflow-hidden text-sm">
                {(['monthly', 'annual'] as Plan[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setPlan(k)}
                    className={`px-5 py-2 capitalize transition-colors ${plan === k ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'}`}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <div>
                <span className="text-4xl font-bold">{p.price}</span>
                <span className="text-muted-foreground">{p.per}</span>
                <p className="text-xs text-muted-foreground mt-1">{p.note}</p>
              </div>
              <ul className="text-left space-y-2 text-sm">
                {PERKS.map((t) => (
                  <li key={t} className="flex gap-2"><Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />{t}</li>
                ))}
              </ul>
              <Button className="w-full h-12 text-base" onClick={start} disabled={busy || isCheckingSubscription}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : user ? `Continue to secure checkout` : 'Create account and continue'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Secure payment by Stripe. {user ? '' : 'You will create your free account first, then go straight to checkout.'}
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
      {showAuth && (
        <Suspense fallback={null}>
          <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} defaultMode="signup" />
        </Suspense>
      )}
    </div>
  );
};

export default Join;
