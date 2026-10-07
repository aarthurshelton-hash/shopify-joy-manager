import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { captureMatcherinoKey } from '@/lib/matcherino/sponsorQuest';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { recordFunnelEvent } from '@/lib/analytics/membershipFunnel';
import { SecurityEvents } from '@/lib/security/auditLog';
import { trackUserLocation } from '@/lib/security/trackLocation';
interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface SubscriptionStatus {
  subscribed: boolean;
  productId: string | null;
  subscriptionEnd: string | null;
  /** Where premium comes from: 'stripe' | 'grant' | 'visionary' | 'none'. */
  source?: string;
}

interface MFAStatus {
  enabled: boolean;
  factorId: string | null;
}

interface SignInResult {
  error: Error | null;
  requiresMFA?: boolean;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isPremium: boolean;
  isFreeAccount: boolean; // Has account but no premium subscription
  isAdmin: boolean;
  isCheckingAdmin: boolean;
  subscriptionStatus: SubscriptionStatus | null;
  isCheckingSubscription: boolean;
  mfaStatus: MFAStatus;
  signUp: (email: string, password: string, displayName?: string, phone?: string) => Promise<{ error: Error | null; needsEmailConfirm?: boolean }>;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>) => Promise<{ error: Error | null }>;
  checkSubscription: () => Promise<void>;
  openCheckout: (plan?: 'monthly' | 'annual') => Promise<void>;
  openCustomerPortal: () => Promise<void>;
  checkMFAStatus: () => Promise<MFAStatus>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Premium product IDs from Stripe — monthly + annual may be separate
// products; any of them unlocks premium. Env override for config swaps.
const PREMIUM_PRODUCT_IDS: string[] = [
  import.meta.env.VITE_STRIPE_PREMIUM_PRODUCT_ID || 'prod_VNLrMo6iGfvfK8',
  import.meta.env.VITE_STRIPE_ANNUAL_PRODUCT_ID || 'prod_VNLvKH3PeTXvrS',
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  // Start as true to indicate we haven't finished initial check yet
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(true);
  const [hasCompletedInitialCheck, setHasCompletedInitialCheck] = useState(false);
  const [mfaStatus, setMfaStatus] = useState<MFAStatus>({ enabled: false, factorId: null });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);

  const isPremium =
    isAdmin ||
    (!!subscriptionStatus?.subscribed &&
      !!subscriptionStatus?.productId &&
      PREMIUM_PRODUCT_IDS.includes(subscriptionStatus.productId));
  // User has an account but no active premium subscription
  const isFreeAccount = !!user && !isPremium;

  // CEO email - hardcoded for guaranteed access
  const CEO_EMAIL = 'a.arthur.shelton@gmail.com';

  // Check admin role (with CEO email fallback)
  const checkAdminRole = useCallback(async (userId: string, userEmail?: string | null) => {
    setIsCheckingAdmin(true);
    try {
      // CEO email gets automatic admin access
      if (userEmail?.toLowerCase() === CEO_EMAIL.toLowerCase()) {
        setIsAdmin(true);
        setIsCheckingAdmin(false);
        
        // Also ensure the admin role exists in database (fire and forget)
        supabase.functions.invoke('grant-ceo-admin').catch(() => {});
        return;
      }
      
      // Check database for admin role
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();
      
      setIsAdmin(!error && !!data);
    } catch {
      setIsAdmin(false);
    } finally {
      setIsCheckingAdmin(false);
    }
  }, []);

  // Check MFA status
  const checkMFAStatus = useCallback(async (): Promise<MFAStatus> => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const verifiedTOTP = data.totp?.find(factor => factor.status === 'verified');
      const status = {
        enabled: !!verifiedTOTP,
        factorId: verifiedTOTP?.id || null,
      };
      setMfaStatus(status);
      return status;
    } catch (error) {
      console.error('Error checking MFA status:', error);
      return { enabled: false, factorId: null };
    }
  }, []);

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (!error && data) {
      setProfile(data);
    }
  };

  // Check subscription status
  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setSubscriptionStatus(null);
      setIsCheckingSubscription(false);
      setHasCompletedInitialCheck(true);
      return;
    }

    setIsCheckingSubscription(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        setSubscriptionStatus(null);
      } else {
        setSubscriptionStatus({
          subscribed: data.subscribed,
          productId: data.product_id,
          subscriptionEnd: data.subscription_end,
          source: data.source,
        });
      }
    } catch (err) {
      console.error('Error checking subscription:', err);
      setSubscriptionStatus(null);
    } finally {
      setIsCheckingSubscription(false);
      setHasCompletedInitialCheck(true);
    }
  }, [session?.access_token]);

  // Open Stripe checkout — full-page redirect (pop-up blockers kill window.open)
  const openCheckout = async (plan: 'monthly' | 'annual' = 'monthly') => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { plan },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to create checkout session');
    }

    if (data?.url) {
      window.location.href = data.url;
    }
  };

  // Open Stripe customer portal
  const openCustomerPortal = async () => {
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('customer-portal', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to create portal session');
    }

    if (data?.url) {
      window.open(data.url, '_blank');
    }
  };
// SponsorQuest: capture + strip matcherino_key from the URL on load
  useEffect(() => {
    captureMatcherinoKey();
  }, []);

  
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Use setTimeout to avoid potential deadlock with Supabase client
          setTimeout(() => {
            fetchProfile(currentSession.user.id);
            checkAdminRole(currentSession.user.id, currentSession.user.email);

            // First-time OAuth sign-in: email signups are tracked in signUp(),
            // OAuth ones would otherwise be invisible in the funnel.
            const u = currentSession.user;
            const provider = u.app_metadata?.provider;
            const isFresh = Date.now() - new Date(u.created_at).getTime() < 5 * 60 * 1000;
            const flag = `ep_oauth_signup_tracked_${u.id}`;
            if (event === 'SIGNED_IN' && provider && provider !== 'email' && isFresh && !localStorage.getItem(flag)) {
              localStorage.setItem(flag, '1');
              recordFunnelEvent('signup_completed', {
                trigger_source: 'oauth',
                account_type: 'free',
                provider,
              });
              trackUserLocation(u.id);
            }
          }, 0);
        } else {
          setProfile(null);
          setSubscriptionStatus(null);
          setIsAdmin(false);
          setIsCheckingAdmin(false);
        }
        
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id);
        checkAdminRole(currentSession.user.id, currentSession.user.email);
      } else {
        setIsCheckingAdmin(false);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check subscription when session changes
  useEffect(() => {
    if (session?.access_token) {
      checkSubscription();
    }
  }, [session?.access_token, checkSubscription]);

  // Auto-refresh subscription status every minute
  useEffect(() => {
    if (!session?.access_token) return;

    const interval = setInterval(() => {
      checkSubscription();
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [session?.access_token, checkSubscription]);

  // Check for subscription success in URL — greet the new Visionary
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('subscription') === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      toast.success('Welcome, Visionary.', {
        description: 'HD exports, animated GIFs, marketplace access, and full opponent history are now yours.',
        duration: 8000,
      });
      checkSubscription();
    }
  }, [checkSubscription]);

  // Resume a pending checkout after signup/sign-in completes.
  // Intent is stored as {plan, ts} and expires after 1 hour so a stale
  // flag can't surprise a user with a checkout redirect days later.
  useEffect(() => {
    if (!user || !session?.access_token) return;
    const raw = localStorage.getItem('ep_pending_checkout');
    if (!raw) return;

    let plan: 'monthly' | 'annual' = 'monthly';
    let stale = false;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && 'ts' in parsed) {
        plan = parsed.plan === 'annual' ? 'annual' : 'monthly';
        stale = Date.now() - Number(parsed.ts) > 60 * 60 * 1000;
      } else {
        plan = raw === 'annual' ? 'annual' : 'monthly';
      }
    } catch {
      plan = raw === 'annual' ? 'annual' : 'monthly';
    }

    localStorage.removeItem('ep_pending_checkout');
    if (stale) return;

    openCheckout(plan).catch((err) => {
      console.error('Pending checkout failed:', err);
      toast.error('Could not open checkout — try Upgrade again.');
    });
  }, [user, session?.access_token]);

  const signUp = async (email: string, password: string, displayName?: string, phone?: string) => {
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: displayName,
          phone: phone,
        },
      },
    });
    
    // Track successful signup - now tracking as free_account_created
    if (!error && data.user) {
      recordFunnelEvent('signup_completed', {
        trigger_source: 'auth_modal',
        account_type: 'free',
        has_phone: !!phone,
      });
      
      // Log security event and track location
      SecurityEvents.userSignUp(data.user.id, {
        email: email,
        has_phone: !!phone,
        has_display_name: !!displayName,
      });
      
      // Track geolocation in background
      trackUserLocation(data.user.id);
    }

    // Email confirmation ON → user exists but has no session yet
    const needsEmailConfirm = !error && !!data.user && !data.session;
    return { error, needsEmailConfirm };
  };

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log failed sign-in attempt
      SecurityEvents.signInFailed(email, error.message);
      return { error };
    }

    // Log successful sign-in and track location
    if (data.user) {
      SecurityEvents.userSignIn(data.user.id, { email });
      trackUserLocation(data.user.id);
    }

    // Check if MFA is required (user has factors enrolled)
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const hasVerifiedTOTP = factorsData?.totp?.some(factor => factor.status === 'verified');

    if (hasVerifiedTOTP) {
      // Check the assurance level to see if MFA verification is needed
      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      
      if (aalData?.currentLevel === 'aal1' && aalData?.nextLevel === 'aal2') {
        return { error: null, requiresMFA: true };
      }
    }

    return { error: null, requiresMFA: false };
  };

  const signOut = async () => {
    // Log sign-out before clearing state
    if (user) {
      SecurityEvents.userSignOut(user.id);
    }
    
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSubscriptionStatus(null);
    setMfaStatus({ enabled: false, factorId: null });
    setIsAdmin(false);
    setIsCheckingAdmin(false);
    setHasCompletedInitialCheck(false);
    setIsCheckingSubscription(false);
  };

  const updateProfile = async (updates: Partial<Pick<Profile, 'display_name' | 'avatar_url'>>) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id);
    
    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
    }
    
    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      isLoading,
      isPremium,
      isFreeAccount,
      isAdmin,
      isCheckingAdmin,
      subscriptionStatus,
      isCheckingSubscription,
      mfaStatus,
      signUp,
      signIn,
      signOut,
      updateProfile,
      checkSubscription,
      openCheckout,
      openCustomerPortal,
      checkMFAStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
