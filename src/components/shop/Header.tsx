import { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CartDrawer } from './CartDrawer';
import { CurrencySelector } from './CurrencySelector';
import { Menu, ShoppingBag, Sparkles, BarChart3, Eye, BookOpen, Code2, TrendingUp, Info, Frame } from 'lucide-react';
import UserMenu from '@/components/auth/UserMenu';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SubscriptionNotificationBell } from '@/components/notifications/SubscriptionNotificationBell';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';


// PUBLIC navigation links - only shows public features
// Trading, Stock Predictions, Strategic Plan are ADMIN ONLY
const navLinks = [
  { to: '/#make-your-own', label: 'Discover', icon: Sparkles, highlight: true },
  { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag, highlight: false },
  { to: '/showcase', label: 'Showcase', icon: Frame },
  { to: '/benchmark', label: 'Benchmark', icon: BarChart3 },
  { to: '/about', label: 'About', icon: Info },
];

// Mobile menu groups — all public pages organized by category
const mobileMenuGroups = [
  {
    title: 'Discover',
    links: [
      { to: '/#make-your-own', label: 'Reveal Your Game', icon: Sparkles },
      { to: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
      { to: '/showcase', label: 'Showcase', icon: Frame },
      { to: '/book', label: 'Books', icon: BookOpen },
    ],
  },
  {
    title: 'Science',
    links: [
      { to: '/whitepaper', label: 'Whitepaper', icon: BookOpen },
      { to: '/benchmark', label: 'Benchmark', icon: BarChart3 },
      { to: '/vs-stockfish', label: 'EP vs Stockfish', icon: TrendingUp },
      { to: '/proof', label: 'Proof Center', icon: Eye },
    ],
  },
  {
    title: 'Develop',
    links: [
      { to: '/sdk-docs', label: 'SDK Docs', icon: Code2 },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About', icon: Info },
      { to: '/investors', label: 'Investors', icon: TrendingUp },
    ],
  },
];

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = useCallback((e: React.MouseEvent) => {
    if (location.pathname === '/') {
      // Already on homepage — smooth scroll to top, no reload
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.pathname]);
  return (
    <header 
      className="sticky top-0 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/85"
      style={{ zIndex: 9999, position: 'sticky', isolation: 'isolate' }}
    >
      <div className="container flex h-16 sm:h-18 md:h-20 items-center justify-between relative">
        {/* Left side - Logo and navigation */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* Logo link to homepage */}
          <Link 
            to="/" 
            onClick={handleLogoClick}
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
                Universal Pattern Intelligence
              </p>
            </div>
          </Link>
          
          {/* Desktop navigation links - show on lg+ */}
          <nav className="hidden lg:flex items-center gap-3 xl:gap-5 relative z-20">
            {navLinks.map((link) => {
              const isHashLink = link.to.includes('#');
              const handleNavClick = (e: React.MouseEvent) => {
                if (isHashLink) {
                  e.preventDefault();
                  if (location.pathname !== '/') {
                    navigate('/');
                    setTimeout(() => {
                      const el = document.querySelector(link.to.split('#')[1] ? `#${link.to.split('#')[1]}` : 'body');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }, 300);
                  } else {
                    const el = document.querySelector(link.to.split('#')[1] ? `#${link.to.split('#')[1]}` : 'body');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }
                }
              };
              return (
                <Link 
                  key={link.to}
                  to={link.to}
                  onClick={handleNavClick}
                  className={`text-xs xl:text-sm font-medium transition-colors uppercase tracking-wider flex items-center gap-1.5 relative z-10 ${
                    link.highlight 
                      ? 'text-primary hover:text-primary/80' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {link.icon && <link.icon className="h-3.5 w-3.5 xl:h-4 xl:w-4" />}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        
        {/* Right side - Scanner, User menu, cart, and mobile menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
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
                <Link 
                  to="/"
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
                      Universal Pattern Intelligence
                    </span>
                  </div>
                </Link>
                
                {/* Mobile nav links — grouped by category */}
                <nav className="flex flex-col gap-5">
                  {mobileMenuGroups.map((group) => (
                    <div key={group.title}>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-display font-bold mb-2 px-3">
                        {group.title}
                      </p>
                      <div className="flex flex-col gap-0.5">
                        {group.links.map((link) => {
                          const isHashLink = link.to.includes('#');
                          return (
                            <Link 
                              key={link.to}
                              to={link.to}
                              onClick={(e) => {
                                setMobileMenuOpen(false);
                                if (isHashLink) {
                                  e.preventDefault();
                                  if (location.pathname !== '/') {
                                    navigate('/');
                                    setTimeout(() => {
                                      const el = document.querySelector(link.to.split('#')[1] ? `#${link.to.split('#')[1]}` : 'body');
                                      el?.scrollIntoView({ behavior: 'smooth' });
                                    }, 300);
                                  } else {
                                    const el = document.querySelector(link.to.split('#')[1] ? `#${link.to.split('#')[1]}` : 'body');
                                    el?.scrollIntoView({ behavior: 'smooth' });
                                  }
                                }
                              }}
                              className={`text-sm font-medium transition-colors uppercase tracking-wider py-2.5 px-3 rounded-lg flex items-center gap-3 ${
                                link.to === '/#make-your-own' || link.to === '/marketplace'
                                  ? 'text-primary bg-primary/5 hover:bg-primary/10' 
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                              }`}
                            >
                              {link.icon && <link.icon className="h-4 w-4" />}
                              {link.label}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </nav>
                
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
