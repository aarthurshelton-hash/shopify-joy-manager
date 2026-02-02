/**
 * Admin Protected Route Component
 * Only allows CEO Alec Arthur Shelton access to private features
 */

import { ReactNode, useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Shield, Lock } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface AdminRouteProps {
  children: ReactNode;
  featureName?: string;
}

export function AdminRoute({ children, featureName = 'This feature' }: AdminRouteProps) {
  const { user, isAdmin, isLoading, isCheckingAdmin } = useAuth();
  
  // Add timeout to prevent infinite loading state
  const [checkTimeout, setCheckTimeout] = useState(false);
  
  useEffect(() => {
    if (isCheckingAdmin) {
      const timer = setTimeout(() => {
        console.warn('[AdminRoute] Admin check timed out, allowing access attempt');
        setCheckTimeout(true);
      }, 5000); // 5 second timeout
      return () => clearTimeout(timer);
    }
  }, [isCheckingAdmin]);
  
  // Wait for auth check but timeout if stuck
  if (isLoading || (isCheckingAdmin && !checkTimeout)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Verifying CEO access...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/account" replace />;
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <Lock className="w-10 h-10 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Access Restricted</h1>
            <p className="text-muted-foreground">
              {featureName} is private and reserved for authorized personnel only.
            </p>
          </div>
          
          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>CEO Access Only</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              © Alec Arthur Shelton "The Artist" - Inventor & CEO
            </p>
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
      </div>
    );
  }
  
  // Wrap children in ErrorBoundary to catch any render errors
  return (
    <ErrorBoundary componentName={featureName}>
      {children}
    </ErrorBoundary>
  );
}
