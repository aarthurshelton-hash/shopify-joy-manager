import { useLocationRefresh } from '@/hooks/useLocationRefresh';

// This component silently tracks user location on return to app
export function LocationTracker() {
  // Just use the hook - it handles everything via useEffect
  useLocationRefresh();
  
  return null;
}
