import React, { useState, forwardRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User, Phone, Crown, Sparkles, Gift, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import MFAVerification from './MFAVerification';
import { useAuthRateLimit } from '@/hooks/useRateLimitV2';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
}

type AuthMode = 'signin' | 'signup';

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
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMFAVerification, setShowMFAVerification] = useState(false);
  const { signIn, signUp } = useAuth();
  const { check: checkLimit, isLimited, resetInMs } = useAuthRateLimit();
  const retryAfter = resetInMs ? Math.ceil(resetInMs / 1000) : null;

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
      } else {
        const { error } = await signUp(email, password, displayName, phone || undefined);
        if (error) {
          toast.error('Sign up failed', { description: error.message });
        } else {
          toast.success('Free account created!', { 
            description: 'Upgrade to Premium anytime to unlock all features.',
            icon: <Gift className="h-4 w-4" />,
          });
          onClose();
          resetForm();
        }
      }
    } finally {
      setIsLoading(false);
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
    setPhone('');
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
              {mode === 'signin' ? 'Welcome Back' : 'Create Free Account'}
            </DialogTitle>
            {mode === 'signup' && (
              <DialogDescription className="text-center">
                Start with a free account • Upgrade anytime
              </DialogDescription>
            )}
          </DialogHeader>

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

            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                  Phone Number
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Optional</Badge>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Get SMS notifications about your visions and exclusive offers
                </p>
              </div>
            )}

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
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Free Account
                </>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {mode === 'signin' ? (
                <>Don't have an account? <span className="font-medium text-primary">Sign up free</span></>
              ) : (
                <>Already have an account? <span className="font-medium text-primary">Sign in</span></>
              )}
            </button>
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