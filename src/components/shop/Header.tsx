import { useState } from 'react';
import { CartDrawer } from './CartDrawer';
import { CurrencySelector } from './CurrencySelector';
import { Menu, Gamepad2, Paintbrush, ShoppingBag, BookOpen, TrendingUp } from 'lucide-react';
import UserMenu from '@/components/auth/UserMenu';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { VisionScannerButton } from '@/components/scanner/VisionScannerButton';
import { SubscriptionNotificationBell } from '@/components/notifications/SubscriptionNotificationBell';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';


// PUBLIC navigation links - only shows public features
// Trading, Stock Predictions, Strategic Plan are ADMIN ONLY
const navLinks = [
  { to: '/play', label: 'Play', icon: Gamepad2, highlight: true },
  { to: '/creative-mode', label: 'Create', icon: Paintbrush, highlight: true },
  { to: '/code-analysis', label: 'Code Analysis', icon: TrendingUp, highlight: true },
  { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag, highlight: false },
  { to: '/openings', label: 'Openings', icon: BookOpen, highlight: false },
  { to: '/about', label: 'About Us' },
  { to: '/investors', label: 'Investors' },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isMarketplace = location.pathname === '/marketplace';

  // If on marketplace, clicking header links triggers a refresh
  const handleMarketplaceRefresh = () => {
    if (isMarketplace) {
      window.location.reload();
    }
  };
  return (
    <header 
      className="sticky top-0 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/85"
      style={{ zIndex: 9999, position: 'sticky', isolation: 'isolate' }}
    >
      <div className="container flex h-16 sm:h-18 md:h-20 items-center justify-between relative">
        {/* Left side - Logo and navigation */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* Logo link to homepage */}
          <a 
            href="/" 
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 sm:gap-3 group"
          >
            {/* Premium logo mark */}
            <img 
              src={enPensentLogo} 
              alt="En Pensent Logo" 
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full object-cover glow-gold group-hover:scale-105 transition-transform"
            />
            
            {/* Brand name with royal typography */}
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl md:text-2xl font-royal font-bold tracking-wider text-gold-gradient uppercase">
                En Pensent
              </h1>
              <p className="text-2xs sm:text-[9px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-muted-foreground font-sans">
                Chess Art Prints
              </p>
            </div>
          </a>
          
          {/* Desktop navigation links - show on lg+ */}
          <nav className="hidden lg:flex items-center gap-4 xl:gap-6 relative z-20">
            {navLinks.map((link) => (
              <a 
                key={link.to}
                href={link.to}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xs xl:text-sm font-medium transition-colors uppercase tracking-wider flex items-center gap-1.5 relative z-10 ${
                  link.highlight 
                    ? 'text-primary hover:text-primary/80' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.icon && <link.icon className="h-3.5 w-3.5 xl:h-4 xl:w-4" />}
                {link.label}
              </a>
            ))}
          </nav>
        </div>
        
        {/* Right side - Scanner, User menu, cart, and mobile menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          {/* Vision Scanner Button - hidden on mobile, show in menu */}
          <div className="hidden md:block">
            <VisionScannerButton variant="ghost" size="sm" showLabel={false} />
          </div>
          <div className="hidden md:block">
            <CurrencySelector compact />
          </div>
          <SubscriptionNotificationBell />
          <UserMenu />
          <CartDrawer />
          
          {/* Mobile/Tablet menu trigger - show below lg */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 sm:w-96 bg-background border-border">
              <div className="flex flex-col gap-6 mt-6">
                {/* Mobile brand */}
                <a 
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 pb-4 border-b border-border/50"
                >
                  <img 
                    src={enPensentLogo} 
                    alt="En Pensent Logo" 
                    className="w-12 h-12 rounded-full object-cover glow-gold"
                  />
                  <div>
                    <span className="text-xl font-royal font-bold tracking-wider text-gold-gradient uppercase block">
                      En Pensent
                    </span>
                    <span className="text-2xs uppercase tracking-widest text-muted-foreground">
                      Chess Art Prints
                    </span>
                  </div>
                </a>
                
                {/* Mobile nav links */}
                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <a 
                      key={link.to}
                      href={link.to}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`text-base font-medium transition-colors uppercase tracking-wider py-3 px-3 rounded-lg flex items-center gap-3 ${
                        link.highlight 
                          ? 'text-primary bg-primary/5 hover:bg-primary/10' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      {link.icon && <link.icon className="h-5 w-5" />}
                      {link.label}
                    </a>
                  ))}
                </nav>
                
                {/* Vision Scanner for Mobile */}
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-medium">Vision Scanner</p>
                  <VisionScannerButton variant="outline" className="w-full justify-start h-12" />
                </div>
                
                {/* Mobile currency selector */}
                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-medium">Currency</p>
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
