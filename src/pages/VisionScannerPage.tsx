import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Scan, CheckCircle, XCircle, Loader2, ExternalLink, Sparkles, Play, BarChart3, ArrowRight, ArrowLeft, Fingerprint, TrendingUp, Crown, Users, Link2, WifiOff, Unlock, Lock, Eye, Zap, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/shop/Header";
import { Footer } from "@/components/shop/Footer";
import { useRandomGameArt } from "@/hooks/useRandomGameArt";
import { useAuth } from "@/hooks/useAuth";
import { ViewfinderOverlay } from "@/components/scanner/ViewfinderOverlay";
import { ConfidenceRing } from "@/components/scanner/ConfidenceRing";
import { ScanHistory, saveScanToHistory } from "@/components/scanner/ScanHistory";
import { ScanLeaderboard } from "@/components/scanner/ScanLeaderboard";
import { OfflineSyncIndicator } from "@/components/scanner/OfflineSyncIndicator";
import { ScanStreak, updateScanStreak } from "@/components/scanner/ScanStreak";
import { useOfflineScanCache } from "@/hooks/useOfflineScanCache";
import AnimatedVisualizationPreview from "@/components/chess/AnimatedVisualizationPreview";
import type { SquareData } from "@/lib/chess/gameSimulator";

interface ScanResult {
  matched: boolean;
  vision?: {
    visualization_id: string;
    public_share_id: string;
    title: string;
    confidence: number;
    image_url: string;
    game_hash?: string;
    palette_id?: string;
  };
  share_url?: string;
  game_hash?: string;
  palette_id?: string;
  decryption_notes?: string;
  is_valid_vision?: boolean;
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

// Decryption state phases
type DecryptionPhase = 'idle' | 'scanning' | 'analyzing' | 'decrypting' | 'matched' | 'failed';

// Showcase games for animated previews - famous iconic games
const showcaseGames = [
  {
    title: "The Immortal Game",
    pgn: `1. e4 e5 2. f4 exf4 3. Bc4 Qh4+ 4. Kf1 b5 5. Bxb5 Nf6 6. Nf3 Qh6 7. d3 Nh5 8. Nh4 Qg5 9. Nf5 c6 10. g4 Nf6 11. Rg1 cxb5 12. h4 Qg6 13. h5 Qg5 14. Qf3 Ng8 15. Bxf4 Qf6 16. Nc3 Bc5 17. Nd5 Qxb2 18. Bd6 Bxg1 19. e5 Qxa1+ 20. Ke2 Na6 21. Nxg7+ Kd8 22. Qf6+ Nxf6 23. Be7# 1-0`,
  },
  {
    title: "Game of the Century",
    pgn: `1. Nf3 Nf6 2. c4 g6 3. Nc3 Bg7 4. d4 O-O 5. Bf4 d5 6. Qb3 dxc4 7. Qxc4 c6 8. e4 Nbd7 9. Rd1 Nb6 10. Qc5 Bg4 11. Bg5 Na4 12. Qa3 Nxc3 13. bxc3 Nxe4 14. Bxe7 Qb6 15. Bc4 Nxc3 16. Bc5 Rfe8+ 17. Kf1 Be6 18. Bxb6 Bxc4+ 19. Kg1 Ne2+ 20. Kf1 Nxd4+ 21. Kg1 Ne2+ 22. Kf1 Nc3+ 23. Kg1 axb6 24. Qb4 Ra4 25. Qxb6 Nxd1 26. h3 Rxa2 27. Kh2 Nxf2 28. Re1 Rxe1 29. Qd8+ Bf8 30. Nxe1 Bd5 31. Nf3 Ne4 32. Qb8 b5 33. h4 h5 34. Ne5 Kg7 35. Kg1 Bc5+ 36. Kf1 Ng3+ 37. Ke1 Bb4+ 38. Kd1 Bb3+ 39. Kc1 Ne2+ 40. Kb1 Nc3+ 41. Kc1 Rc2# 0-1`,
  },
  {
    title: "Kasparov's Immortal",
    pgn: `1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0`,
  },
];

const demoSteps = [
  { icon: Eye, title: "Capture", desc: "Photograph any En Pensent vision" },
  { icon: ScanLine, title: "Detect", desc: "AI reads the visual encryption" },
  { icon: Unlock, title: "Decrypt", desc: "Pattern decoded to identify game" },
  { icon: Zap, title: "Connect", desc: "Link to the unified experience" },
];


export default function VisionScannerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const randomArts = useRandomGameArt(6);
  
  // Offline scan cache
  const { isOnline, pendingCount, syncing, cacheScan, syncPendingScans } = useOfflineScanCache(user?.id);
  
  const [scanning, setScanning] = useState(false);
  const [decryptionPhase, setDecryptionPhase] = useState<DecryptionPhase>('idle');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [visionData, setVisionData] = useState<VisionData | null>(null);
  const [visionScore, setVisionScore] = useState<VisionScore | null>(null);
  const [showExperience, setShowExperience] = useState(false);
  const [activeTab, setActiveTab] = useState<"experience" | "analytics">("experience");
  const [showLegend, setShowLegend] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [historyKey, setHistoryKey] = useState(0);
  const [leaderboardKey, setLeaderboardKey] = useState(0);
  const [streakKey, setStreakKey] = useState(0);

  // Animate through demo steps when idle
  useEffect(() => {
    if (!scanning && !result && !cameraActive) {
      const interval = setInterval(() => {
        setDemoStep((prev) => (prev + 1) % 4);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [scanning, result, cameraActive]);

  // Decryption phase messages
  const getDecryptionMessage = (phase: DecryptionPhase): string => {
    switch (phase) {
      case 'scanning': return 'Scanning for visual encryption...';
      case 'analyzing': return 'Analyzing color fingerprint pattern...';
      case 'decrypting': return 'Decrypting game signature...';
      case 'matched': return 'Encryption key found!';
      case 'failed': return 'No matching encryption detected';
      default: return '';
    }
  };

  const processImage = async (imageData: string) => {
    setScanning(true);
    setDecryptionPhase('scanning');
    setResult(null);
    setPreviewUrl(imageData);

    // Handle offline mode
    if (!isOnline) {
      if (user) {
        cacheScan({
          matched: false,
          imagePreview: imageData.substring(0, 500),
        });
        toast.info("Scan saved offline", {
          description: "Will sync when connection is restored",
        });
      }
      setScanning(false);
      setDecryptionPhase('failed');
      setResult({
        matched: false,
        reason: "You're offline. Scan saved locally and will sync when you're back online.",
      });
      return;
    }

    try {
      // Phase 1: Scanning
      await new Promise(r => setTimeout(r, 400));
      setDecryptionPhase('analyzing');
      
      // Phase 2: Analyzing
      await new Promise(r => setTimeout(r, 300));
      setDecryptionPhase('decrypting');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vision-scanner`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image_base64: imageData }),
        }
      );

      if (!response.ok) {
        throw new Error("Scan failed");
      }

      const data: ScanResult = await response.json();
      setResult(data);
      
      // Save to scan history and update streak
      if (user) {
        await saveScanToHistory(
          user.id,
          data.matched,
          data.vision?.visualization_id,
          data.vision?.confidence,
          imageData.substring(0, 500)
        );
        setHistoryKey(prev => prev + 1);
        
        // Update scan streak
        try {
          const streakResult = await updateScanStreak(user.id);
          if (streakResult?.new_day) {
            setStreakKey(prev => prev + 1);
            
            if (streakResult.streak_broken) {
              toast.info("Streak reset", {
                description: "Your streak was reset. Keep scanning daily!",
              });
            } else if (streakResult.reward_value > 0) {
              toast.success(`🔥 ${streakResult.current_streak} Day Streak!`, {
                description: `+${streakResult.reward_value} points (${streakResult.reward_type} reward)`,
              });
            }
          }
        } catch (error) {
          console.error("Streak update failed:", error);
        }
        
        // Check for achievements
        try {
          const { data: achievements } = await supabase.rpc("check_scan_achievements", { 
            p_user_id: user.id 
          });
          
          const newAchievements = (achievements || []).filter((a: { just_earned: boolean }) => a.just_earned);
          if (newAchievements.length > 0) {
            toast.success("🏆 Achievement Unlocked!", {
              description: `You earned: ${newAchievements.map((a: { achievement_type: string }) => a.achievement_type.replace(/_/g, " ")).join(", ")}`,
            });
            setLeaderboardKey(prev => prev + 1);
          }
        } catch (error) {
          console.error("Achievement check failed:", error);
        }
      }
      
      if (data.matched && data.vision) {
        setDecryptionPhase('matched');
        await fetchVisionData(data.vision.visualization_id);
        setShowExperience(true);
        
        toast.success("🔓 Visual encryption decrypted!", {
          description: `Found: ${data.vision.title} (${data.vision.confidence}% confidence)`,
        });
      } else {
        setDecryptionPhase('failed');
        if (data.is_valid_vision) {
          toast.info("Vision detected but not in database", {
            description: data.decryption_notes || "This appears to be an En Pensent visualization we haven't seen before.",
          });
        }
      }
    } catch (error) {
      console.error("Scan error:", error);
      setDecryptionPhase('failed');
      setResult({
        matched: false,
        reason: "Failed to process image",
        error: String(error),
      });
      toast.error("Decryption failed", { description: "Please try again with a clearer image" });
    } finally {
      setScanning(false);
    }
  };

  // Navigate to canonical game URL
  const handleOpenGameMenu = useCallback(() => {
    if (result?.game_hash || result?.vision?.game_hash) {
      const gameHash = result.game_hash || result.vision?.game_hash;
      const paletteId = result.palette_id || result.vision?.palette_id;
      
      let url = `/g/${gameHash}`;
      if (paletteId && paletteId !== 'modern') {
        url += `?p=${paletteId}`;
      }
      navigate(url);
    } else if (result?.share_url) {
      // Fallback to share_url if available
      navigate(result.share_url);
    }
  }, [result, navigate]);

  const fetchVisionData = async (visualizationId: string) => {
    try {
      const { data: vizData, error: vizError } = await supabase
        .from("saved_visualizations")
        .select("*")
        .eq("id", visualizationId)
        .single();

      if (vizError) throw vizError;
      
      const gameData = typeof vizData.game_data === 'string' 
        ? JSON.parse(vizData.game_data) 
        : vizData.game_data;
      
      setVisionData({ ...vizData, game_data: gameData } as VisionData);

      const { data: scoreData, error: scoreError } = await supabase
        .from("vision_scores")
        .select("*")
        .eq("visualization_id", visualizationId)
        .single();

      if (!scoreError && scoreData) {
        setVisionScore(scoreData as VisionScore);
      }
    } catch (error) {
      console.error("Failed to fetch vision data:", error);
    }
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      processImage(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast.error("Camera access denied", {
        description: "Please allow camera access to scan",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL("image/jpeg", 0.8);
      stopCamera();
      processImage(imageData);
    }
  };

  const resetScan = () => {
    setResult(null);
    setPreviewUrl(null);
    setVisionData(null);
    setVisionScore(null);
    setShowExperience(false);
    setActiveTab("experience");
    setDecryptionPhase('idle');
  };

  const handleViewVision = () => {
    if (visionData?.public_share_id) {
      navigate(`/v/${visionData.public_share_id}`);
    }
  };

  // Use showcase game for demo

  // Vision Experience View
  if (showExperience && visionData) {
    const board = visionData.game_data?.board || [];
    const gameData = visionData.game_data;
    const totalMoves = gameData?.moves?.length || 0;

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Button
              variant="ghost"
              onClick={resetScan}
              className="mb-6 gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Scan Another Vision
            </Button>

            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-display font-bold">
                    {visionData.title}
                  </h1>
                  {result?.vision?.confidence && (
                    <Badge variant="secondary" className="mt-2">
                      {Math.round(result.vision.confidence)}% Match Confidence
                    </Badge>
                  )}
                </div>
                <Button onClick={handleViewVision} className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View Full Experience
                </Button>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "experience" | "analytics")}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="experience" className="gap-2">
                    <Play className="h-4 w-4" />
                    Experience
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="experience" className="mt-6">
                  <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      {/* Confidence Ring with Image */}
                      <div className="flex flex-col items-center">
                        <ConfidenceRing 
                          confidence={result?.vision?.confidence || 0} 
                          size={Math.min(400, window.innerWidth - 100)}
                        >
                          <img
                            src={visionData.image_path}
                            alt={visionData.title}
                            className="w-full h-full object-cover rounded-full"
                          />
                        </ConfidenceRing>
                      </div>
                      
                      {/* Full Image Preview */}
                      <div className="mt-6 aspect-square bg-card rounded-xl overflow-hidden border border-border">
                        <img
                          src={visionData.image_path}
                          alt={visionData.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      {gameData?.gameInfo && (
                        <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                          <h3 className="font-display font-bold text-sm uppercase tracking-wide">Game Info</h3>
                          <div className="space-y-1 text-sm">
                            <div><span className="text-muted-foreground">White:</span> {gameData.gameInfo.white || "Unknown"}</div>
                            <div><span className="text-muted-foreground">Black:</span> {gameData.gameInfo.black || "Unknown"}</div>
                            {gameData.gameInfo.event && <div><span className="text-muted-foreground">Event:</span> {gameData.gameInfo.event}</div>}
                            {gameData.gameInfo.date && <div><span className="text-muted-foreground">Date:</span> {gameData.gameInfo.date}</div>}
                            {gameData.gameInfo.result && <div><span className="text-muted-foreground">Result:</span> {gameData.gameInfo.result}</div>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="mt-6">
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-6 rounded-xl bg-card border border-border">
                      <div className="text-3xl font-bold text-primary">{visionScore?.view_count || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Views</div>
                    </div>
                    <div className="p-6 rounded-xl bg-card border border-border">
                      <div className="text-3xl font-bold text-primary">{visionScore?.unique_viewers || 0}</div>
                      <div className="text-sm text-muted-foreground">Unique Viewers</div>
                    </div>
                    <div className="p-6 rounded-xl bg-card border border-border">
                      <div className="text-3xl font-bold text-primary">{visionScore?.trade_count || 0}</div>
                      <div className="text-sm text-muted-foreground">Times Traded</div>
                    </div>
                    <div className="p-6 rounded-xl bg-card border border-border">
                      <div className="text-3xl font-bold text-gold-gradient">{visionScore?.total_score || 0}</div>
                      <div className="text-sm text-muted-foreground">Vision Score</div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-display uppercase tracking-widest mb-6"
            >
              <Sparkles className="h-4 w-4" />
              Revolutionary Technology
              <Badge variant="secondary" className="ml-2 text-xs">Patent Pending</Badge>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-royal font-bold uppercase tracking-wide mb-4"
            >
              Natural Vision™
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto"
            >
              Every visualization is visually encrypted with its own data — 
              a unique fingerprint that our AI can recognize instantly.
            </motion.p>
          </div>

          {/* Animated Showcase - Live GIF-like Previews */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mb-12"
          >
            <div className="grid grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
              {showcaseGames.map((game, index) => (
                <motion.div
                  key={game.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="relative group"
                >
                  <div className="relative rounded-xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
                    {/* Scanning effect overlay */}
                    <motion.div 
                      className="absolute inset-0 z-10 pointer-events-none"
                      style={{
                        background: 'linear-gradient(180deg, hsl(var(--primary) / 0.3) 0%, transparent 50%, transparent 100%)',
                        height: '50%',
                      }}
                      animate={{ 
                        top: ['-50%', '100%'],
                      }}
                      transition={{ 
                        duration: 2.5 + index * 0.5, 
                        repeat: Infinity,
                        ease: "linear",
                        delay: index * 0.3,
                      }}
                    />
                    
                    <AnimatedVisualizationPreview
                      pgn={game.pgn}
                      size={180}
                      animationSpeed={100 + index * 20}
                      className="w-full"
                    />
                    
                    {/* Corner targeting brackets */}
                    <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-primary/60" />
                    <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-primary/60" />
                    <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-primary/60" />
                    <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-primary/60" />
                    
                    {/* Pulse effect on hover */}
                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-300" />
                  </div>
                  <p className="text-xs md:text-sm text-center text-muted-foreground mt-2 font-medium truncate px-1">
                    {game.title}
                  </p>
                </motion.div>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground mt-6">
              <Sparkles className="inline h-4 w-4 mr-1.5 text-primary" />
              Each vision is a unique visual encryption of its chess game
            </p>
          </motion.div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: Scanner Interface */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-xl">
                <h2 className="text-xl font-display font-bold mb-4 flex items-center gap-2">
                  <Scan className="h-5 w-5 text-primary" />
                  Vision Scanner
                </h2>

                {/* Camera / Upload Area */}
                <div className="aspect-square relative rounded-xl overflow-hidden bg-muted/20 border border-dashed border-border">
                  {cameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <ViewfinderOverlay scanning={scanning} />
                    </>
                  ) : previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Scan preview"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                      {/* Animated Demo Visualization */}
                      <div className="w-48 h-48 mb-4 relative">
                        <AnimatedVisualizationPreview
                          pgn={showcaseGames[demoStep % showcaseGames.length].pgn}
                          size={192}
                          animationSpeed={100}
                          className="w-full h-full opacity-60"
                        />
                        {/* Scanning overlay effect */}
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: 'linear-gradient(180deg, transparent 0%, hsl(var(--primary) / 0.3) 50%, transparent 100%)',
                            height: '30%',
                          }}
                          animate={{
                            top: ['-30%', '100%'],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'linear',
                          }}
                        />
                        {/* Corner targeting brackets */}
                        <motion.div
                          className="absolute inset-4 border-2 border-primary/50 rounded-lg"
                          animate={{ opacity: [0.3, 0.8, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Scan any En Pensent vision to decrypt it
                      </p>
                    </div>
                  )}

                  {/* Decryption Overlay */}
                  <AnimatePresence>
                    {scanning && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center"
                      >
                        <div className="text-center space-y-4">
                          {/* Animated Lock Icon */}
                          <motion.div
                            animate={{ 
                              scale: decryptionPhase === 'matched' ? [1, 1.2, 1] : 1,
                              rotate: decryptionPhase === 'decrypting' ? [0, 5, -5, 0] : 0
                            }}
                            transition={{ duration: 0.5, repeat: decryptionPhase === 'decrypting' ? Infinity : 0 }}
                          >
                            {decryptionPhase === 'matched' ? (
                              <Unlock className="h-16 w-16 text-green-500 mx-auto" />
                            ) : (
                              <Lock className="h-16 w-16 text-primary mx-auto" />
                            )}
                          </motion.div>
                          
                          {/* Phase Progress */}
                          <div className="flex justify-center gap-2">
                            {(['scanning', 'analyzing', 'decrypting'] as DecryptionPhase[]).map((phase, idx) => (
                              <motion.div
                                key={phase}
                                className={`h-1.5 w-8 rounded-full ${
                                  ['scanning', 'analyzing', 'decrypting', 'matched'].indexOf(decryptionPhase) >= idx
                                    ? 'bg-primary'
                                    : 'bg-muted'
                                }`}
                                animate={{
                                  opacity: decryptionPhase === phase ? [0.5, 1, 0.5] : 1
                                }}
                                transition={{ duration: 0.8, repeat: decryptionPhase === phase ? Infinity : 0 }}
                              />
                            ))}
                          </div>
                          
                          {/* Phase Message */}
                          <motion.p 
                            key={decryptionPhase}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm font-medium text-primary"
                          >
                            {getDecryptionMessage(decryptionPhase)}
                          </motion.p>
                          
                          <p className="text-xs text-muted-foreground">
                            Reading visual encryption pattern...
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Match Success Overlay */}
                  <AnimatePresence>
                    {result?.matched && !scanning && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center p-6"
                      >
                        <div className="text-center space-y-4">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 15 }}
                          >
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                          </motion.div>
                          
                          <div>
                            <h3 className="font-bold text-lg mb-1">🔓 Decrypted!</h3>
                            <p className="text-primary font-semibold">{result.vision?.title}</p>
                            <Badge variant="secondary" className="mt-2">
                              {result.vision?.confidence}% Match
                            </Badge>
                          </div>
                          
                          {result.decryption_notes && (
                            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                              {result.decryption_notes}
                            </p>
                          )}
                          
                          <div className="flex gap-2 justify-center">
                            <Button onClick={handleOpenGameMenu} className="gap-2">
                              <ExternalLink className="h-4 w-4" />
                              Open Game Menu
                            </Button>
                            <Button onClick={resetScan} variant="outline">
                              Scan Another
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* No Match Overlay */}
                  <AnimatePresence>
                    {result && !result.matched && !scanning && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center p-6"
                      >
                        <div className="text-center space-y-4">
                          <XCircle className="h-16 w-16 text-destructive mx-auto" />
                          <div>
                            <h3 className="font-semibold mb-2">
                              {result.is_valid_vision ? "Unknown Vision" : "No Match Found"}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {result.reason || result.message}
                            </p>
                            {result.decryption_notes && (
                              <p className="text-xs text-muted-foreground/70 max-w-xs mx-auto">
                                Detected: {result.decryption_notes}
                              </p>
                            )}
                          </div>
                          <Button onClick={resetScan} variant="outline">Try Again</Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <canvas ref={canvasRef} className="hidden" />

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {cameraActive ? (
                    <>
                      <Button onClick={capturePhoto} className="gap-2">
                        <Camera className="h-4 w-4" />
                        Capture
                      </Button>
                      <Button onClick={stopCamera} variant="outline" className="gap-2">
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={startCamera} className="gap-2" disabled={scanning}>
                        <Camera className="h-4 w-4" />
                        Use Camera
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2"
                        disabled={scanning}
                      >
                        <Upload className="h-4 w-4" />
                        Upload Image
                      </Button>
                    </>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Offline Sync Indicator */}
                {(pendingCount > 0 || !isOnline) && (
                  <div className="mt-4">
                    <OfflineSyncIndicator
                      isOnline={isOnline}
                      pendingCount={pendingCount}
                      syncing={syncing}
                      onSync={syncPendingScans}
                    />
                  </div>
                )}

                {/* Scan Streak */}
                <div className="mt-4">
                  <ScanStreak key={streakKey} />
                </div>

                {/* Scan History */}
                <div className="mt-4">
                  <ScanHistory key={historyKey} />
                </div>
                
                {/* Scan Leaderboard */}
                <div className="mt-4">
                  <ScanLeaderboard key={leaderboardKey} />
                </div>
              </div>
            </motion.div>

            {/* Right: How It Works + Value Prop */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              {/* Process Steps with AI Art Backgrounds */}
              <div className="grid grid-cols-2 gap-4">
                {demoSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = demoStep === index;
                  return (
                    <motion.div
                      key={step.title}
                      className={`relative p-5 rounded-xl border overflow-hidden transition-all duration-300 ${
                        isActive 
                          ? "border-primary/30 shadow-lg shadow-primary/10" 
                          : "border-border/50"
                      }`}
                      animate={{
                        scale: isActive ? 1.02 : 1,
                      }}
                    >
                      {/* AI Art Background */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-15"
                        style={{ backgroundImage: `url(${randomArts[index]})` }}
                      />
                      <div className={`absolute inset-0 ${isActive ? 'bg-primary/10' : 'bg-card/80'}`} />
                      
                      {/* Content */}
                      <div className="relative z-10">
                        <Icon className={`h-7 w-7 mb-3 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                        <h4 className={`font-semibold text-lg ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                          {step.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Value Proposition */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 border border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/20 rounded-lg">
                    <Crown className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Early Visionary Advantage</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Every scan, view, and engagement increases your Vision's score. 
                      As our community grows, early visions become more valuable — 
                      <span className="text-primary font-medium"> your art appreciates with our platform.</span>
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-primary/20 flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">More Members</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-primary" />
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Higher Vision Scores</span>
                  </div>
                </div>
              </div>

              {/* Background Art Card */}
              <div className="relative overflow-hidden rounded-xl p-6 border border-border/50">
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-10"
                  style={{ backgroundImage: `url(${randomArts[0]})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
                <div className="relative z-10">
                  <h4 className="font-semibold mb-2">Traditional QR Also Included</h4>
                  <p className="text-sm text-muted-foreground">
                    Every print includes a standard QR code for compatibility with any smartphone camera. 
                    The Natural Vision scanner offers enhanced recognition for prints photographed from any angle.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
