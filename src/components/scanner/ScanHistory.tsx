import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Trash2, ExternalLink, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

interface ScanHistoryItem {
  id: string;
  visualization_id: string | null;
  image_preview: string | null;
  matched: boolean;
  confidence: number | null;
  scanned_at: string;
  visualization?: {
    title: string;
    image_path: string;
    public_share_id: string | null;
  };
}

interface ScanHistoryProps {
  onSelectScan?: (visualizationId: string) => void;
}

export function ScanHistory({ onSelectScan }: ScanHistoryProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("scan_history")
        .select(`
          id,
          visualization_id,
          image_preview,
          matched,
          confidence,
          scanned_at
        `)
        .eq("user_id", user.id)
        .order("scanned_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Fetch visualization details for matched scans
      const withVisualizations = await Promise.all(
        (data || []).map(async (item) => {
          if (item.visualization_id) {
            const { data: vizData } = await supabase
              .from("saved_visualizations")
              .select("title, image_path, public_share_id")
              .eq("id", item.visualization_id)
              .single();
            
            return { ...item, visualization: vizData || undefined };
          }
          return item;
        })
      );

      setHistory(withVisualizations);
    } catch (error) {
      console.error("Error fetching scan history:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from("scan_history")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setHistory((prev) => prev.filter((item) => item.id !== id));
      toast.success("Scan removed from history");
    } catch (error) {
      console.error("Error deleting scan:", error);
      toast.error("Failed to delete scan");
    }
  };

  const clearAllHistory = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("scan_history")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setHistory([]);
      toast.success("Scan history cleared");
    } catch (error) {
      console.error("Error clearing history:", error);
      toast.error("Failed to clear history");
    }
  };

  const getConfidenceColor = (confidence: number | null) => {
    if (!confidence) return "text-muted-foreground";
    if (confidence >= 80) return "text-green-500";
    if (confidence >= 50) return "text-yellow-500";
    return "text-red-500";
  };

  if (!user) {
    return (
      <div className="p-4 rounded-xl bg-card border border-border text-center">
        <History className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Sign in to save your scan history
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3" />
          <div className="h-16 bg-muted rounded" />
          <div className="h-16 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <span className="font-display font-bold">Scan History</span>
          {history.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {history.length}
            </Badge>
          )}
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {history.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No scans yet</p>
                <p className="text-xs">Your scan history will appear here</p>
              </div>
            ) : (
              <>
                <ScrollArea className="max-h-80">
                  <div className="p-2 space-y-2">
                    {history.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                      >
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {item.visualization?.image_path ? (
                            <img
                              src={item.visualization.image_path}
                              alt={item.visualization.title}
                              className="w-full h-full object-cover"
                            />
                          ) : item.image_preview ? (
                            <img
                              src={item.image_preview}
                              alt="Scanned image"
                              className="w-full h-full object-cover opacity-50"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {item.matched ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                              )}
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {item.matched ? (
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                            )}
                            <span className="font-medium text-sm truncate">
                              {item.visualization?.title || (item.matched ? "Matched" : "No Match")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatDistanceToNow(new Date(item.scanned_at), { addSuffix: true })}</span>
                            {item.confidence && (
                              <span className={getConfidenceColor(item.confidence)}>
                                {item.confidence}% confidence
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.visualization?.public_share_id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => navigate(`/v/${item.visualization!.public_share_id}`)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deleteHistoryItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Clear All */}
                <div className="p-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-muted-foreground hover:text-destructive"
                    onClick={clearAllHistory}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All History
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Function to save a scan to history (call this from the scanner)
export async function saveScanToHistory(
  userId: string,
  matched: boolean,
  visualizationId?: string,
  confidence?: number,
  imagePreview?: string
) {
  try {
    const { error } = await supabase
      .from("scan_history")
      .insert({
        user_id: userId,
        visualization_id: visualizationId || null,
        matched,
        confidence: confidence ? Math.round(confidence) : null,
        image_preview: imagePreview?.substring(0, 500) || null, // Truncate to save space
      });

    if (error) throw error;
  } catch (error) {
    console.error("Error saving scan to history:", error);
  }
}
