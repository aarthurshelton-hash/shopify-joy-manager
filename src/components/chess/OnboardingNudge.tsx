import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, X, Crown, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const STORAGE_KEY = 'ep_first_viz_seen';
const NUDGE_DELAY_MS = 4000;

/**
 * #4 — First-run onboarding nudge.
 * After a user's first visualization, gently prompts them to save it or create an account.
 * Uses localStorage so it only appears once per browser. Non-intrusive — dismissible.
 */
export const OnboardingNudge: React.FC<{ active: boolean }> = ({ active }) => {
  const { user, isPremium } = useAuth();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!active || dismissed) return;

    const alreadySeen = localStorage.getItem(STORAGE_KEY);
    if (alreadySeen) return;

    const timer = setTimeout(() => {
      setVisible(true);
      localStorage.setItem(STORAGE_KEY, '1');
    }, NUDGE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [active, dismissed]);

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
  };

  if (!visible) return null;

  const isLoggedIn = !!user;
  const isPaid = isPremium;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 duration-500">
      <div className="relative rounded-xl border border-primary/30 bg-card shadow-xl p-4 space-y-3">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <h4 className="font-display text-sm font-semibold">
              {isPaid ? 'Save this vision?' : isLoggedIn ? 'Save this vision?' : 'Love this art?'}
            </h4>
            <p className="text-xs text-muted-foreground font-serif leading-relaxed">
              {isPaid
                ? 'Keep your visualizations in a personal gallery — download, share, or order prints anytime.'
                : isLoggedIn
                ? 'Upgrade to Visionary to save visualizations, download in HD, and build your collection.'
                : 'Create a free account to save your visualizations and build a personal chess art collection.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-12">
          {isPaid ? (
            <Button size="sm" className="gap-2 text-xs" asChild>
              <Link to="/my-vision">
                <Save className="h-3.5 w-3.5" />
                Go to Gallery
              </Link>
            </Button>
          ) : isLoggedIn ? (
            <Button size="sm" className="gap-2 text-xs" asChild>
              <Link to="/my-vision">
                <Crown className="h-3.5 w-3.5" />
                Become a Visionary
              </Link>
            </Button>
          ) : (
            <Button size="sm" className="gap-2 text-xs" asChild>
              <Link to="/auth">
                <Crown className="h-3.5 w-3.5" />
                Create Account
              </Link>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={handleDismiss} className="text-xs text-muted-foreground">
            Maybe later
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingNudge;
