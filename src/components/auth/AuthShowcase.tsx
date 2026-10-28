import React from 'react';
import { Crown, Frame, Sparkles } from 'lucide-react';
import { PREMIUM_PERKS, PREMIUM_PRICE_MONTHLY } from '@/lib/premiumFeatures';

const POINTS = [
  { icon: Sparkles, text: 'Save and revisit every game you visualize' },
  { icon: Frame, text: 'Order archival prints and framed canvases' },
];

export const PremiumPerksList: React.FC<{ className?: string }> = ({ className }) => (
  <ul className={className ?? 'space-y-2'}>
    {PREMIUM_PERKS.map((perk) => (
      <li key={perk.title} className="flex items-start gap-2 text-sm text-white/85">
        <Crown className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
        <span>
          <span className="font-semibold text-white">{perk.title}</span>
          <span className="text-white/60"> · {perk.text}</span>
        </span>
      </li>
    ))}
  </ul>
);

const AuthShowcase: React.FC<{ headline?: string; premium?: boolean }> = ({ headline = 'Every game is a work of art.', premium = false }) => {
  return (
    <div className="relative hidden md:block min-h-[560px] overflow-hidden bg-black">
      <img src="/brand/hero.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/30" />
      <div className="relative flex h-full flex-col justify-end gap-4 p-8 text-white">
        <p className="font-display text-[11px] uppercase tracking-[0.3em] text-primary">{premium ? 'En Pensent Premium' : 'En Pensent'}</p>
        <h2 className="font-royal text-3xl font-bold leading-tight">{headline}</h2>
        {!premium && (
          <ul className="space-y-3">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm text-white/85">
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        )}
        <div className="rounded-lg border border-primary/30 bg-black/50 p-4 backdrop-blur-sm">
          <p className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-primary">
            <span>What Premium adds</span>
            <span>{PREMIUM_PRICE_MONTHLY}/mo</span>
          </p>
          <PremiumPerksList />
        </div>
        <p className="border-t border-white/15 pt-4 text-xs text-white/60">
          {premium ? 'Create your free account first, then go straight to secure checkout.' : 'Free to join. No card required. Upgrade any time.'}
        </p>
      </div>
    </div>
  );
};

export default AuthShowcase;
