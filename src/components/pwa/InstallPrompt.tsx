import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Scan, Share, Plus, Crown, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export const InstallPrompt: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, promptInstall, canShowPrompt } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user dismissed the prompt recently
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
        return;
      }
    }

    // Show prompt after a short delay if installable
    if (canShowPrompt && !isInstalled) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [canShowPrompt, isInstalled]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    if (isIOS) {
      // Can't programmatically install on iOS, just show instructions
      return;
    }
    
    const success = await promptInstall();
    if (success) {
      setIsVisible(false);
    }
  };

  if (isInstalled || isDismissed || !isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm"
      >
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-xl shadow-2xl">
          {/* Decorative gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
          
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative p-5">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                <Smartphone className="h-7 w-7 text-primary" />
              </div>
              <div className="pt-1">
                <h3 className="font-display font-bold text-lg tracking-wide">
                  Add to Home Screen
                </h3>
                <p className="text-sm text-muted-foreground">
                  Quick access to Vision Scanner
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                <Scan className="h-3.5 w-3.5 text-primary" />
                <span>Instant Scan</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                <Crown className="h-3.5 w-3.5 text-primary" />
                <span>Full Access</span>
              </div>
            </div>

            {/* iOS Instructions */}
            {isIOS ? (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground text-center">
                  Tap <Share className="h-3.5 w-3.5 inline mx-1" /> then <strong>"Add to Home Screen"</strong>
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Share className="h-4 w-4" />
                  <span>→</span>
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">Add to Home</span>
                </div>
              </div>
            ) : (
              <Button
                onClick={handleInstall}
                className="w-full gap-2 bg-primary hover:bg-primary/90"
              >
                <Download className="h-4 w-4" />
                Install App
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
