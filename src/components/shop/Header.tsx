import { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CartDrawer } from './CartDrawer';
import { Menu, Sparkles, Camera, TrendingUp } from 'lucide-react';
import UserMenu from '@/components/auth/UserMenu';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { VisionScanner } from '@/components/scanner/VisionScanner';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';

const mobileLinks = [
  { to: '/#make-your-own', label: 'Discover', icon: Sparkles },
  { to: '/live-signals', label: 'Live Signals', icon: TrendingUp },
  { to: '/vision-scanner', label: 'Vision Scanner', icon: Camera },
  { to: '/marketplace', label: 'Marketplace', icon: Sparkles },
  { to: '/showcase', label: 'Showcase', icon: Sparkles },
  { to: '/benchmark', label: 'Benchmark', icon: Sparkles },
  { to: '/about', label: 'About', icon: Sparkles },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    if (location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      e.preventDefault();
      navigate('/');
      window.scrollTo({ top: 0 });
    }
  }, [location.pathname, navigate]);

  const handleHashNav = (to: string) => {
    if (to.includes('#')) {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          const el = document.querySelector(to.split('#')[1] ? `#${to.split('#')[1]}` : 'body');
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } else {
        const el = document.querySelector(to.split('#')[1] ? `#${to.split('#')[1]}` : 'body');
        el?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header 
      className="sticky top-0 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/85"
      style={{ zIndex: 9999, position: 'sticky', isolation: 'isolate' }}
    >
      <div className="container flex h-14 sm:h-16 items-center justify-between relative">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            onClick={handleLogoClick}
            className="flex items-center gap-2 sm:gap-3 group"
          >
            <img 
              src={enPensentLogo} 
              alt="En Pensent Logo" 
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover glow-gold group-hover:scale-105 transition-transform"
            />
            <div className="hidden sm:block">
              <h1 className="text-base sm:text-lg font-royal font-bold tracking-wider text-gold-gradient uppercase">
                En Pensent
              </h1>
            </div>
          </Link>
        </div>

        {/* Right side — minimal */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            to="/#make-your-own"
            onClick={(e) => { e.preventDefault(); handleHashNav('/#make-your-own'); }}
            className="hidden sm:inline-flex text-xs font-medium text-primary hover:text-primary/80 transition-colors uppercase tracking-wider items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Discover
          </Link>
          <button
            onClick={() => setScannerOpen(true)}
            className="hidden sm:inline-flex text-xs font-medium text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider items-center gap-1.5"
          >
            <Camera className="h-3.5 w-3.5" />
            Scanner
          </button>
          <UserMenu />
          <CartDrawer />
          <VisionScanner isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />
          
          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="sm:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-background border-border">
              <div className="flex flex-col gap-2 mt-6">
                {mobileLinks.map((link) => {
                  const isScanner = link.to === '/vision-scanner';
                  return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={(e) => {
                      setMobileMenuOpen(false);
                      if (isScanner) {
                        e.preventDefault();
                        setScannerOpen(true);
                      } else if (link.to.includes('#')) {
                        e.preventDefault();
                        handleHashNav(link.to);
                      }
                    }}
                    className="text-sm font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider py-2.5 px-3 rounded-lg flex items-center gap-3 hover:bg-muted/50 transition-colors"
                  >
                    {link.icon && <link.icon className="h-4 w-4" />}
                    {link.label}
                  </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
