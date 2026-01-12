import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Palette, Settings, Crown, CreditCard, Image, Gamepad2, BarChart3, History, Paintbrush, Shield, ShieldCheck, Wrench, Database } from 'lucide-react';
import AuthModal from './AuthModal';
import MFASetup from './MFASetup';
import PremiumBadge from '@/components/premium/PremiumBadge';
import { supabase } from '@/integrations/supabase/client';

const UserMenu: React.FC = () => {
  const { user, profile, isLoading, isPremium, mfaStatus, signOut, openCheckout, openCustomerPortal } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        
        if (error) throw error;
        setIsAdmin(!!data);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
    );
  }

  if (!user) {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAuthModal(true)}
          className="gap-2"
        >
          <User className="h-4 w-4" />
          Sign In
        </Button>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  const handleSubscriptionAction = async () => {
    try {
      if (isPremium) {
        await openCustomerPortal();
      } else {
        await openCheckout();
      }
    } catch (error) {
      console.error('Subscription action error:', error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 hover:bg-primary/10"
          >
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
              {initials}
            </div>
            <span className="hidden sm:inline text-sm font-medium">{displayName}</span>
            <PremiumBadge showText={false} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-card border-border z-50">
          <div className="px-3 py-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{displayName}</p>
              <PremiumBadge />
            </div>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          
          {!isPremium && (
            <>
              <DropdownMenuItem 
                onClick={handleSubscriptionAction}
                className="gap-2 cursor-pointer bg-primary/5 text-primary focus:bg-primary/10 focus:text-primary"
              >
                <Crown className="h-4 w-4" />
                Upgrade to Premium
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          
          <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
            Play
          </DropdownMenuLabel>
          <DropdownMenuItem 
            onClick={() => navigate('/play')}
            className="gap-2 cursor-pointer"
          >
            <Gamepad2 className="h-4 w-4" />
            Play En Pensent
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => navigate('/game-history')}
            className="gap-2 cursor-pointer"
          >
            <History className="h-4 w-4" />
            Game History
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => navigate('/creative-mode')}
            className="gap-2 cursor-pointer"
          >
            <Paintbrush className="h-4 w-4" />
            Creative Mode
            {!isPremium && <Crown className="h-3 w-3 text-primary ml-auto" />}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
            Studio
          </DropdownMenuLabel>
          <DropdownMenuItem 
            onClick={() => navigate('/my-palettes')}
            className="gap-2 cursor-pointer"
          >
            <Palette className="h-4 w-4" />
            My Palettes
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => navigate('/my-vision')}
            className="gap-2 cursor-pointer"
          >
            <Image className="h-4 w-4" />
            My Vision Gallery
            {!isPremium && <Crown className="h-3 w-3 text-primary ml-auto" />}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => navigate('/analytics')}
            className="gap-2 cursor-pointer"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </DropdownMenuItem>
          
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-primary uppercase tracking-wider flex items-center gap-1">
                <Crown className="h-3 w-3" />
                Admin
              </DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => navigate('/admin/seed-marketplace')}
                className="gap-2 cursor-pointer text-primary"
              >
                <Database className="h-4 w-4" />
                Seed Marketplace
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/admin/palettes')}
                className="gap-2 cursor-pointer text-primary"
              >
                <Wrench className="h-4 w-4" />
                Palette Admin
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          
          <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
            Account
          </DropdownMenuLabel>
          
          {isPremium && (
            <DropdownMenuItem 
              onClick={handleSubscriptionAction}
              className="gap-2 cursor-pointer"
            >
              <CreditCard className="h-4 w-4" />
              Manage Subscription
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            onClick={() => setShowMFASetup(true)}
            className="gap-2 cursor-pointer"
          >
            {mfaStatus.enabled ? (
              <ShieldCheck className="h-4 w-4 text-green-500" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            Security Settings
            {!isPremium && <Crown className="h-3 w-3 text-primary ml-auto" />}
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={() => navigate('/account')}
            className="gap-2 cursor-pointer"
          >
            <Settings className="h-4 w-4" />
            Account Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => signOut()}
            className="gap-2 cursor-pointer text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <MFASetup isOpen={showMFASetup} onClose={() => setShowMFASetup(false)} />
    </>
  );
};

export default UserMenu;
