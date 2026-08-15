import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Sparkles, ShoppingBag, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const TABS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/#make-your-own', label: 'Discover', icon: Sparkles, isHash: true },
  { to: '/marketplace', label: 'Market', icon: ShoppingBag },
  { to: '/account', label: 'Account', icon: User },
];

export const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/';
    if (to === '/marketplace') return location.pathname.startsWith('/marketplace');
    if (to === '/account') return location.pathname === '/account';
    return false;
  };

  const handleTabClick = (e: React.MouseEvent, tab: typeof TABS[number]) => {
    if (tab.isHash) {
      e.preventDefault();
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          document.querySelector('#make-your-own')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } else {
        document.querySelector('#make-your-own')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[9998] border-t border-border/60 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/90"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-14 max-w-md mx-auto">
        {TABS.map((tab) => {
          const active = isActive(tab.to);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              onClick={(e) => handleTabClick(e, tab)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[9px] uppercase tracking-wider font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
