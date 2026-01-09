import { CartDrawer } from './CartDrawer';

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">♔</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">En Pensent</h1>
            <p className="text-xs text-muted-foreground">Chess Art Prints</p>
          </div>
        </div>
        
        <CartDrawer />
      </div>
    </header>
  );
};
