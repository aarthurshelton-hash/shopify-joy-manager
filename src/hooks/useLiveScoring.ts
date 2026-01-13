import { useEffect, useRef } from 'react';
import { recordVisionInteraction } from '@/lib/visualizations/visionScoring';

interface UseLiveScoringOptions {
  visualizationId?: string;
  enabled?: boolean;
  trackPageViews?: boolean;
}

/**
 * Hook to automatically track vision interactions for live scoring
 * Tracks views, time on page, and integrates with the scoring system
 */
export function useLiveScoring({
  visualizationId,
  enabled = true,
  trackPageViews = true,
}: UseLiveScoringOptions = {}) {
  const hasTrackedView = useRef(false);
  const viewStartTime = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !visualizationId || !trackPageViews) return;

    // Track view when component mounts
    if (!hasTrackedView.current) {
      hasTrackedView.current = true;
      viewStartTime.current = Date.now();
      
      // Record view interaction
      recordVisionInteraction(visualizationId, 'view').catch(console.error);
    }

    return () => {
      // Could track time spent viewing here for future analytics
    };
  }, [visualizationId, enabled, trackPageViews]);

  const trackDownloadHD = async () => {
    if (!visualizationId) return false;
    return recordVisionInteraction(visualizationId, 'download_hd');
  };

  const trackDownloadGIF = async () => {
    if (!visualizationId) return false;
    return recordVisionInteraction(visualizationId, 'download_gif');
  };

  const trackPrintOrder = async (valueCents: number) => {
    if (!visualizationId) return false;
    return recordVisionInteraction(visualizationId, 'print_order', valueCents);
  };

  const trackTrade = async (valueCents: number) => {
    if (!visualizationId) return false;
    return recordVisionInteraction(visualizationId, 'trade', valueCents);
  };

  return {
    trackDownloadHD,
    trackDownloadGIF,
    trackPrintOrder,
    trackTrade,
  };
}

/**
 * Hook to track global site engagement for platform-wide analytics
 * Use this on main pages to track visitor engagement
 */
export function useGlobalEngagement() {
  const hasTrackedSession = useRef(false);

  useEffect(() => {
    if (hasTrackedSession.current) return;
    hasTrackedSession.current = true;

    // Track page view in session storage for analytics
    const sessionKey = 'ep_session_views';
    const currentViews = parseInt(sessionStorage.getItem(sessionKey) || '0', 10);
    sessionStorage.setItem(sessionKey, String(currentViews + 1));

    // Track unique daily visitor
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem('ep_last_visit');
    if (lastVisit !== today) {
      localStorage.setItem('ep_last_visit', today);
      // Could send to analytics endpoint here
    }
  }, []);
}
