import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AvatarUpload } from '@/components/account/AvatarUpload';
import { displayNameSchema } from '@/lib/validations/visualizationSchemas';
import { moderateText } from '@/lib/moderation/contentModeration';
import { 
  User, 
  Shield, 
  CreditCard, 
  Loader2, 
  Save, 
  Mail,
  Calendar,
  ShieldCheck,
  ShieldOff,
  Copy,
  Check,
  Crown,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import AuthModal from '@/components/auth/AuthModal';

const Account: React.FC = () => {
  const navigate = useNavigate();
  const { 
    user, 
    profile, 
    isPremium, 
    subscriptionStatus, 
    isLoading: authLoading,
    isCheckingSubscription,
    checkSubscription,
    updateProfile,
    openCheckout,
    openCustomerPortal
  } = useAuth();

  // Profile state
  const [displayName, setDisplayName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // MFA state
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [isMfaLoading, setIsMfaLoading] = useState(true);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaStep, setMfaStep] = useState<'idle' | 'setup' | 'verify'>('idle');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Auth modal
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Subscription state
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);

  // Initialize profile data
  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  // Check MFA status
  useEffect(() => {
    if (user) {
      checkMFAStatus();
    }
  }, [user]);

  const checkMFAStatus = async () => {
    setIsMfaLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const verifiedTOTP = data.totp?.find(factor => factor.status === 'verified');
      setMfaEnabled(!!verifiedTOTP);
      if (verifiedTOTP) {
        setMfaFactorId(verifiedTOTP.id);
      }
    } catch (error) {
      console.error('Error checking MFA status:', error);
    } finally {
      setIsMfaLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }

    // Validate display name with schema (includes content moderation)
    const validation = displayNameSchema.safeParse(displayName);
    if (!validation.success) {
      toast.error('Invalid display name', { 
        description: validation.error.errors[0]?.message 
      });
      return;
    }

    setIsSavingProfile(true);
    
    // Server-side content moderation check
    const moderationResult = await moderateText(displayName);
    if (!moderationResult.safe) {
      toast.error('Display name not allowed', {
        description: moderationResult.reason || 'This name does not meet our community guidelines',
      });
      setIsSavingProfile(false);
      return;
    }

    const { error } = await updateProfile({ display_name: displayName.trim() });
    
    if (error) {
      toast.error('Failed to update profile', { description: error.message });
    } else {
      toast.success('Profile updated successfully');
    }
    setIsSavingProfile(false);
  };

  const handleEnableMFA = async () => {
    setIsMfaLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'En Pensent Authenticator',
      });

      if (error) throw error;

      if (data.totp?.qr_code && data.totp?.secret) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setMfaFactorId(data.id);
        setMfaStep('setup');
      }
    } catch (error: any) {
      toast.error('Failed to start MFA setup', { description: error.message });
    } finally {
      setIsMfaLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    if (!mfaFactorId || verificationCode.length !== 6) return;

    setIsMfaLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code: verificationCode,
      });

      if (verifyError) throw verifyError;

      setMfaEnabled(true);
      setMfaStep('idle');
      setVerificationCode('');
      setQrCode(null);
      setSecret(null);
      toast.success('Two-factor authentication enabled!');
    } catch (error: any) {
      toast.error('Verification failed', { description: error.message });
    } finally {
      setIsMfaLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!mfaFactorId) return;

    setIsMfaLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: mfaFactorId,
      });

      if (error) throw error;

      setMfaEnabled(false);
      setMfaFactorId(null);
      toast.success('Two-factor authentication disabled');
    } catch (error: any) {
      toast.error('Failed to disable 2FA', { description: error.message });
    } finally {
      setIsMfaLoading(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubscriptionAction = async () => {
    setIsSubscriptionLoading(true);
    try {
      if (isPremium) {
        await openCustomerPortal();
      } else {
        await openCheckout();
      }
    } catch (error: any) {
      toast.error('Failed to open subscription portal', { description: error.message });
    } finally {
      setIsSubscriptionLoading(false);
    }
  };

  const handleRefreshSubscription = async () => {
    await checkSubscription();
    toast.success('Subscription status refreshed');
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-display font-bold">Account Settings</h1>
            <p className="text-muted-foreground">
              Sign in to access your account settings.
            </p>
            <Button onClick={() => setShowAuthModal(true)} className="btn-luxury">
              Sign In to Continue
            </Button>
          </div>
          
          <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </div>
        <Footer />
      </div>
    );
  }

  const subscriptionEnd = subscriptionStatus?.subscriptionEnd 
    ? new Date(subscriptionStatus.subscriptionEnd) 
    : null;

  const isExpiringSoon = subscriptionEnd && 
    (subscriptionEnd.getTime() - Date.now()) < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold">Account Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your profile, security, and subscription settings
            </p>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="subscription" className="gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Subscription</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal information and display name
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Upload */}
                  {user && (
                    <AvatarUpload
                      userId={user.id}
                      currentAvatarUrl={profile?.avatar_url || null}
                      displayName={displayName || 'User'}
                      onAvatarUpdate={async (url) => updateProfile({ avatar_url: url })}
                    />
                  )}

                  <Separator />

                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      Email Address
                    </Label>
                    <Input 
                      value={user.email || ''} 
                      disabled 
                      className="bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>

                  {/* Display Name */}
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input 
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                      maxLength={50}
                    />
                    <p className="text-xs text-muted-foreground">
                      This is how you'll appear to other users. Names are reviewed to ensure they meet our community guidelines.
                    </p>
                  </div>

                  {/* Account Created */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Member Since
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {user.created_at ? format(new Date(user.created_at), 'MMMM d, yyyy') : 'N/A'}
                    </p>
                  </div>

                  <Separator />

                  <Button 
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile || displayName === profile?.display_name}
                    className="gap-2"
                  >
                    {isSavingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Two-Factor Authentication
                  </CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!isPremium ? (
                    <div className="text-center py-6">
                      <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        Two-factor authentication is an exclusive premium feature that adds an extra layer of security to your account.
                      </p>
                      <Button className="btn-luxury gap-2" onClick={handleSubscriptionAction}>
                        <Crown className="h-4 w-4" />
                        Upgrade to Premium
                      </Button>
                    </div>
                  ) : isMfaLoading && mfaStep === 'idle' ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : mfaStep === 'idle' ? (
                    <>
                      {/* Current Status */}
                      <div className="flex items-center justify-between p-4 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {mfaEnabled ? (
                            <ShieldCheck className="h-8 w-8 text-green-500" />
                          ) : (
                            <Shield className="h-8 w-8 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium">
                              {mfaEnabled ? '2FA Enabled' : '2FA Disabled'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {mfaEnabled 
                                ? 'Your account is protected with TOTP' 
                                : 'Enable 2FA for enhanced security'
                              }
                            </p>
                          </div>
                        </div>
                        <Badge variant={mfaEnabled ? 'default' : 'secondary'} 
                          className={mfaEnabled ? 'bg-green-500' : ''}>
                          {mfaEnabled ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {mfaEnabled ? (
                        <Button
                          variant="destructive"
                          className="w-full gap-2"
                          onClick={handleDisableMFA}
                          disabled={isMfaLoading}
                        >
                          <ShieldOff className="h-4 w-4" />
                          Disable Two-Factor Authentication
                        </Button>
                      ) : (
                        <Button
                          className="w-full btn-luxury gap-2"
                          onClick={handleEnableMFA}
                          disabled={isMfaLoading}
                        >
                          <Shield className="h-4 w-4" />
                          Enable Two-Factor Authentication
                        </Button>
                      )}
                    </>
                  ) : mfaStep === 'setup' && qrCode ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground text-center">
                        Scan this QR code with your authenticator app
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
                        onClick={() => setMfaStep('verify')}
                      >
                        Continue to Verification
                      </Button>
                    </div>
                  ) : mfaStep === 'verify' ? (
                    <div className="space-y-4">
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
                          onClick={() => setMfaStep('setup')}
                        >
                          Back
                        </Button>
                        <Button
                          className="flex-1 btn-luxury"
                          onClick={handleVerifyMFA}
                          disabled={verificationCode.length !== 6 || isMfaLoading}
                        >
                          {isMfaLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Verify & Enable'
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-primary" />
                        Subscription
                      </CardTitle>
                      <CardDescription>
                        Manage your Visionary premium subscription
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleRefreshSubscription}
                      disabled={isCheckingSubscription}
                    >
                      <RefreshCw className={`h-4 w-4 ${isCheckingSubscription ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {isPremium ? (
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-muted">
                        <XCircle className="h-3 w-3 mr-1" />
                        Inactive
                      </Badge>
                    )}
                  </div>

                  <Separator />

                  {isPremium ? (
                    <>
                      {/* Renewal Date */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Renewal Date</span>
                        </div>
                        <span className="text-sm font-medium">
                          {subscriptionEnd ? format(subscriptionEnd, 'MMMM d, yyyy') : 'N/A'}
                        </span>
                      </div>

                      {/* Expiring Warning */}
                      {isExpiringSoon && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          <span className="text-sm text-amber-500">
                            Your subscription renews in less than 7 days
                          </span>
                        </div>
                      )}

                      {/* Benefits */}
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                        <h4 className="text-sm font-medium mb-2">Your Benefits</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Unlimited HD downloads</li>
                          <li>• No watermarks on exports</li>
                          <li>• Personal vision gallery</li>
                          <li>• Two-factor authentication</li>
                          <li>• Early access to new features</li>
                        </ul>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={handleSubscriptionAction}
                        disabled={isSubscriptionLoading}
                      >
                        {isSubscriptionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CreditCard className="h-4 w-4" />
                        )}
                        Manage Subscription
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        Update payment method, cancel, or view invoices
                      </p>
                    </>
                  ) : (
                    <>
                      {/* Upgrade Prompt */}
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                        <h4 className="text-sm font-medium mb-2">Premium Benefits</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Unlimited HD downloads</li>
                          <li>• No watermarks on exports</li>
                          <li>• Personal vision gallery</li>
                          <li>• Two-factor authentication</li>
                          <li>• Early access to new features</li>
                        </ul>
                      </div>

                      <div className="text-center">
                        <span className="text-3xl font-bold">$7</span>
                        <span className="text-muted-foreground">/month</span>
                      </div>

                      <Button
                        className="w-full btn-luxury gap-2"
                        onClick={handleSubscriptionAction}
                        disabled={isSubscriptionLoading}
                      >
                        {isSubscriptionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Crown className="h-4 w-4" />
                        )}
                        Upgrade to Premium
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        Cancel anytime. Secure payment via Stripe.
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Account;
