import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Palette, Settings, Crown, CreditCard, Image, Gamepad2, BarChart3, History, Paintbrush, Shield, ShieldCheck, Wrench, Database, Wallet, Banknote, Scale, Gift, LayoutDashboard, BookOpen, ImageIcon, IdCard, LineChart, Zap, FileText, Code, Presentation, Sparkles } from 'lucide-react';
import AuthModal from './AuthModal';
import MFASetup from './MFASetup';
import PremiumBadge from '@/components/premium/PremiumBadge';
import { VisionaryMembershipCard } from '@/components/premium';
import { supabase } from '@/integrations/supabase/client';
import CEOBusinessCard from '@/components/admin/CEOBusinessCard';

const UserMenu: React.FC = () => {
  const { user, profile, isLoading, isPremium, isFreeAccount, mfaStatus, signOut, openCheckout, openCustomerPortal } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showVisionaryModal, setShowVisionaryModal] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [showCEOCard, setShowCEOCard] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [pendingDMCA, setPendingDMCA] = useState(0);

  // Check if user is admin and fetch pending withdrawals
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setPendingWithdrawals(0);
        setPendingDMCA(0);
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
        const adminStatus = !!data;
        setIsAdmin(adminStatus);
        
        // Fetch pending counts if admin
        if (adminStatus) {
          const [withdrawalsResult, dmcaResult] = await Promise.all([
            supabase
              .from('withdrawal_requests')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'pending'),
            supabase
              .from('dmca_reports')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'pending'),
          ]);
          
          if (!withdrawalsResult.error) {
            setPendingWithdrawals(withdrawalsResult.count || 0);
          }
          if (!dmcaResult.error) {
            setPendingDMCA(dmcaResult.count || 0);
          }
        }
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
          <span className="hidden sm:inline">Sign In</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => {
            setShowAuthModal(true);
          }}
          className="gap-1.5 btn-luxury hidden sm:flex"
        >
          <Gift className="h-4 w-4" />
          Free Sign Up
        </Button>
        <VisionaryMembershipCard
          isOpen={showVisionaryModal}
          onClose={() => setShowVisionaryModal(false)}
          onAuthRequired={() => {
            setShowVisionaryModal(false);
            setShowAuthModal(true);
          }}
          trigger="general"
        />
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} defaultMode="signup" />
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
            <Avatar className="h-7 w-7 border border-border">
              <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden sm:inline text-sm font-medium">{displayName}</span>
            <PremiumBadge showText={false} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-card border-border z-50 p-0 overflow-hidden">
          <ScrollArea className="h-auto max-h-[70vh] overflow-y-auto">
            <div className="p-1">
          <div className="px-3 py-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="text-xs bg-primary/20 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium truncate">{displayName}</p>
                  {isPremium ? (
                    <PremiumBadge />
                  ) : isFreeAccount ? (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-muted">FREE</Badge>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
          </div>
          <DropdownMenuSeparator />
          
          {!isPremium && (
            <>
              <DropdownMenuItem 
                onClick={() => setShowVisionaryModal(true)}
                className="gap-2 cursor-pointer bg-primary/5 text-primary focus:bg-primary/10 focus:text-primary"
              >
                <Crown className="h-4 w-4" />
                {isFreeAccount ? 'Upgrade to Premium' : 'Get Premium'}
                {isFreeAccount && (
                  <Badge variant="secondary" className="ml-auto text-[9px] px-1.5 bg-green-500/10 text-green-600">
                    Unlock All
                  </Badge>
                )}
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
            onClick={() => navigate('/creator-dashboard')}
            className="gap-2 cursor-pointer"
          >
            <Wallet className="h-4 w-4" />
            Creator Dashboard
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
                onClick={() => navigate('/admin/moderation')}
                className="gap-2 cursor-pointer text-primary"
              >
                <Shield className="h-4 w-4" />
                Content Moderation
              </DropdownMenuItem>
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
              <DropdownMenuItem 
                onClick={() => navigate('/admin/withdrawals')}
                className="gap-2 cursor-pointer text-primary"
              >
                <Banknote className="h-4 w-4" />
                Withdrawals
                {pendingWithdrawals > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-medium px-1.5 py-0.5 rounded-full">
                    {pendingWithdrawals}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/admin/dmca')}
                className="gap-2 cursor-pointer text-primary"
              >
                <Scale className="h-4 w-4" />
                DMCA Reports
                {pendingDMCA > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-medium px-1.5 py-0.5 rounded-full">
                    {pendingDMCA}
                  </span>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/admin/economics')}
                className="gap-2 cursor-pointer text-amber-500 font-semibold"
              >
                <BarChart3 className="h-4 w-4" />
                CEO Economics
                <Crown className="h-3 w-3 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/admin/ceo-dashboard')}
                className="gap-2 cursor-pointer text-amber-500 font-semibold"
              >
                <LayoutDashboard className="h-4 w-4" />
                CEO Dashboard
                <Crown className="h-3 w-3 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/book')}
                className="gap-2 cursor-pointer text-amber-500 font-semibold"
              >
                <BookOpen className="h-4 w-4" />
                Book Generator
                <Crown className="h-3 w-3 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/admin/ai-art-bank')}
                className="gap-2 cursor-pointer text-amber-500 font-semibold"
              >
                <ImageIcon className="h-4 w-4" />
                AI Art Bank
                <Crown className="h-3 w-3 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setShowCEOCard(true)}
                className="gap-2 cursor-pointer text-amber-500 font-semibold"
              >
                <IdCard className="h-4 w-4" />
                CEO Business Card
                <Crown className="h-3 w-3 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/premium-analytics')}
                className="gap-2 cursor-pointer text-amber-500 font-semibold"
              >
                <BarChart3 className="h-4 w-4" />
                Premium Analytics
                <Crown className="h-3 w-3 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-amber-500 uppercase tracking-wider flex items-center gap-1">
                <Zap className="h-3 w-3" />
                En Pensent Engine
              </DropdownMenuLabel>
              <DropdownMenuItem 
                onClick={() => navigate('/admin/system-vitals')}
                className="gap-2 cursor-pointer text-amber-500 font-semibold bg-amber-500/10"
              >
                <Zap className="h-4 w-4 animate-pulse" />
                System Vitals (LIVE)
                <Crown className="h-3 w-3 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/benchmark')}
                className="gap-2 cursor-pointer text-amber-500 font-semibold"
              >
                <BarChart3 className="h-4 w-4" />
                Benchmark Engine
                <Crown className="h-3 w-3 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/stock-predictions')}
                className="gap-2 cursor-pointer text-amber-500 font-semibold"
              >
                <LineChart className="h-4 w-4" />
                Stock Predictions
                <Crown className="h-3 w-3 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/trading')}
                className="gap-2 cursor-pointer text-amber-500 font-semibold"
              >
                <Zap className="h-4 w-4" />
                Trading Terminal
                <Crown className="h-3 w-3 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/strategic-plan')}
                className="gap-2 cursor-pointer text-amber-500 font-semibold"
              >
                <FileText className="h-4 w-4" />
                Strategic Plan
                <Crown className="h-3 w-3 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/code-analysis')}
                className="gap-2 cursor-pointer text-amber-500 font-semibold"
              >
                <Code className="h-4 w-4" />
                Code Analyzer
                <Crown className="h-3 w-3 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/showcase')}
                className="gap-2 cursor-pointer text-amber-500 font-semibold"
              >
                <Presentation className="h-4 w-4" />
                Showcase Tour
                <Crown className="h-3 w-3 ml-auto" />
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => navigate('/investor-portal')}
                className="gap-2 cursor-pointer text-amber-500 font-semibold"
              >
                <Sparkles className="h-4 w-4" />
                Investor Portal
                <Crown className="h-3 w-3 ml-auto" />
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
            </div>
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      <MFASetup isOpen={showMFASetup} onClose={() => setShowMFASetup(false)} />
      
      <CEOBusinessCard isOpen={showCEOCard} onClose={() => setShowCEOCard(false)} />
      
      <VisionaryMembershipCard
        isOpen={showVisionaryModal}
        onClose={() => setShowVisionaryModal(false)}
        onAuthRequired={() => {
          setShowVisionaryModal(false);
          setShowAuthModal(true);
        }}
        trigger="general"
      />
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};

export default UserMenu;
