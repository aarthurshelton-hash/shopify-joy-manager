import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Recently Viewed Store - Tracks visions a user has viewed
 * Uses localStorage to persist across sessions
 */

export interface RecentlyViewedVision {
  id: string; // visualization_id
  listingId?: string;
  title: string;
  imagePath: string;
  ownerName?: string;
  priceCents?: number;
  gameHash?: string;
  viewedAt: number;
}

interface RecentlyViewedStore {
  // Recently viewed visions (max 12, newest first)
  recentlyViewed: RecentlyViewedVision[];
  
  // Actions
  addRecentlyViewed: (vision: Omit<RecentlyViewedVision, 'viewedAt'>) => void;
  removeRecentlyViewed: (id: string) => void;
  clearRecentlyViewed: () => void;
  
  // Get recent visions (filtered by max age)
  getRecentVisions: (limit?: number) => RecentlyViewedVision[];
}

const MAX_RECENT_VISIONS = 12;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const useRecentlyViewedStore = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      recentlyViewed: [],
      
      addRecentlyViewed: (vision) => {
        const now = Date.now();
        set((state) => {
          // Remove if already exists (will re-add at top)
          const filtered = state.recentlyViewed.filter(v => v.id !== vision.id);
          
          // Add to beginning
          const updated = [
            { ...vision, viewedAt: now },
            ...filtered,
          ].slice(0, MAX_RECENT_VISIONS);
          
          return { recentlyViewed: updated };
        });
      },
      
      removeRecentlyViewed: (id) => {
        set((state) => ({
          recentlyViewed: state.recentlyViewed.filter(v => v.id !== id),
        }));
      },
      
      clearRecentlyViewed: () => {
        set({ recentlyViewed: [] });
      },
      
      getRecentVisions: (limit = 6) => {
        const { recentlyViewed } = get();
        const now = Date.now();
        
        // Filter out expired entries and limit
        return recentlyViewed
          .filter(v => now - v.viewedAt < MAX_AGE_MS)
          .slice(0, limit);
      },
    }),
    {
      name: 'en-pensent-recently-viewed',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        recentlyViewed: state.recentlyViewed,
      }),
    }
  )
);
