import { useState } from 'react';
import { CartDrawer } from './CartDrawer';
import { Menu } from 'lucide-react';
import UserMenu from '@/components/auth/UserMenu';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';

const navLinks = [
  { to: '/about', label: 'About Us' },
  { to: '/news', label: 'News' },
  { to: '/investors', label: 'Investors' },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-20 items-center justify-between">
        {/* Left side - Logo and navigation */}
        <div className="flex items-center gap-8">
          {/* Logo link to homepage */}
          <Link to="/" className="flex items-center gap-4 group">
            {/* Premium logo mark */}
            <div className="relative">
              <img 
                src={enPensentLogo} 
                alt="En Pensent Logo" 
                className="w-14 h-14 rounded-full object-cover glow-gold group-hover:scale-105 transition-transform"
              />
            </div>
            
            {/* Brand name with royal typography */}
            <div className="hidden sm:block">
              <h1 className="text-2xl font-royal font-bold tracking-wider text-gold-gradient uppercase">
                En Pensent
              </h1>
              <p className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground font-sans">
                Chess Art Prints
              </p>
            </div>
          </Link>
          
          {/* Desktop navigation links */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.to}
                to={link.to} 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Right side - User menu, cart, and mobile menu */}
        <div className="flex items-center gap-3">
          <UserMenu />
          <CartDrawer />
          
          {/* Mobile menu trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-10 w-10">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background border-border">
              <div className="flex flex-col gap-6 mt-8">
                {/* Mobile brand */}
                <Link 
                  to="/" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3"
                >
                  <img 
                    src={enPensentLogo} 
                    alt="En Pensent Logo" 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <span className="text-xl font-royal font-bold tracking-wider text-gold-gradient uppercase">
                    En Pensent
                  </span>
                </Link>
                
                {/* Mobile nav links */}
                <nav className="flex flex-col gap-4 mt-4">
                  {navLinks.map((link) => (
                    <Link 
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider py-2 border-b border-border/50"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
