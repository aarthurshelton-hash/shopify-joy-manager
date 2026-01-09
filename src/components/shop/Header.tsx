import { CartDrawer } from './CartDrawer';
import { Crown } from 'lucide-react';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-20 items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Premium logo mark */}
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center glow-gold">
              <Crown className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          
          {/* Brand name with premium typography */}
          <div>
            <h1 className="text-2xl font-display font-semibold tracking-tight text-gold-gradient">
              En Pensent
            </h1>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-sans">
              Chess Art Prints
            </p>
          </div>
        </div>
        
        <CartDrawer />
      </div>
    </header>
  );
};
