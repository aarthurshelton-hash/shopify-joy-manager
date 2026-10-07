import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Scan, Sparkles, ArrowRight, TrendingUp, Crown, Users, Unlock, Eye, Zap, ScanLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/shop/Header";
import { Footer } from "@/components/shop/Footer";
import { useRandomGameArt } from "@/hooks/useRandomGameArt";
import { useAuth } from "@/hooks/useAuth";
import { ScanHistory, saveScanToHistory } from "@/components/scanner/ScanHistory";
import { ScanLeaderboard } from "@/components/scanner/ScanLeaderboard";
import { ScanStreak, updateScanStreak } from "@/components/scanner/ScanStreak";
import { LiveVisionScanner, type ScanTarget } from "@/components/scanner/LiveVisionScanner";
import { rewardCardFor } from "@/lib/matcherino/rewardCards";
import AnimatedVisualizationPreview from "@/components/chess/AnimatedVisualizationPreview";
import { simulateGame } from "@/lib/chess/gameSimulator";
import { setActivePalette, type PaletteId } from "@/lib/chess/pieceColors";
import { useSessionStore } from "@/stores/sessionStore";

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
  { icon: Eye, title: "Point", desc: "Aim your camera at any En Pensent vision" },
  { icon: ScanLine, title: "Detect", desc: "Its color fingerprint is read on your device" },
  { icon: Unlock, title: "Identify", desc: "The exact game and palette are recognized" },
  { icon: Zap, title: "Open", desc: "The full interactive vision opens instantly" },
];

export default function VisionScannerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const randomArts = useRandomGameArt(6);
  const setCurrentSimulation = useSessionStore((s) => s.setCurrentSimulation);

  const [demoStep, setDemoStep] = useState(0);
  const [historyKey, setHistoryKey] = useState(0);
  const [leaderboardKey, setLeaderboardKey] = useState(0);
  const [streakKey, setStreakKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setDemoStep((prev) => (prev + 1) % 4), 3000);
    return () => clearInterval(interval);
  }, []);

  // Signed-in perks: history, streaks, achievements
  const handleMatched = useCallback(async (target: ScanTarget) => {
    // Vision-as-QR: a reward card's artwork identifies its tier on scan.
    if (target.kind === 'vision') {
      const card = rewardCardFor(target.candidate);
      if (card) {
        toast.success(`${card.label} reward card`, {
          description: 'This card carries a Matcherino reward code.',
          action: { label: 'Claim reward', onClick: () => navigate('/redeem') },
          duration: 10000,
        });
      }
    }
    if (!user) return;
    const vizId = target.kind === 'vision' ? target.candidate.visualizationId : undefined;
    const confidence = target.kind === 'vision' ? target.confidence : 100;
    try {
      await saveScanToHistory(user.id, true, vizId, confidence, '');
      setHistoryKey((k) => k + 1);
      const streak = await updateScanStreak(user.id);
      if (streak?.new_day) {
        setStreakKey((k) => k + 1);
        if (!streak.streak_broken && streak.reward_value > 0) {
          toast.success(`${streak.current_streak} day scan streak`, {
            description: `+${streak.reward_value} points (${streak.reward_type} reward)`,
          });
        }
      }
      const { data: achievements } = await supabase.rpc("check_scan_achievements", { p_user_id: user.id });
      const earned = (achievements || []).filter((a: { just_earned: boolean }) => a.just_earned);
      if (earned.length > 0) {
        toast.success("Achievement unlocked", {
          description: earned.map((a: { achievement_type: string }) => a.achievement_type.replace(/_/g, " ")).join(", "),
        });
        setLeaderboardKey((k) => k + 1);
      }
    } catch (error) {
      console.error("Scan bookkeeping failed:", error);
    }
  }, [user, navigate]);

  // Hand off to the universal vision viewer
  const handleOpen = useCallback((target: ScanTarget) => {
    if (target.kind === 'link') {
      const url = new URL(target.path, window.location.origin);
      url.searchParams.set('src', 'scan');
      navigate(`${url.pathname}${url.search}`);
      return;
    }
    const c = target.candidate;
    if (c.kind === 'saved' && c.publicShareId) {
      navigate(`/v/${c.publicShareId}?src=scan`);
      return;
    }
    try {
      setActivePalette(c.paletteId as PaletteId);
      setCurrentSimulation(simulateGame(c.pgn), c.pgn, c.title);
    } catch (err) {
      console.error("Failed to prepare scanned vision:", err);
    }
    const params = new URLSearchParams({ src: 'scan' });
    if (c.paletteId !== 'modern') params.set('p', c.paletteId);
    navigate(`/g/${c.gameHash}?${params.toString()}`);
  }, [navigate, setCurrentSimulation]);

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
              Free for everyone
              <Badge variant="secondary" className="ml-2 text-xs">No account needed</Badge>
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
              Every vision is its own code. Point your camera at one, and the game behind it
              comes to life, like a QR code made of art.
            </motion.p>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-12 items-start mb-16">
            {/* Left: Scanner */}
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

                <LiveVisionScanner onOpen={handleOpen} onMatched={handleMatched} />

                {user && (
                  <>
                    <div className="mt-4">
                      <ScanStreak key={streakKey} />
                    </div>
                    <div className="mt-4">
                      <ScanHistory key={historyKey} />
                    </div>
                  </>
                )}
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
                  <h4 className="font-semibold mb-2">The Vision Is the Code</h4>
                  <p className="text-sm text-muted-foreground">
                    Prints still carry a standard QR for any camera app, but the scanner also reads the
                    artwork itself — the nested color layers are the code, recognized entirely on your device.
                  </p>
                </div>
              </div>
            </motion.div>
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
