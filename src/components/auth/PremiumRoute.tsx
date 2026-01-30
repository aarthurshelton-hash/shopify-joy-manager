/**
 * Premium Protected Route Component
 * Allows access to Premium members and Admins
 */

import { ReactNode, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Crown, RefreshCw } from 'lucide-react';
import AuthModal from '@/components/auth/AuthModal';
import { VisionaryMembershipCard } from '@/components/premium';

interface PremiumRouteProps {
  children: ReactNode;
  featureName?: string;
}

export function PremiumRoute({ children, featureName = 'This feature' }: PremiumRouteProps) {
  const { user, isPremium, isAdmin, isLoading, isCheckingSubscription } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (isLoading || isCheckingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Verifying membership...</p>
        </div>
      </div>
    );
  }

  // Allow admins through
  if (isAdmin) return <>{children}</>;

  // Not signed in -> send to account
  if (!user) {
    return <Navigate to="/account" replace />;
  }

  // Signed in but not premium -> show upgrade UI
  if (!isPremium) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Crown className="w-10 h-10 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Premium Required</h1>
            <p className="text-muted-foreground">
              {featureName} requires Visionary Premium.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              className="btn-luxury"
              onClick={() => setShowUpgrade(true)}
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAuth(true)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Switch Account
            </Button>
          </div>
          
          <div className="pt-4">
            <a 
              href="/"
              className="text-primary hover:underline text-sm"
            >
              ← Return to Home
            </a>
          </div>
        </div>

        <VisionaryMembershipCard
          isOpen={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          onAuthRequired={() => {
            setShowUpgrade(false);
            setShowAuth(true);
          }}
          trigger="general"
        />

        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          defaultMode="signin"
        />
      </div>
    );
  }

  return <>{children}</>;
}
