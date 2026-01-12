import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, Scan, CheckCircle, XCircle, Loader2, ExternalLink, Sparkles, Play, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { TimelineProvider, useTimeline } from "@/contexts/TimelineContext";
import { LegendHighlightProvider } from "@/contexts/LegendHighlightContext";
import InteractiveVisualizationBoard from "@/components/chess/InteractiveVisualizationBoard";
import { EnhancedLegend } from "@/components/chess/EnhancedLegend";
import { UniversalTimeline } from "@/components/chess/UniversalTimeline";
import GameInfoDisplay from "@/components/chess/GameInfoDisplay";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SquareData, GameData } from "@/lib/chess/gameSimulator";

interface ScanResult {
  matched: boolean;
  vision?: {
    visualization_id: string;
    public_share_id: string;
    title: string;
    confidence: number;
    image_url: string;
  };
  share_url?: string;
  reason?: string;
  message?: string;
  error?: string;
}

interface VisionData {
  id: string;
  title: string;
  image_path: string;
  pgn: string | null;
  public_share_id: string | null;
  game_data: {
    board?: SquareData[][];
    moves?: string[];
    gameInfo?: {
      white?: string;
      black?: string;
      event?: string;
      date?: string;
      result?: string;
    };
    palette?: {
      id: string;
      name: string;
      whiteColors: Record<string, string>;
      blackColors: Record<string, string>;
    };
  };
  user_id: string;
  created_at: string;
}

interface VisionScore {
  view_count: number;
  download_hd_count: number;
  download_gif_count: number;
  trade_count: number;
  print_order_count: number;
  print_revenue_cents: number;
  unique_viewers: number;
  total_score: number;
}

interface VisionScannerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Inner component that uses timeline context
interface VisionExperienceContentProps {
  visionData: VisionData;
  visionScore: VisionScore | null;
  board: SquareData[][];
  gameData: VisionData['game_data'];
  totalMoves: number;
  activeTab: "experience" | "analytics";
  setActiveTab: (tab: "experience" | "analytics") => void;
  showLegend: boolean;
  setShowLegend: (show: boolean) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  confidence?: number;
  handleViewVision: () => void;
  resetScan: () => void;
}

function VisionExperienceContent({
  visionData,
  visionScore,
  board,
  gameData,
  totalMoves,
  activeTab,
  setActiveTab,
  showLegend,
  setShowLegend,
  darkMode,
  setDarkMode,
  confidence,
  handleViewVision,
  resetScan,
}: VisionExperienceContentProps) {
  const { currentMove, setCurrentMove, setMaxMoves, isPlaying, play, pause, stepForward, stepBackward, reset } = useTimeline();

  // Set max moves when component mounts
  useEffect(() => {
    setMaxMoves(totalMoves);
  }, [totalMoves, setMaxMoves]);

  return (
    <LegendHighlightProvider>
      <div className={`space-y-4 ${darkMode ? "dark" : ""}`}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "experience" | "analytics")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="experience" className="gap-2">
              <Play className="h-4 w-4" />
              Experience
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="experience" asChild>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 pt-4"
              >
                {/* Game Info */}
                {gameData?.gameInfo && (
                  <GameInfoDisplay 
                    gameData={gameData.gameInfo as GameData} 
                    darkMode={darkMode}
                  />
                )}

                {/* Interactive Board */}
                <div className="relative flex justify-center">
                  <InteractiveVisualizationBoard 
                    board={board} 
                    size={Math.min(350, window.innerWidth - 100)}
                  />
                </div>

                {/* Timeline Controls */}
                <UniversalTimeline 
                  totalMoves={totalMoves}
                  moves={gameData?.moves || []}
                  currentMove={currentMove}
                  onMoveChange={setCurrentMove}
                />

                {/* Legend Toggle */}
                {showLegend && gameData?.palette && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <EnhancedLegend
                      whitePalette={gameData.palette.whiteColors}
                      blackPalette={gameData.palette.blackColors}
                      title={gameData.palette.name}
                      compact
                    />
                  </motion.div>
                )}

                {/* Controls */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLegend(!showLegend)}
                  >
                    {showLegend ? "Hide" : "Show"} Legend
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDarkMode(!darkMode)}
                  >
                    {darkMode ? "Light" : "Dark"} Mode
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleViewVision}
                    className="ml-auto"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Full View
                  </Button>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="analytics" asChild>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 pt-4"
              >
                {/* Vision Image & Title */}
                <div className="flex gap-4">
                  <img
                    src={visionData.image_path}
                    alt={visionData.title}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{visionData.title}</h3>
                    {gameData?.gameInfo && (
                      <p className="text-sm text-muted-foreground">
                        {gameData.gameInfo.white} vs {gameData.gameInfo.black}
                      </p>
                    )}
                    <Badge variant="secondary" className="mt-1">
                      {confidence}% Match
                    </Badge>
                  </div>
                </div>

                {/* Analytics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Views", value: visionScore?.view_count || 0, icon: "👁️" },
                    { label: "Downloads", value: (visionScore?.download_hd_count || 0) + (visionScore?.download_gif_count || 0), icon: "⬇️" },
                    { label: "Prints", value: visionScore?.print_order_count || 0, icon: "🖼️" },
                    { label: "Trades", value: visionScore?.trade_count || 0, icon: "🔄" },
                  ].map((stat, idx) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="bg-muted/50 rounded-lg p-3 text-center"
                    >
                      <div className="text-2xl mb-1">{stat.icon}</div>
                      <div className="text-xl font-bold">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Vision Score */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg p-4 text-center"
                >
                  <div className="text-sm text-muted-foreground mb-1">Vision Score</div>
                  <div className="text-3xl font-bold text-primary">
                    {(visionScore?.total_score || 0).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {visionScore?.unique_viewers || 0} unique viewers
                  </div>
                </motion.div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setActiveTab("experience")}
                  >
                    Back to Experience
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleViewVision}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Visit Page
                  </Button>
                </div>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>

        {/* Back to Scan */}
        <Button variant="ghost" size="sm" onClick={resetScan} className="w-full">
          ← Scan Another Vision
        </Button>
      </div>
    </LegendHighlightProvider>
  );
}

export function VisionScanner({ isOpen, onClose }: VisionScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [showExperience, setShowExperience] = useState(false);
  const [visionData, setVisionData] = useState<VisionData | null>(null);
  const [visionScore, setVisionScore] = useState<VisionScore | null>(null);
  const [activeTab, setActiveTab] = useState<"experience" | "analytics">("experience");
  const [showLegend, setShowLegend] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const navigate = useNavigate();

  // Fetch full vision data when transitioning to experience mode
  useEffect(() => {
    if (showExperience && result?.vision?.visualization_id) {
      fetchVisionData(result.vision.visualization_id);
    }
  }, [showExperience, result?.vision?.visualization_id]);

  const fetchVisionData = async (visualizationId: string) => {
    try {
      // Fetch visualization data
      const { data: vizData, error: vizError } = await supabase
        .from("saved_visualizations")
        .select("*")
        .eq("id", visualizationId)
        .single();

      if (vizError) throw vizError;
      setVisionData(vizData as unknown as VisionData);

      // Fetch vision score
      const { data: scoreData } = await supabase
        .from("vision_scores")
        .select("*")
        .eq("visualization_id", visualizationId)
        .single();

      if (scoreData) {
        setVisionScore(scoreData as VisionScore);
      }
    } catch (error) {
      console.error("Error fetching vision data:", error);
      toast.error("Failed to load vision details");
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    setResult(null);
    setPreviewImage(null);
    setShowExperience(false);
    setVisionData(null);
    setVisionScore(null);
    setActiveTab("experience");
    onClose();
  }, [stopCamera, onClose]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (error) {
      console.error("Camera access error:", error);
      toast.error("Could not access camera. Please try uploading an image instead.");
    }
  };

  const captureFromCamera = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.8);
      setPreviewImage(imageData);
      stopCamera();
      scanImage(imageData);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setPreviewImage(imageData);
      scanImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const scanImage = async (imageBase64: string) => {
    setScanning(true);
    setResult(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vision-scanner`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ image_base64: imageBase64 }),
        }
      );

      if (response.status === 429) {
        toast.error("Too many scans. Please wait a moment and try again.");
        setScanning(false);
        return;
      }

      const data: ScanResult = await response.json();
      setResult(data);

      if (data.matched && data.vision) {
        toast.success(`Found: ${data.vision.title}`, {
          description: `${data.vision.confidence}% confidence match`
        });
      } else if (data.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error("Scan error:", error);
      toast.error("Failed to scan image. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const handleViewVision = () => {
    if (result?.share_url) {
      handleClose();
      navigate(result.share_url);
    }
  };

  const handleExploreVision = () => {
    setShowExperience(true);
  };

  const resetScan = () => {
    setResult(null);
    setPreviewImage(null);
    setShowExperience(false);
    setVisionData(null);
    setVisionScore(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const gameData = visionData?.game_data;
  const board = gameData?.board;
  const totalMoves = gameData?.moves?.length || 0;

  // Experience Mode Content
  const renderExperienceMode = () => {
    if (!visionData || !board) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <TimelineProvider>
        <VisionExperienceContent
          visionData={visionData}
          visionScore={visionScore}
          board={board}
          gameData={gameData}
          totalMoves={totalMoves}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showLegend={showLegend}
          setShowLegend={setShowLegend}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          confidence={result?.vision?.confidence}
          handleViewVision={handleViewVision}
          resetScan={resetScan}
        />
      </TimelineProvider>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className={`sm:max-w-lg ${showExperience ? "sm:max-w-2xl" : ""}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {showExperience ? "Vision Experience" : "Natural QR Vision™ Scanner"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className={showExperience ? "max-h-[70vh]" : ""}>
          <div className="space-y-4 pr-2">
            {showExperience ? (
              renderExperienceMode()
            ) : (
              <>
                {/* Info Banner */}
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground">
                    Scan any En Pensent visualization — the unique color pattern acts as a natural fingerprint that links to its digital page.
                  </p>
                </div>

                {/* Camera/Upload Area */}
                <AnimatePresence mode="wait">
                  {!previewImage && !cameraActive && (
                    <motion.div
                      key="options"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-2 gap-3"
                    >
                      <Button
                        variant="outline"
                        className="h-32 flex-col gap-2"
                        onClick={startCamera}
                      >
                        <Camera className="h-8 w-8" />
                        <span>Use Camera</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-32 flex-col gap-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-8 w-8" />
                        <span>Upload Image</span>
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </motion.div>
                  )}

                  {cameraActive && (
                    <motion.div
                      key="camera"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative"
                    >
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full rounded-lg"
                      />
                      <div className="absolute inset-0 border-2 border-primary/50 rounded-lg pointer-events-none">
                        <div className="absolute inset-4 border border-dashed border-primary/30 rounded" />
                      </div>
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                        <Button variant="secondary" size="sm" onClick={stopCamera}>
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={captureFromCamera}>
                          <Scan className="h-4 w-4 mr-1" />
                          Capture & Scan
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {previewImage && (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="relative">
                        <img
                          src={previewImage}
                          alt="Scan preview"
                          className="w-full rounded-lg"
                        />
                        {scanning && (
                          <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                            <div className="text-center space-y-2">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                              <p className="text-sm font-medium">Analyzing pattern...</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Result Display */}
                      {result && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-lg border ${
                            result.matched
                              ? "bg-green-500/10 border-green-500/30"
                              : "bg-orange-500/10 border-orange-500/30"
                          }`}
                        >
                          {result.matched && result.vision ? (
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                <div className="flex-1">
                                  <h4 className="font-semibold">{result.vision.title}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {result.vision.confidence}% confidence match
                                  </p>
                                  {result.reason && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {result.reason}
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              {/* New: Explore Vision Button */}
                              <Button 
                                className="w-full gap-2" 
                                onClick={handleExploreVision}
                                variant="default"
                              >
                                <Play className="h-4 w-4" />
                                Explore Vision
                                <ArrowRight className="h-4 w-4 ml-auto" />
                              </Button>
                              
                              <Button 
                                variant="outline" 
                                className="w-full" 
                                onClick={handleViewVision}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open Full Page
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3">
                              <XCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                              <div>
                                <h4 className="font-semibold">No Match Found</h4>
                                <p className="text-sm text-muted-foreground">
                                  {result.message || "This visualization may not be in our database yet."}
                                </p>
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={resetScan}>
                          Scan Another
                        </Button>
                        {!result?.matched && (
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              handleClose();
                              navigate("/");
                            }}
                          >
                            Create New Vision
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
