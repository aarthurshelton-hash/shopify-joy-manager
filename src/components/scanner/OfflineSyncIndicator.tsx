import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Cloud, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface OfflineSyncIndicatorProps {
  isOnline: boolean;
  pendingCount: number;
  syncing: boolean;
  onSync: () => void;
}

export function OfflineSyncIndicator({
  isOnline,
  pendingCount,
  syncing,
  onSync,
}: OfflineSyncIndicatorProps) {
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`flex items-center gap-3 p-3 rounded-lg border ${
          isOnline
            ? "bg-primary/10 border-primary/20"
            : "bg-yellow-500/10 border-yellow-500/20"
        }`}
      >
        {/* Status Icon */}
        <div
          className={`p-2 rounded-full ${
            isOnline ? "bg-primary/20" : "bg-yellow-500/20"
          }`}
        >
          {isOnline ? (
            syncing ? (
              <RefreshCw className="h-4 w-4 text-primary animate-spin" />
            ) : (
              <Cloud className="h-4 w-4 text-primary" />
            )
          ) : (
            <WifiOff className="h-4 w-4 text-yellow-500" />
          )}
        </div>

        {/* Status Text */}
        <div className="flex-1">
          <p className="text-sm font-medium">
            {isOnline
              ? syncing
                ? "Syncing scans..."
                : `${pendingCount} scan${pendingCount > 1 ? "s" : ""} ready to sync`
              : "You're offline"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isOnline
              ? "Your offline scans will be uploaded"
              : `${pendingCount} scan${pendingCount > 1 ? "s" : ""} saved locally`}
          </p>
        </div>

        {/* Pending Badge */}
        {pendingCount > 0 && (
          <Badge variant={isOnline ? "default" : "secondary"}>
            {pendingCount}
          </Badge>
        )}

        {/* Sync Button */}
        {isOnline && pendingCount > 0 && !syncing && (
          <Button size="sm" onClick={onSync} className="gap-1">
            <RefreshCw className="h-3 w-3" />
            Sync
          </Button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
