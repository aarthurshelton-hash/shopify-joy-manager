import React, { useState, useEffect, forwardRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, Crown, Sparkles, Gift, Check, MailCheck } from 'lucide-react';
import MFAVerification from './MFAVerification';
import { useAuthRateLimit } from '@/hooks/useRateLimitV2';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

type AuthMode = 'signin' | 'signup' | 'forgot' | 'confirm-email';

const FREE_ACCOUNT_BENEFITS = [
  'Save email for personalized experience',
  'Track your visualization views',
  'Get notified about new features',
  'One-click upgrade to Premium anytime',
];

const AuthModal = forwardRef<HTMLDivElement, AuthModalProps>(({ isOpen, onClose, defaultMode = 'signin' }, ref) => {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMFAVerification, setShowMFAVerification] = useState(false);
  const { signIn, signUp } = useAuth();
  const { check: checkLimit, isLimited, resetInMs } = useAuthRateLimit();
  const retryAfter = resetInMs ? Math.ceil(resetInMs / 1000) : null;

  // The modal can stay mounted (isOpen toggles) — reset the mode each open
  useEffect(() => {
    if (isOpen) setMode(defaultMode);
  }, [isOpen, defaultMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check rate limit before proceeding (V2 is synchronous)
    const result = checkLimit();
    if (!result.allowed) return;
    
    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const { error, requiresMFA } = await signIn(email, password);
        if (error) {
          toast.error('Sign in failed', { description: error.message });
        } else if (requiresMFA) {
          setShowMFAVerification(true);
        } else {
          toast.success('Welcome back!');
          onClose();
          resetForm();
        }
      } else if (mode === 'signup') {
        const { error, needsEmailConfirm } = await signUp(email, password, displayName);
        if (error) {
          toast.error('Sign up failed', { description: error.message });
        } else if (needsEmailConfirm) {
          // No session until the confirmation link is clicked —
          // pending checkout resumes automatically after they confirm & sign in.
          setMode('confirm-email');
        } else {
          toast.success('Free account created!', {
            description: 'Upgrade to Premium anytime to unlock all features.',
            icon: <Gift className="h-4 w-4" />,
          });
          onClose();
          resetForm();
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/account`,
        });
        if (error) {
          toast.error('Reset failed', { description: error.message });
        } else {
          toast.success('Reset email sent', {
            description: 'Check your inbox for a password reset link.',
            icon: <MailCheck className="h-4 w-4" />,
          });
          setMode('signin');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast.error('Google sign-in unavailable', {
        description: 'Use email instead, or try again later.',
      });
    }
  };

  const handleMFASuccess = () => {
    toast.success('Welcome back!');
    onClose();
    resetForm();
    setShowMFAVerification(false);
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    resetForm();
  };

  return (
    <div ref={ref}>
      <Dialog open={isOpen && !showMFAVerification} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl text-center">
              {mode === 'signin' && 'Welcome Back'}
              {mode === 'signup' && 'Create Free Account'}
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'confirm-email' && 'Check Your Inbox'}
            </DialogTitle>
            {mode === 'signup' && (
              <DialogDescription className="text-center">
                Start with a free account • Upgrade anytime
              </DialogDescription>
            )}
          </DialogHeader>

          {mode === 'confirm-email' ? (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <MailCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Confirmation email sent</p>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
                  Click it to activate your account — then sign in to continue to checkout.
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setMode('signin')}>
                Back to Sign In
              </Button>
            </div>
          ) : (
          <>

          {mode === 'signup' && (
            <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Gift className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Free Account Includes:</span>
              </div>
              <ul className="space-y-2">
                {FREE_ACCOUNT_BENEFITS.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                <span className="text-xs text-primary">
                  <span className="font-medium">Premium features</span> unlock after payment
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium">
                  Display Name
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || isLimited}
              className="w-full btn-luxury"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLimited ? (
                `Try again in ${retryAfter}s`
              ) : mode === 'signin' ? (
                'Sign In'
              ) : mode === 'forgot' ? (
                'Send Reset Link'
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Free Account
                </>
              )}
            </Button>

            {mode === 'signin' && (
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Forgot password?
              </button>
            )}
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleGoogleSignIn}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {mode === 'signin' || mode === 'forgot' ? (
                <>Don't have an account? <span className="font-medium text-primary">Sign up free</span></>
              ) : (
                <>Already have an account? <span className="font-medium text-primary">Sign in</span></>
              )}
            </button>
          </div>
          </>
          )}
        </DialogContent>
      </Dialog>

      <MFAVerification
        isOpen={showMFAVerification}
        onClose={() => setShowMFAVerification(false)}
        onSuccess={handleMFASuccess}
      />
    </div>
  );
});

AuthModal.displayName = 'AuthModal';

export default AuthModal;