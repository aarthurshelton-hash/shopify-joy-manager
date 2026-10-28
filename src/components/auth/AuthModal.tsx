import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, Eye, EyeOff, MailCheck, ArrowLeft, Gift, AlertCircle, Info, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import MFAVerification from './MFAVerification';
import AuthShowcase from './AuthShowcase';
import AuthProviderIcon, { OAUTH_LABELS } from './AuthProviderIcon';
import { useAuthRateLimit } from '@/hooks/useRateLimitV2';
import { PREMIUM_PERKS } from '@/lib/premiumFeatures';
import { useEnabledAuthProviders, type OAuthProvider } from '@/hooks/useEnabledAuthProviders';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
  context?: 'premium';
}

type AuthMode = 'signin' | 'signup' | 'forgot' | 'confirm-email';

const RESEND_SECONDS = 30;

const friendlyError = (message: string) => {
  const m = message.toLowerCase();
  if (m.includes('invalid login')) return 'That email and password do not match. Check them or reset your password.';
  if (m.includes('email not confirmed')) return 'Please confirm your email first. Check your inbox for the link.';
  if (m.includes('already') && m.includes('exist')) return 'An account with this email already exists.';
  if (m.includes('password') && m.includes('characters')) return 'Choose a password with at least 6 characters.';
  if (m.includes('rate') || m.includes('too many')) return 'Too many attempts. Please wait a minute and try again.';
  return message;
};

const AuthModal = forwardRef<HTMLDivElement, AuthModalProps>(({ isOpen, onClose, defaultMode = 'signin', context }, ref) => {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showMFAVerification, setShowMFAVerification] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);
  const { signIn, signUp } = useAuth();
  const { check: checkLimit } = useAuthRateLimit();
  const providers = useEnabledAuthProviders(isOpen);

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setFormError(null);
      setNotice(null);
    }
  }, [isOpen, defaultMode]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setShowPassword(false);
    setFormError(null);
    setNotice(null);
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setFormError(null);
    setNotice(null);
    setTimeout(() => emailRef.current?.focus(), 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setNotice(null);

    const result = checkLimit();
    if (!result.allowed) {
      setFormError('Too many attempts. Please wait a moment and try again.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signin') {
        const { error, requiresMFA } = await signIn(email.trim(), password);
        if (error) {
          setFormError(friendlyError(error.message));
        } else if (requiresMFA) {
          setShowMFAVerification(true);
        } else {
          toast.success('Welcome back!');
          onClose();
          resetForm();
        }
      } else if (mode === 'signup') {
        const { error, needsEmailConfirm } = await signUp(email.trim(), password, displayName.trim() || undefined);
        if (error) {
          if (friendlyError(error.message).startsWith('An account with this email already exists')) {
            setMode('signin');
            setPassword('');
            setNotice('You already have an account with this email. Sign in below, or reset your password.');
          } else {
            setFormError(friendlyError(error.message));
          }
        } else if (needsEmailConfirm) {
          setResendIn(RESEND_SECONDS);
          setMode('confirm-email');
        } else {
          toast.success('Account created', { description: 'Welcome to En Pensent.', icon: <Gift className="h-4 w-4" /> });
          onClose();
          resetForm();
        }
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/account`,
        });
        if (error) {
          setFormError(friendlyError(error.message));
        } else {
          setMode('signin');
          setNotice('Reset link sent. Check your inbox, then sign in with your new password.');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendIn > 0) return;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setFormError(friendlyError(error.message));
    } else {
      setFormError(null);
      setResendIn(RESEND_SECONDS);
      toast.success('Confirmation email sent again');
    }
  };

  const handleOAuthSignIn = async (provider: OAuthProvider) => {
    setOauthLoading(provider);
    setFormError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}${window.location.pathname}` },
    });
    if (error) {
      setOauthLoading(null);
      setFormError(`${OAUTH_LABELS[provider]} sign-in is unavailable right now. Please use email instead.`);
    }
  };

  const handleMFASuccess = () => {
    toast.success('Welcome back!');
    onClose();
    resetForm();
    setShowMFAVerification(false);
  };

  const isSignup = mode === 'signup';
  const title =
    mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your free account' : mode === 'forgot' ? 'Reset your password' : 'Check your inbox';
  const subtitle =
    mode === 'signin'
      ? 'Sign in to pick up where you left off.'
      : mode === 'signup'
        ? 'Save your visions, order prints and unlock Premium in seconds.'
        : mode === 'forgot'
          ? 'Enter your email and we will send you a reset link.'
          : `We sent a confirmation link to ${email}.`;

  return (
    <div ref={ref}>
      <Dialog open={isOpen && !showMFAVerification} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-4xl gap-0 overflow-hidden border-border bg-card p-0 md:grid md:grid-cols-2">
          <AuthShowcase
            premium={context === 'premium'}
            headline={context === 'premium' ? 'Go further with every game.' : isSignup ? 'Every game is a work of art.' : 'Your games are waiting.'}
          />

          <div className="max-h-[92vh] overflow-y-auto p-6 sm:p-8">
            {context === 'premium' && (
              <div className="mb-5 rounded-lg border border-primary/30 bg-primary/5 p-4 md:hidden">
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-primary">What Premium adds</p>
                <ul className="space-y-1.5 text-sm">
                  {PREMIUM_PERKS.map((perk) => (
                    <li key={perk.title} className="flex gap-2"><Crown className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" /><span><b>{perk.title}</b> <span className="text-muted-foreground">· {perk.text}</span></span></li>
                  ))}
                </ul>
              </div>
            )}
            {(mode === 'signin' || mode === 'signup') && (
              <div className="mb-6 grid grid-cols-2 rounded-lg bg-muted p-1 text-sm font-medium" role="tablist">
                {(['signup', 'signin'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => switchMode(m)}
                    className={cn(
                      'rounded-md py-2 transition-all',
                      mode === m ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {m === 'signup' ? 'Create account' : 'Sign in'}
                  </button>
                ))}
              </div>
            )}

            {(mode === 'forgot' || mode === 'confirm-email') && (
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </button>
            )}

            <DialogTitle className="font-royal text-2xl">{title}</DialogTitle>
            <DialogDescription className="mt-1 text-sm">{subtitle}</DialogDescription>

            {notice && (
              <div role="status" className="mt-4 flex items-start gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                {notice}
              </div>
            )}
            {formError && (
              <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            {mode === 'confirm-email' ? (
              <div className="mt-6 space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <MailCheck className="h-7 w-7" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Click the link in that email to activate your account. It can take a minute, and it may land in spam.
                </p>
                <Button type="button" variant="outline" className="w-full" onClick={handleResend} disabled={resendIn > 0}>
                  {resendIn > 0 ? `Resend email in ${resendIn}s` : 'Resend confirmation email'}
                </Button>
                <button type="button" onClick={() => switchMode('signup')} className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
                  Wrong email? Start over
                </button>
              </div>
            ) : (
              <>
                {providers.length > 0 && mode !== 'forgot' && (
                  <div className="mt-6 space-y-3">
                    <div className={cn('grid gap-2', providers.length > 1 && 'sm:grid-cols-2')}>
                      {providers.map((p) => (
                        <Button
                          key={p}
                          type="button"
                          variant="outline"
                          className="h-11 gap-2"
                          disabled={!!oauthLoading || isLoading}
                          onClick={() => handleOAuthSignIn(p)}
                        >
                          {oauthLoading === p ? <Loader2 className="h-4 w-4 animate-spin" /> : <AuthProviderIcon provider={p} />}
                          Continue with {OAUTH_LABELS[p]}
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
                      <span className="h-px flex-1 bg-border" /> or use email <span className="h-px flex-1 bg-border" />
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate={false}>
                  <div className="space-y-1.5">
                    <Label htmlFor="auth-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="auth-email"
                        ref={emailRef}
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 pl-10"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {mode !== 'forgot' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auth-password">Password</Label>
                        {mode === 'signin' && (
                          <button type="button" onClick={() => switchMode('forgot')} className="text-xs text-primary hover:underline">
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="auth-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete={isSignup ? 'new-password' : 'current-password'}
                          placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-11 pl-10 pr-11"
                          minLength={6}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((s) => !s)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {isSignup && (
                    <div className="space-y-1.5">
                      <Label htmlFor="auth-name">
                        Display name <span className="font-normal text-muted-foreground">(optional)</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="auth-name"
                          type="text"
                          autoComplete="nickname"
                          placeholder="What should we call you?"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>
                  )}

                  <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={isLoading || !!oauthLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create free account' : 'Send reset link'}
                  </Button>
                </form>

                {isSignup && (
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    By creating an account you agree to our{' '}
                    <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Terms</a> and{' '}
                    <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Privacy Policy</a>.
                  </p>
                )}
              </>
            )}
          </div>
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
