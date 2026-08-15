import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Crown, ShoppingBag, BookOpen, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import enPensentLogo from "@/assets/en-pensent-logo-new.png";

const SUGGESTED_LINKS = [
  { to: "/", icon: Crown, label: "Home", desc: "Start your journey" },
  { to: "/marketplace", icon: ShoppingBag, label: "Marketplace", desc: "Browse vision art" },
  { to: "/whitepaper", icon: BookOpen, label: "Whitepaper", desc: "The science behind EP" },
  { to: "/benchmark", icon: TrendingUp, label: "Benchmark", desc: "EP vs Stockfish live" },
];

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <Link to="/" className="inline-block">
          <img
            src={enPensentLogo}
            alt="En Pensent"
            className="w-16 h-16 rounded-full object-cover glow-gold mx-auto"
          />
        </Link>

        <div className="space-y-2">
          <h1 className="font-royal text-5xl sm:text-6xl font-bold text-gold-gradient uppercase tracking-wide">
            404
          </h1>
          <p className="text-lg sm:text-xl text-foreground font-display">
            This move isn't in the book
          </p>
          <p className="text-sm text-muted-foreground font-serif">
            The page you're looking for has been captured or never existed.
          </p>
        </div>

        <div className="divider-gold w-32 mx-auto" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SUGGESTED_LINKS.map(({ to, icon: Icon, label, desc }) => (
            <Link key={to} to={to}>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card/50 hover:border-primary/30 hover:bg-primary/5 transition-all text-left">
                <Icon className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">{label}</p>
                  <p className="text-xs text-muted-foreground truncate">{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Link to="/">
          <Button variant="outline" className="gap-2 mt-2">
            <Crown className="h-4 w-4" />
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
