import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useActiveVisionStore } from '@/stores/activeVisionStore';

/**
 * VisionRestorer - Automatically restores the user to their last active vision
 * when they refresh the page or navigate away and return
 */
export const VisionRestorer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasAttemptedRestoreRef = useRef(false);
  
  const { 
    hasValidVision, 
    getRestoreRoute, 
    shouldRestoreOnMount,
    markRestored,
    activeVision,
  } = useActiveVisionStore();
  
  useEffect(() => {
    // Only attempt restore once per session
    if (hasAttemptedRestoreRef.current) return;
    
    // Only restore if we're on the home page
    if (location.pathname !== '/') return;
    
    // Check if we should restore
    if (!shouldRestoreOnMount) return;
    
    // Check for valid vision to restore
    if (!hasValidVision()) {
      markRestored();
      return;
    }
    
    const restoreRoute = getRestoreRoute();
    if (!restoreRoute) {
      markRestored();
      return;
    }
    
    // Don't restore to the home page (avoid infinite loop)
    if (restoreRoute === '/') {
      markRestored();
      return;
    }
    
    hasAttemptedRestoreRef.current = true;
    markRestored();
    
    // Navigate to the saved vision route
    // Use replace to avoid adding to history
    navigate(restoreRoute, { replace: true });
  }, [location.pathname, hasValidVision, getRestoreRoute, shouldRestoreOnMount, markRestored, navigate]);
  
  return null;
};
