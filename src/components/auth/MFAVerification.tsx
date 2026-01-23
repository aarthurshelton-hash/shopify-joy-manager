import React, { useState, useEffect, forwardRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Shield } from 'lucide-react';
import { SecurityEvents } from '@/lib/security/auditLog';

interface MFAVerificationProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MFAVerification = forwardRef<HTMLDivElement, MFAVerificationProps>(({ isOpen, onClose, onSuccess }, ref) => {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMFAFactor();
    }
  }, [isOpen]);

  const fetchMFAFactor = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const verifiedTOTP = data.totp?.find(factor => factor.status === 'verified');
      if (verifiedTOTP) {
        setFactorId(verifiedTOTP.id);
      }
    } catch (error) {
      console.error('Error fetching MFA factors:', error);
    }
  };

  const handleVerify = async () => {
    if (!factorId || verificationCode.length !== 6) return;

    setIsLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyError) throw verifyError;

      // Log MFA verification success
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        SecurityEvents.mfaVerified(user.id);
      }

      toast.success('Verification successful!');
      onSuccess();
      handleClose();
    } catch (error: any) {
      toast.error('Verification failed', { description: 'Invalid code. Please try again.' });
      setVerificationCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setVerificationCode('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && verificationCode.length === 6) {
      handleVerify();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Enter the 6-digit code from your authenticator app
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="mfaCode">Verification Code</Label>
            <Input
              id="mfaCode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={handleKeyDown}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
            />
          </div>

          <Button
            className="w-full btn-luxury"
            onClick={handleVerify}
            disabled={verificationCode.length !== 6 || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Verify'
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Open your authenticator app and enter the current code for En Pensent
          </p>
        </div>
    </DialogContent>
    </Dialog>
  );
});

MFAVerification.displayName = 'MFAVerification';

export default MFAVerification;
