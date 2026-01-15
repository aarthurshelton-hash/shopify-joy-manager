import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Bell, X, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface SystemAlert {
  id: string;
  alert_type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  created_at: string;
}

interface SystemAlertsNotificationProps {
  isAdmin: boolean;
}

export function SystemAlertsNotification({ isAdmin }: SystemAlertsNotificationProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showBanner, setShowBanner] = useState(true);

  const { data: alerts } = useQuery({
    queryKey: ['system-alerts-notification'],
    queryFn: async () => {
      if (!isAdmin) return [];
      
      const { data, error } = await supabase.rpc('get_system_alerts', { 
        p_include_resolved: false,
        p_limit: 5 
      });
      if (error) throw error;
      return (data as unknown as SystemAlert[]) || [];
    },
    enabled: isAdmin,
    refetchInterval: 60000, // Check every minute
  });

  // Filter out dismissed alerts
  const activeAlerts = alerts?.filter(a => !dismissed.has(a.id)) || [];
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
  const hasAlerts = activeAlerts.length > 0;
  const hasCritical = criticalAlerts.length > 0;

  // Play notification sound for new critical alerts
  useEffect(() => {
    if (hasCritical && showBanner) {
      // Could add audio notification here
      // new Audio('/notification.mp3').play().catch(() => {});
    }
  }, [hasCritical, showBanner]);

  if (!isAdmin || !hasAlerts || !showBanner) {
    return null;
  }

  const mostCritical = criticalAlerts[0] || activeAlerts[0];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className={`fixed top-4 right-4 z-50 max-w-md ${
          hasCritical ? 'bg-destructive' : 'bg-yellow-500'
        } text-white rounded-lg shadow-lg overflow-hidden`}
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            {hasCritical ? (
              <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{mostCritical.title}</p>
                <Badge 
                  variant="secondary" 
                  className="bg-white/20 text-white text-xs"
                >
                  {activeAlerts.length > 1 
                    ? `+${activeAlerts.length - 1} more` 
                    : mostCritical.alert_type}
                </Badge>
              </div>
              <p className="text-xs opacity-90 mt-1 line-clamp-2">
                {mostCritical.message}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-6 w-6 text-white hover:bg-white/20"
              onClick={() => {
                if (activeAlerts.length === 1) {
                  setShowBanner(false);
                }
                setDismissed(prev => new Set([...prev, mostCritical.id]));
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              variant="secondary"
              className="text-xs h-7 bg-white/20 hover:bg-white/30 text-white"
              onClick={() => {
                window.location.href = '/admin/ceo?tab=health';
              }}
            >
              <Bell className="h-3 w-3 mr-1" />
              View All Alerts
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 text-white hover:bg-white/20"
              onClick={() => setShowBanner(false)}
            >
              Dismiss All
            </Button>
          </div>
        </div>

        {/* Progress bar for auto-dismiss */}
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 30, ease: 'linear' }}
          onAnimationComplete={() => setShowBanner(false)}
          className="h-1 bg-white/30"
        />
      </motion.div>
    </AnimatePresence>
  );
}