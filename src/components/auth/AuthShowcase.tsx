import React from 'react';
import { Frame, Sparkles, ShieldCheck } from 'lucide-react';

const POINTS = [
  { icon: Sparkles, text: 'Save and revisit every game you visualize' },
  { icon: Frame, text: 'Order archival prints and framed canvases' },
  { icon: ShieldCheck, text: 'Premium palettes, HD downloads and more' },
];

const AuthShowcase: React.FC<{ headline?: string }> = ({ headline = 'Every game is a work of art.' }) => {
  return (
    <div className="relative hidden md:block min-h-[560px] overflow-hidden bg-black">
      <img src="/brand/hero.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
      <div className="relative flex h-full flex-col justify-end gap-5 p-8 text-white">
        <p className="font-display text-[11px] uppercase tracking-[0.3em] text-primary">En Pensent</p>
        <h2 className="font-royal text-3xl font-bold leading-tight">{headline}</h2>
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
        <p className="border-t border-white/15 pt-4 text-xs text-white/60">Free to join. No card required.</p>
      </div>
    </div>
  );
};

export default AuthShowcase;
