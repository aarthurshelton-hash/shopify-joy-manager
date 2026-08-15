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
import enPensentLogo from '@/assets/en-pensent-logo-new.png';
import React, { forwardRef } from 'react';

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
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center space-y-3">
          <Link to="/" onClick={handleLogoClick} className="group">
            <img 
              src={enPensentLogo} 
              alt="En Pensent Logo" 
              className="w-10 h-10 rounded-full object-cover glow-gold group-hover:scale-105 transition-transform"
            />
          </Link>
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} En Pensent. All rights reserved.
          </p>
        </div>
      </div>
      <div className="h-safe-bottom" />
    </footer>
  );
});

Footer.displayName = 'Footer';
