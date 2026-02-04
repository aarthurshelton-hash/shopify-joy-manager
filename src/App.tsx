import { Suspense, lazy } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { LocationTracker } from "@/components/shared/LocationTracker";
import { VisionRestorer } from "@/components/shared/VisionRestorer";
import { GlobalAlertsBanner } from "@/components/shared/GlobalAlertsBanner";
import { BackToMarketplaceButton } from "@/components/marketplace/BackToMarketplaceButton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { StructuredData } from "@/components/seo/StructuredData";
import { DynamicMetaTags } from "@/components/seo/DynamicMetaTags";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { PageLoadingSkeleton } from "@/components/loading/AppLoadingStates";

// Eagerly load critical pages
import Index from "./pages/Index";
import GameView from "./pages/GameView";

// Lazy load all other pages for better initial load performance
const MyPalettes = lazy(() => import("./pages/MyPalettes"));
const MyVision = lazy(() => import("./pages/MyVision"));
const About = lazy(() => import("./pages/About"));
const Investors = lazy(() => import("./pages/Investors"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Play = lazy(() => import("./pages/Play"));
const CreativeMode = lazy(() => import("./pages/CreativeMode"));
const GameHistory = lazy(() => import("./pages/GameHistory"));
const News = lazy(() => import("./pages/News"));
const QRMockup = lazy(() => import("./pages/QRMockup"));
const OrderPrint = lazy(() => import("./pages/OrderPrint"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const AdminSeedMarketplace = lazy(() => import("./pages/AdminSeedMarketplace"));
const VisualizationRedirect = lazy(() => import("./pages/VisualizationRedirect"));
const GalleryDetailRedirect = lazy(() => import("./pages/GalleryDetailRedirect"));
const MarketplaceDetailRedirect = lazy(() => import("./pages/MarketplaceDetailRedirect"));
const PaletteAdminPage = lazy(() => import("./components/admin/PaletteAdminPage"));
const AdminModeration = lazy(() => import("./pages/AdminModeration"));
const AdminEconomics = lazy(() => import("./pages/AdminEconomics"));
const Account = lazy(() => import("./pages/Account"));
const BookGenerator = lazy(() => import("./pages/BookGenerator"));
const EducationFund = lazy(() => import("./pages/EducationFund"));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard"));
const AdminWithdrawals = lazy(() => import("./pages/AdminWithdrawals"));
const AdminDMCA = lazy(() => import("./pages/AdminDMCA"));
const AdminWatermarkVerification = lazy(() => import("./pages/AdminWatermarkVerification"));
const AdminBatchWatermarkVerification = lazy(() => import("./pages/AdminBatchWatermarkVerification"));
const DMCACounterNotification = lazy(() => import("./pages/DMCACounterNotification"));
const DMCAStatusTracking = lazy(() => import("./pages/DMCAStatusTracking"));
const VisionScannerPage = lazy(() => import("./pages/VisionScannerPage"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const DMCA = lazy(() => import("./pages/DMCA"));
const PremiumAnalytics = lazy(() => import("./pages/PremiumAnalytics"));
const AdminCEODashboard = lazy(() => import("./pages/AdminCEODashboard"));
const AdminAIArtBank = lazy(() => import("./pages/AdminAIArtBank"));
const OpeningEncyclopedia = lazy(() => import("./pages/OpeningEncyclopedia"));
const CodeAnalysis = lazy(() => import("./pages/CodeAnalysis"));
const AcademicPaper = lazy(() => import("./pages/AcademicPaper"));
const SDKDocs = lazy(() => import("./pages/SDKDocs"));
const SharedAnalysisReport = lazy(() => import("./pages/SharedAnalysisReport"));
const WhyThisMatters = lazy(() => import("./pages/WhyThisMatters"));
const InvestorPortal = lazy(() => import("./pages/InvestorPortal"));
const EarlyAccess = lazy(() => import("./pages/EarlyAccess"));
const StockPredictions = lazy(() => import("./pages/StockPredictions"));
const StrategicPlan = lazy(() => import("./pages/StrategicPlan"));
const ScalpingTerminalPage = lazy(() => import("./pages/ScalpingTerminalPage"));
const OptionsScalpingPage = lazy(() => import("./pages/OptionsScalpingPage"));
const Showcase = lazy(() => import("./pages/Showcase"));
const AdminSystemVitals = lazy(() => import("./pages/AdminSystemVitals"));
const Benchmark = lazy(() => import("./pages/Benchmark"));
const ProofCenter = lazy(() => import("./pages/ProofCenter"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

import { UniversalHeartbeatProvider } from "@/providers/UniversalHeartbeatProvider";
import { RealtimeAccuracyProvider } from "@/providers/RealtimeAccuracyProvider";
import { AutoEvolutionProvider } from "@/providers/AutoEvolutionProvider";

const App = () => (
  <ErrorBoundary componentName="App">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealtimeAccuracyProvider enabled={true}>
          <AutoEvolutionProvider autoStart={true}>
          <UniversalHeartbeatProvider autoStart={true} interval={30000}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
          <InstallPrompt />
          <LocationTracker />
          <GlobalAlertsBanner />
            <BrowserRouter>
            <ScrollToTop />
            <StructuredData />
            <DynamicMetaTags />
            <VisionRestorer />
            <BackToMarketplaceButton />
            <Routes>
              {/* ===== PUBLIC ROUTES - Chess Visualization & Code Analyzer ===== */}
              <Route path="/" element={<Index />} />
              <Route path="/my-palettes" element={<Suspense fallback={<PageLoadingSkeleton />}><MyPalettes /></Suspense>} />
              <Route path="/my-vision" element={<Suspense fallback={<PageLoadingSkeleton />}><MyVision /></Suspense>} />
              <Route path="/my-vision/:id" element={<Suspense fallback={<PageLoadingSkeleton />}><GalleryDetailRedirect /></Suspense>} />
              <Route path="/about" element={<Suspense fallback={<PageLoadingSkeleton />}><About /></Suspense>} />
              <Route path="/play" element={<Suspense fallback={<PageLoadingSkeleton />}><Play /></Suspense>} />
              <Route path="/creative-mode" element={<Suspense fallback={<PageLoadingSkeleton />}><CreativeMode /></Suspense>} />
              <Route path="/game-history" element={<Suspense fallback={<PageLoadingSkeleton />}><GameHistory /></Suspense>} />
              <Route path="/v/:shareId" element={<Suspense fallback={<PageLoadingSkeleton />}><VisualizationRedirect /></Suspense>} />
              <Route path="/g/:gameHash" element={<GameView />} />
              <Route path="/openings" element={<Suspense fallback={<PageLoadingSkeleton />}><OpeningEncyclopedia /></Suspense>} />
              <Route path="/code-analysis" element={<Suspense fallback={<PageLoadingSkeleton />}><CodeAnalysis /></Suspense>} />
              <Route path="/analysis/:id" element={<Suspense fallback={<PageLoadingSkeleton />}><SharedAnalysisReport /></Suspense>} />
              <Route path="/account" element={<Suspense fallback={<PageLoadingSkeleton />}><Account /></Suspense>} />
              <Route path="/terms" element={<Suspense fallback={<PageLoadingSkeleton />}><TermsOfService /></Suspense>} />
              <Route path="/privacy" element={<Suspense fallback={<PageLoadingSkeleton />}><PrivacyPolicy /></Suspense>} />
              <Route path="/dmca" element={<Suspense fallback={<PageLoadingSkeleton />}><DMCA /></Suspense>} />
              <Route path="/dmca/counter-notification" element={<Suspense fallback={<PageLoadingSkeleton />}><DMCACounterNotification /></Suspense>} />
              <Route path="/dmca/status" element={<Suspense fallback={<PageLoadingSkeleton />}><DMCAStatusTracking /></Suspense>} />
              
              {/* ===== CEO ONLY - All Business & Proprietary Features ===== */}
              {/* Alec Arthur Shelton (a.arthur.shelton@gmail.com) exclusive access */}
              
              {/* Marketplace & Commerce */}
              <Route path="/marketplace" element={<AdminRoute featureName="Marketplace"><Suspense fallback={<PageLoadingSkeleton />}><Marketplace /></Suspense></AdminRoute>} />
              <Route path="/marketplace/:id" element={<AdminRoute featureName="Marketplace"><Suspense fallback={<PageLoadingSkeleton />}><MarketplaceDetailRedirect /></Suspense></AdminRoute>} />
              <Route path="/order-print" element={<AdminRoute featureName="Print Orders"><Suspense fallback={<PageLoadingSkeleton />}><OrderPrint /></Suspense></AdminRoute>} />
              <Route path="/book" element={<AdminRoute featureName="Book Generator"><Suspense fallback={<PageLoadingSkeleton />}><BookGenerator /></Suspense></AdminRoute>} />
              
              {/* Analytics & Dashboards */}
              <Route path="/analytics" element={<AdminRoute featureName="Analytics"><Suspense fallback={<PageLoadingSkeleton />}><Analytics /></Suspense></AdminRoute>} />
              <Route path="/leaderboard" element={<AdminRoute featureName="Leaderboard"><Suspense fallback={<PageLoadingSkeleton />}><Leaderboard /></Suspense></AdminRoute>} />
              <Route path="/premium-analytics" element={<AdminRoute featureName="Premium Analytics"><Suspense fallback={<PageLoadingSkeleton />}><PremiumAnalytics /></Suspense></AdminRoute>} />
              <Route path="/creator-dashboard" element={<AdminRoute featureName="Creator Dashboard"><Suspense fallback={<PageLoadingSkeleton />}><CreatorDashboard /></Suspense></AdminRoute>} />
              
              {/* Business & Investor Pages */}
              <Route path="/investors" element={<AdminRoute featureName="Investors"><Suspense fallback={<PageLoadingSkeleton />}><Investors /></Suspense></AdminRoute>} />
              <Route path="/investor-portal" element={<AdminRoute featureName="Investor Portal"><Suspense fallback={<PageLoadingSkeleton />}><InvestorPortal /></Suspense></AdminRoute>} />
              <Route path="/education-fund" element={<AdminRoute featureName="Education Fund"><Suspense fallback={<PageLoadingSkeleton />}><EducationFund /></Suspense></AdminRoute>} />
              <Route path="/news" element={<AdminRoute featureName="News"><Suspense fallback={<PageLoadingSkeleton />}><News /></Suspense></AdminRoute>} />
              <Route path="/why-this-matters" element={<AdminRoute featureName="Why This Matters"><Suspense fallback={<PageLoadingSkeleton />}><WhyThisMatters /></Suspense></AdminRoute>} />
              <Route path="/early-access" element={<AdminRoute featureName="Early Access"><Suspense fallback={<PageLoadingSkeleton />}><EarlyAccess /></Suspense></AdminRoute>} />
              <Route path="/showcase" element={<AdminRoute featureName="Showcase"><Suspense fallback={<PageLoadingSkeleton />}><Showcase /></Suspense></AdminRoute>} />
              <Route path="/qr-preview" element={<AdminRoute featureName="QR Preview"><Suspense fallback={<PageLoadingSkeleton />}><QRMockup /></Suspense></AdminRoute>} />
              
              {/* Academic & Documentation */}
              <Route path="/academic-paper" element={<AdminRoute featureName="Academic Paper"><Suspense fallback={<PageLoadingSkeleton />}><AcademicPaper /></Suspense></AdminRoute>} />
              <Route path="/sdk-docs" element={<AdminRoute featureName="SDK Documentation"><Suspense fallback={<PageLoadingSkeleton />}><SDKDocs /></Suspense></AdminRoute>} />
              
              {/* Vision Scanner */}
              <Route path="/vision-scanner" element={<AdminRoute featureName="Vision Scanner"><Suspense fallback={<PageLoadingSkeleton />}><VisionScannerPage /></Suspense></AdminRoute>} />
              
              {/* En Pensent Proprietary Trading & Predictions */}
              <Route path="/stock-predictions" element={<AdminRoute featureName="Stock Predictions"><Suspense fallback={<PageLoadingSkeleton />}><StockPredictions /></Suspense></AdminRoute>} />
              <Route path="/strategic-plan" element={<AdminRoute featureName="Strategic Plan"><Suspense fallback={<PageLoadingSkeleton />}><StrategicPlan /></Suspense></AdminRoute>} />
              <Route path="/trading" element={<AdminRoute featureName="Trading Terminal"><Suspense fallback={<PageLoadingSkeleton />}><ScalpingTerminalPage /></Suspense></AdminRoute>} />
              <Route path="/options" element={<AdminRoute featureName="Options Scalping"><Suspense fallback={<PageLoadingSkeleton />}><OptionsScalpingPage /></Suspense></AdminRoute>} />
              <Route path="/benchmark" element={<AdminRoute featureName="Benchmark"><Suspense fallback={<PageLoadingSkeleton />}><Benchmark /></Suspense></AdminRoute>} />
              <Route path="/proof" element={<AdminRoute featureName="Proof Center"><Suspense fallback={<PageLoadingSkeleton />}><ProofCenter /></Suspense></AdminRoute>} />
              
              {/* Admin Control Center */}
              <Route path="/admin/ceo-dashboard" element={<AdminRoute featureName="CEO Dashboard"><Suspense fallback={<PageLoadingSkeleton />}><AdminCEODashboard /></Suspense></AdminRoute>} />
              <Route path="/admin/system-vitals" element={<AdminRoute featureName="System Vitals"><Suspense fallback={<PageLoadingSkeleton />}><AdminSystemVitals /></Suspense></AdminRoute>} />
              <Route path="/admin/seed-marketplace" element={<AdminRoute featureName="Seed Marketplace"><Suspense fallback={<PageLoadingSkeleton />}><AdminSeedMarketplace /></Suspense></AdminRoute>} />
              <Route path="/admin/palettes" element={<AdminRoute featureName="Palette Admin"><Suspense fallback={<PageLoadingSkeleton />}><PaletteAdminPage /></Suspense></AdminRoute>} />
              <Route path="/admin/moderation" element={<AdminRoute featureName="Moderation"><Suspense fallback={<PageLoadingSkeleton />}><AdminModeration /></Suspense></AdminRoute>} />
              <Route path="/admin/economics" element={<AdminRoute featureName="Economics"><Suspense fallback={<PageLoadingSkeleton />}><AdminEconomics /></Suspense></AdminRoute>} />
              <Route path="/admin/withdrawals" element={<AdminRoute featureName="Withdrawals"><Suspense fallback={<PageLoadingSkeleton />}><AdminWithdrawals /></Suspense></AdminRoute>} />
              <Route path="/admin/dmca" element={<AdminRoute featureName="DMCA Admin"><Suspense fallback={<PageLoadingSkeleton />}><AdminDMCA /></Suspense></AdminRoute>} />
              <Route path="/admin/watermark-verification" element={<AdminRoute featureName="Watermark Verification"><Suspense fallback={<PageLoadingSkeleton />}><AdminWatermarkVerification /></Suspense></AdminRoute>} />
              <Route path="/admin/batch-watermark-verification" element={<AdminRoute featureName="Batch Watermark Verification"><Suspense fallback={<PageLoadingSkeleton />}><AdminBatchWatermarkVerification /></Suspense></AdminRoute>} />
              <Route path="/admin/ai-art-bank" element={<AdminRoute featureName="AI Art Bank"><Suspense fallback={<PageLoadingSkeleton />}><AdminAIArtBank /></Suspense></AdminRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<Suspense fallback={<PageLoadingSkeleton />}><NotFound /></Suspense>} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </UniversalHeartbeatProvider>
        </AutoEvolutionProvider>
        </RealtimeAccuracyProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
