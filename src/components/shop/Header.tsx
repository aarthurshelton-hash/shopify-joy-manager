import { useState } from 'react';
import { CartDrawer } from './CartDrawer';
import { CurrencySelector } from './CurrencySelector';
import { Menu, Gamepad2, Paintbrush, ShoppingBag, Scan } from 'lucide-react';
import UserMenu from '@/components/auth/UserMenu';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { VisionScannerButton } from '@/components/scanner/VisionScannerButton';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';
import { toast } from 'sonner';

const navLinks = [
  { to: '/play', label: 'Play', icon: Gamepad2, highlight: true },
  { to: '/creative-mode', label: 'Create', icon: Paintbrush, highlight: true },
  { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag, highlight: false },
  { to: '/about', label: 'About Us' },
  { to: '/news', label: 'News' },
  { to: '/investors', label: 'Investors' },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-20 items-center justify-between">
        {/* Left side - Logo and navigation */}
        <div className="flex items-center gap-8">
          {/* Logo link to homepage */}
          <Link to="/" onClick={handleLogoClick} className="flex items-center gap-4 group">
            {/* Premium logo mark */}
            <img 
              src={enPensentLogo} 
              alt="En Pensent Logo" 
              className="w-14 h-14 rounded-full object-cover glow-gold group-hover:scale-105 transition-transform"
            />
            
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
                className={`text-sm font-medium transition-colors uppercase tracking-wider flex items-center gap-1.5 ${
                  link.highlight 
                    ? 'text-primary hover:text-primary/80' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.icon && <link.icon className="h-4 w-4" />}
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* Right side - Scanner, User menu, cart, and mobile menu */}
        <div className="flex items-center gap-3">
          {/* Vision Scanner Button */}
          <div className="hidden sm:block">
            <VisionScannerButton variant="ghost" size="sm" showLabel={false} />
          </div>
          <div className="hidden sm:block">
            <CurrencySelector compact />
          </div>
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
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    if (isHomepage) {
                      e.preventDefault();
                      toast('Refreshing...', { icon: '♔', duration: 1000 });
                      setTimeout(() => window.location.reload(), 300);
                    }
                  }}
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
                      className={`text-lg font-medium transition-colors uppercase tracking-wider py-2 border-b border-border/50 flex items-center gap-2 ${
                        link.highlight 
                          ? 'text-primary' 
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {link.icon && <link.icon className="h-5 w-5" />}
                      {link.label}
                    </Link>
                  ))}
                </nav>
                
                {/* Vision Scanner for Mobile */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Scan a Vision</p>
                  <VisionScannerButton variant="outline" className="w-full justify-start" />
                </div>
                
                {/* Mobile currency selector */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Currency</p>
                  <CurrencySelector />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
