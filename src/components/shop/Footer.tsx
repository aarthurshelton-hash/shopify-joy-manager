import { Link } from 'react-router-dom';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';

export const Footer = () => {
  return (
    <footer className="border-t border-border/50 mt-20 bg-card/30">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col items-center space-y-4">
          {/* Logo */}
          <Link to="/" className="group">
            <img 
              src={enPensentLogo} 
              alt="En Pensent Logo" 
              className="w-16 h-16 rounded-full object-cover glow-gold group-hover:scale-105 transition-transform"
            />
          </Link>
          
          {/* Brand name */}
          <p className="text-lg font-royal font-bold tracking-widest uppercase text-gold-gradient">
            En Pensent
          </p>
          
          {/* Tagline */}
          <p className="text-sm text-muted-foreground font-serif italic">
            Transform chess games into timeless art
          </p>
          
          {/* Copyright */}
          <p className="text-xs text-muted-foreground/70 pt-2">
            © {new Date().getFullYear()} En Pensent. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};