/**
 * @license
 * Copyright (c) 2024-2026 Alec Arthur Shelton. All Rights Reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use of this software,
 * via any medium, is strictly prohibited without the express written permission
 * of the copyright holder.
 */

import { Link, useLocation } from 'react-router-dom';
import { MARKETPLACE_ENABLED } from '@/lib/featureFlags';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';
import React, { forwardRef } from 'react';

const PRODUCT_LINKS = [
  { to: '/', label: 'Visualize a Game' },
  { to: '/report', label: 'Game Report' },
  { to: '/fingerprint', label: 'Chess Fingerprint' },
  { to: '/draw-forecast', label: 'Draw Forecast' },
  { to: '/live-signals', label: 'Live Signals' },
  { to: '/shop', label: 'Shop Prints' },
  { to: '/order-print', label: 'Order a Print' },
];

const EXPLORE_LINKS = [
  ...(MARKETPLACE_ENABLED ? [{ to: '/marketplace', label: 'Marketplace' }] : []),
  { to: '/showcase', label: 'Showcase' },
  { to: '/tournament', label: 'Tournament' },
  { to: '/openings', label: 'Openings' },
  { to: '/proof', label: 'Proof Center' },
  { to: '/vs-stockfish', label: 'vs Stockfish' },
  { to: '/academic-paper', label: 'Academic Paper' },
];

const COMPANY_LINKS = [
  { to: '/about', label: 'About' },
  { to: '/sdk-docs', label: 'SDK Docs' },
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/dmca', label: 'DMCA' },
];

const LinkColumn = ({ title, links }: { title: string; links: { to: string; label: string }[] }) => (
  <div className="space-y-2">
    <h4 className="text-[10px] font-display uppercase tracking-widest text-muted-foreground/60">
      {title}
    </h4>
    <ul className="space-y-1.5">
      {links.map((l) => (
        <li key={l.to + l.label}>
          <Link
            to={l.to}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export const Footer = forwardRef<HTMLElement, object>(function Footer(_props, ref) {
  const location = useLocation();
  const isHomepage = location.pathname === '/';

  const handleLogoClick = (e: React.MouseEvent) => {
    if (isHomepage) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  return (
    <footer ref={ref} className="border-t border-border/40 mt-8 bg-card/30">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 space-y-3">
            <Link to="/" onClick={handleLogoClick} className="inline-block group">
              <img 
                src={enPensentLogo} 
                alt="En Pensent Logo" 
                className="w-10 h-10 rounded-full object-cover glow-gold group-hover:scale-105 transition-transform"
              />
            </Link>
            <p className="text-xs text-muted-foreground/70 max-w-[200px] leading-relaxed">
              We read the trajectory of a game — then turn it into art you can hang.
            </p>
          </div>

          <LinkColumn title="Tools" links={PRODUCT_LINKS} />
          <LinkColumn title="Explore" links={EXPLORE_LINKS} />
          <LinkColumn title="Company" links={COMPANY_LINKS} />
        </div>

        <div className="mt-8 pt-4 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground/60">
            © {new Date().getFullYear()} En Pensent. All rights reserved.
          </p>
          <p className="text-[11px] text-muted-foreground/40">
            Every game tells a story.
          </p>
        </div>
      </div>
      <div className="h-safe-bottom" />
    </footer>
  );
});

Footer.displayName = 'Footer';
