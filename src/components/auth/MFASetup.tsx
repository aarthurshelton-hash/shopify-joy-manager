import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Shield, ShieldCheck, ShieldOff, Copy, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface MFASetupProps {
  isOpen: boolean;
  onClose: () => void;
}

type MFAStep = 'initial' | 'setup' | 'verify' | 'success';

const MFASetup: React.FC<MFASetupProps> = ({ isOpen, onClose }) => {
  const { isPremium } = useAuth();
  const [step, setStep] = useState<MFAStep>('initial');
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check current MFA status on mount
  useEffect(() => {
    if (isOpen) {
      checkMFAStatus();
    }
  }, [isOpen]);

  const checkMFAStatus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const verifiedTOTP = data.totp?.find(factor => factor.status === 'verified');
      setMfaEnabled(!!verifiedTOTP);
      
      if (verifiedTOTP) {
        setFactorId(verifiedTOTP.id);
      }
    } catch (error) {
      console.error('Error checking MFA status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startMFAEnrollment = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'En Pensent Authenticator',
      });

      if (error) throw error;

      if (data.totp?.qr_code && data.totp?.secret) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setStep('setup');
      }
    } catch (error: any) {
      toast.error('Failed to start MFA setup', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndEnableMFA = async () => {
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

      setStep('success');
      setMfaEnabled(true);
      toast.success('Two-factor authentication enabled!');
    } catch (error: any) {
      toast.error('Verification failed', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const disableMFA = async () => {
    if (!factorId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) throw error;

      setMfaEnabled(false);
      setFactorId(null);
      setStep('initial');
      toast.success('Two-factor authentication disabled');
    } catch (error: any) {
      toast.error('Failed to disable 2FA', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setStep('initial');
    setQrCode(null);
    setSecret(null);
    setVerificationCode('');
    onClose();
  };

  if (!isPremium) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Two-Factor Authentication
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Two-factor authentication is an exclusive premium feature that adds an extra layer of security to your account.
            </p>
            <Button className="btn-luxury" onClick={handleClose}>
              Upgrade to Premium
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            {mfaEnabled ? (
              <ShieldCheck className="h-5 w-5 text-green-500" />
            ) : (
              <Shield className="h-5 w-5 text-primary" />
            )}
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            {mfaEnabled 
              ? 'Your account is protected with 2FA' 
              : 'Add an extra layer of security to your account'
            }
          </DialogDescription>
        </DialogHeader>

        {isLoading && step === 'initial' ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Initial State - Show current status */}
            {step === 'initial' && (
              <div className="space-y-4 py-4">
                {mfaEnabled ? (
                  <>
                    <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <ShieldCheck className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="font-medium text-green-500">2FA Enabled</p>
                        <p className="text-sm text-muted-foreground">
                          Your account has extra security protection
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={disableMFA}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ShieldOff className="h-4 w-4 mr-2" />
                          Disable Two-Factor Authentication
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-center py-4">
                      <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Protect your account with a time-based one-time password (TOTP) from an authenticator app.
                      </p>
                    </div>
                    <Button
                      className="w-full btn-luxury"
                      onClick={startMFAEnrollment}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Enable Two-Factor Authentication
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Setup Step - Show QR Code */}
            {step === 'setup' && qrCode && (
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground text-center">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg">
                    <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
                  </div>
                </div>

                {secret && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      Or enter this code manually:
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-muted rounded text-xs font-mono break-all">
                        {secret}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copySecret}
                        className="shrink-0"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => setStep('verify')}
                >
                  Continue to Verification
                </Button>
              </div>
            )}

            {/* Verify Step - Enter code */}
            {step === 'verify' && (
              <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground text-center">
                  Enter the 6-digit code from your authenticator app
                </p>

                <div className="space-y-2">
                  <Label htmlFor="verificationCode">Verification Code</Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-2xl tracking-widest font-mono"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setStep('setup')}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 btn-luxury"
                    onClick={verifyAndEnableMFA}
                    disabled={verificationCode.length !== 6 || isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Verify & Enable'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <div className="text-center py-6">
                <ShieldCheck className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-green-500 mb-2">
                  2FA Successfully Enabled!
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your account is now protected with two-factor authentication. You'll need to enter a code from your authenticator app when signing in.
                </p>
                <Button onClick={handleClose}>Done</Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MFASetup;
