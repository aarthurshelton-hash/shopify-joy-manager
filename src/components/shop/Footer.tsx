/**
 * @license
 * Copyright (c) 2024-2026 En Pensent LLC. All Rights Reserved.
 * 
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use of this software,
 * via any medium, is strictly prohibited without the express written permission
 * of En Pensent LLC.
 */

import { Link, useLocation } from 'react-router-dom';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import React, { forwardRef } from 'react';

export const Footer = forwardRef<HTMLElement, object>(function Footer(_props, ref) {
  const location = useLocation();
  const isHomepage = location.pathname === '/';

  const handleLogoClick = (e: React.MouseEvent) => {
    if (isHomepage) {
      e.preventDefault();
      toast('Refreshing...', { icon: '♔', duration: 1000 });
      setTimeout(() => window.location.reload(), 300);
    }
  };
  
  return (
    <footer ref={ref} className="border-t border-border/40 mt-16 sm:mt-20 bg-card/30">
      <div className="container mx-auto px-4 py-8 sm:py-10 md:py-12">
        <div className="flex flex-col items-center space-y-4 sm:space-y-5">
          {/* Decorative divider */}
          <div className="divider-gold w-32 sm:w-40 mb-2" />
          
          {/* Logo */}
          <Link to="/" onClick={handleLogoClick} className="group">
            <img 
              src={enPensentLogo} 
              alt="En Pensent Logo" 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover glow-gold group-hover:scale-105 transition-transform"
            />
          </Link>
          
          {/* Brand name */}
          <p className="text-base sm:text-lg font-royal font-bold tracking-widest uppercase text-gold-gradient">
            En Pensent
          </p>
          
          {/* Tagline */}
          <p className="text-sm sm:text-base text-muted-foreground font-serif italic text-center px-4">
            The future of chess intelligence
          </p>
          
          {/* Links - visible on tablet+ */}
          <nav className="hidden sm:flex items-center gap-6 pt-2">
            <Link to="/about" className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/marketplace" className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">Marketplace</Link>
            <Link to="/investors" className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">Investors</Link>
          </nav>
          
          {/* Legal Links */}
          <nav className="flex items-center gap-4 pt-3 flex-wrap justify-center">
            <Link to="/terms" className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors">Terms of Service</Link>
            <span className="text-muted-foreground/30">•</span>
            <Link to="/privacy" className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors">Privacy Policy</Link>
            <span className="text-muted-foreground/30">•</span>
            <Link to="/dmca" className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors">DMCA</Link>
          </nav>
          
          {/* Copyright & Protection Notice */}
          <div className="flex flex-col items-center gap-2 pt-4 sm:pt-6">
            <p className="text-xs text-muted-foreground/60">
              © {new Date().getFullYear()} En Pensent LLC. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40">
              <Lock className="w-3 h-3" />
              <span>Patent Pending • Proprietary Technology</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Safe area padding for iOS */}
      <div className="h-safe-bottom" />
    </footer>
  );
});

Footer.displayName = 'Footer';
