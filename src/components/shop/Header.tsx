import { CartDrawer } from './CartDrawer';
import { Crown } from 'lucide-react';
import UserMenu from '@/components/auth/UserMenu';
import { Link } from 'react-router-dom';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-20 items-center justify-between">
        {/* Left side - Logo and navigation */}
        <div className="flex items-center gap-8">
          {/* Logo link to homepage */}
          <Link to="/" className="flex items-center gap-4 group">
            {/* Premium logo mark */}
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center glow-gold group-hover:scale-105 transition-transform">
                <Crown className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            
            {/* Brand name with royal typography */}
            <div>
              <h1 className="text-2xl font-royal font-bold tracking-wider text-gold-gradient uppercase">
                En Pensent
              </h1>
              <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground font-sans">
                Chess Art Prints
              </p>
            </div>
          </Link>
          
          {/* Navigation links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              to="/about" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
            >
              About Us
            </Link>
            <Link 
              to="/investors" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
            >
              Investors
            </Link>
          </nav>
        </div>
        
        {/* Right side - User menu and cart */}
        <div className="flex items-center gap-3">
          <UserMenu />
          <CartDrawer />
        </div>
      </div>
    </header>
  );
};
