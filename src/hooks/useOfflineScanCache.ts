import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CachedScan {
  id: string;
  matched: boolean;
  visualizationId?: string;
  confidence?: number;
  imagePreview?: string;
  timestamp: number;
}

const CACHE_KEY = "enpensent_offline_scans";

export function useOfflineScanCache(userId: string | undefined) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingScans, setPendingScans] = useState<CachedScan[]>([]);
  const [syncing, setSyncing] = useState(false);

  // Load cached scans from localStorage
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        setPendingScans(JSON.parse(cached));
      } catch {
        localStorage.removeItem(CACHE_KEY);
      }
    }
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Back online! Syncing scans...");
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("You're offline. Scans will be saved locally.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Sync when coming back online
  useEffect(() => {
    if (isOnline && userId && pendingScans.length > 0 && !syncing) {
      syncPendingScans();
    }
  }, [isOnline, userId, pendingScans.length]);

  // Cache a scan locally
  const cacheScan = useCallback((scan: Omit<CachedScan, "id" | "timestamp">) => {
    const newScan: CachedScan = {
      ...scan,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    
    setPendingScans((prev) => {
      const updated = [...prev, newScan];
      localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
      return updated;
    });
    
    return newScan.id;
  }, []);

  // Sync pending scans to database
  const syncPendingScans = useCallback(async () => {
    if (!userId || pendingScans.length === 0 || syncing) return;
    
    setSyncing(true);
    let syncedCount = 0;
    const failedScans: CachedScan[] = [];

    for (const scan of pendingScans) {
      try {
        const { error } = await supabase
          .from("scan_history")
          .insert({
            user_id: userId,
            visualization_id: scan.visualizationId || null,
            matched: scan.matched,
            confidence: scan.confidence ? Math.round(scan.confidence) : null,
            image_preview: scan.imagePreview?.substring(0, 500) || null,
            scanned_at: new Date(scan.timestamp).toISOString(),
          });

        if (error) {
          console.error("Failed to sync scan:", error);
          failedScans.push(scan);
        } else {
          syncedCount++;
        }
      } catch (error) {
        console.error("Sync error:", error);
        failedScans.push(scan);
      }
    }

    // Update cache with only failed scans
    setPendingScans(failedScans);
    localStorage.setItem(CACHE_KEY, JSON.stringify(failedScans));
    
    setSyncing(false);

    if (syncedCount > 0) {
      toast.success(`Synced ${syncedCount} offline scan${syncedCount > 1 ? "s" : ""}`);
      
      // Check for achievements after sync
      try {
        await supabase.rpc("check_scan_achievements", { p_user_id: userId });
      } catch (error) {
        console.error("Achievement check failed:", error);
      }
    }

    if (failedScans.length > 0) {
      toast.error(`Failed to sync ${failedScans.length} scan${failedScans.length > 1 ? "s" : ""}`);
    }
  }, [userId, pendingScans, syncing]);

  // Clear all cached scans
  const clearCache = useCallback(() => {
    setPendingScans([]);
    localStorage.removeItem(CACHE_KEY);
  }, []);

  return {
    isOnline,
    pendingScans,
    pendingCount: pendingScans.length,
    syncing,
    cacheScan,
    syncPendingScans,
    clearCache,
  };
}
