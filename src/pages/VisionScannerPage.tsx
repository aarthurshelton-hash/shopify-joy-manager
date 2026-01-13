import { useState, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, Scan, CheckCircle, XCircle, Loader2, ExternalLink, Sparkles, Play, BarChart3, ArrowRight, ArrowLeft, Fingerprint, TrendingUp, Crown, Users, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/shop/Header";
import { Footer } from "@/components/shop/Footer";
import { useRandomGameArt } from "@/hooks/useRandomGameArt";
import type { SquareData } from "@/lib/chess/gameSimulator";

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

// Sample visualization patterns for the demo
const samplePatterns = [
  {
    title: "The Immortal Game",
    colors: [
      ["#8B4513", "#FFD700", "#8B4513", "#DC143C", "#FFD700", "#8B4513", "#DC143C", "#FFD700"],
      ["#DC143C", "#8B4513", "#FFD700", "#8B4513", "#DC143C", "#FFD700", "#8B4513", "#DC143C"],
      ["#FFD700", "#DC143C", "#8B4513", "#FFD700", "#8B4513", "#DC143C", "#FFD700", "#8B4513"],
      ["#8B4513", "#FFD700", "#DC143C", "#8B4513", "#FFD700", "#8B4513", "#DC143C", "#FFD700"],
      ["#DC143C", "#8B4513", "#FFD700", "#DC143C", "#8B4513", "#FFD700", "#8B4513", "#DC143C"],
      ["#FFD700", "#DC143C", "#8B4513", "#FFD700", "#DC143C", "#8B4513", "#FFD700", "#8B4513"],
      ["#8B4513", "#FFD700", "#DC143C", "#8B4513", "#FFD700", "#DC143C", "#8B4513", "#FFD700"],
      ["#DC143C", "#8B4513", "#FFD700", "#DC143C", "#8B4513", "#FFD700", "#DC143C", "#8B4513"],
    ],
  },
];

const demoSteps = [
  { icon: Camera, title: "Capture", desc: "Photograph any En Pensent vision print or screen" },
  { icon: Fingerprint, title: "Analyze", desc: "AI reads the unique color fingerprint pattern" },
  { icon: Link2, title: "Connect", desc: "Instantly link to the digital experience page" },
  { icon: TrendingUp, title: "Score", desc: "Every scan increases the Vision Score" },
];

export default function VisionScannerPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const randomArts = useRandomGameArt(3);
  
  const [scanning, setScanning] = useState(false);
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

  // Animate through demo steps when idle
  useEffect(() => {
    if (!scanning && !result && !cameraActive) {
      const interval = setInterval(() => {
        setDemoStep((prev) => (prev + 1) % 4);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [scanning, result, cameraActive]);

  const processImage = async (imageData: string) => {
    setScanning(true);
    setResult(null);
    setPreviewUrl(imageData);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vision-scanner`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: imageData }),
        }
      );

      if (!response.ok) {
        throw new Error("Scan failed");
      }

      const data = await response.json();
      setResult(data);
      
      if (data.matched && data.vision) {
        await fetchVisionData(data.vision.visualization_id);
        setShowExperience(true);
        toast.success("Vision matched!", {
          description: `Found: ${data.vision.title}`,
        });
      }
    } catch (error) {
      console.error("Scan error:", error);
      setResult({
        matched: false,
        reason: "Failed to process image",
        error: String(error),
      });
      toast.error("Scan failed", { description: "Please try again" });
    } finally {
      setScanning(false);
    }
  };

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
  };

  const handleViewVision = () => {
    if (visionData?.public_share_id) {
      navigate(`/v/${visionData.public_share_id}`);
    }
  };

  const pattern = samplePatterns[0];

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
                      {board.length > 0 ? (
                        <div className="aspect-square bg-card rounded-xl overflow-hidden border border-border">
                          <img
                            src={visionData.image_path}
                            alt={visionData.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square bg-card rounded-xl flex items-center justify-center">
                          <img
                            src={visionData.image_path}
                            alt={visionData.title}
                            className="max-w-full max-h-full rounded-lg"
                          />
                        </div>
                      )}
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
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-3/4 h-3/4 border-2 border-primary/50 rounded-lg" />
                      </div>
                    </>
                  ) : previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Scan preview"
                      className="absolute inset-0 w-full h-full object-contain"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                      {/* Demo Pattern */}
                      <div className="w-32 h-32 mb-4 relative">
                        <div className="grid grid-cols-8 gap-0.5">
                          {pattern.colors.slice(0, 4).map((row, rowIndex) =>
                            row.slice(0, 8).map((color, colIndex) => (
                              <div
                                key={`${rowIndex}-${colIndex}`}
                                className="aspect-square rounded-sm opacity-40"
                                style={{ backgroundColor: color }}
                              />
                            ))
                          )}
                        </div>
                        <motion.div
                          className="absolute inset-0 border-2 border-primary rounded-lg"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Capture or upload an En Pensent visualization
                      </p>
                    </div>
                  )}

                  {scanning && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-sm text-muted-foreground">Analyzing pattern...</p>
                      </div>
                    </div>
                  )}

                  {result && !result.matched && (
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center p-6">
                      <div className="text-center">
                        <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">No Match Found</h3>
                        <p className="text-sm text-muted-foreground mb-4">{result.reason || result.message}</p>
                        <Button onClick={resetScan} variant="outline">Try Again</Button>
                      </div>
                    </div>
                  )}
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
              </div>
            </motion.div>

            {/* Right: How It Works + Value Prop */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              {/* Process Steps */}
              <div className="grid grid-cols-2 gap-4">
                {demoSteps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = demoStep === index;
                  return (
                    <motion.div
                      key={step.title}
                      className={`p-5 rounded-xl border transition-all duration-300 ${
                        isActive 
                          ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/10" 
                          : "bg-card/50 border-border/50"
                      }`}
                      animate={{
                        scale: isActive ? 1.02 : 1,
                      }}
                    >
                      <Icon className={`h-7 w-7 mb-3 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                      <h4 className={`font-semibold text-lg ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                        {step.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{step.desc}</p>
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
