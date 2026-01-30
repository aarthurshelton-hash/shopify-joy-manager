/**
 * @license
 * Copyright (c) 2024-2026 En Pensent LLC. All Rights Reserved.
 * Proprietary and Confidential - Natural Vision™ Technology
 */

import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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
import { preloadRoutes } from "@/lib/device/adaptiveRouting";
import { PageLoadingFallback } from "@/components/shared/PageLoadingFallback";

// Critical routes - loaded eagerly
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// High priority routes - lazy loaded with preloading
const MyPalettes = lazy(() => import("./pages/MyPalettes"));
const MyVision = lazy(() => import("./pages/MyVision"));
const CreativeMode = lazy(() => import("./pages/CreativeMode"));
const Play = lazy(() => import("./pages/Play"));

// Medium priority routes
const About = lazy(() => import("./pages/About"));
const Account = lazy(() => import("./pages/Account"));
const GameHistory = lazy(() => import("./pages/GameHistory"));
const OpeningEncyclopedia = lazy(() => import("./pages/OpeningEncyclopedia"));
const CodeAnalysis = lazy(() => import("./pages/CodeAnalysis"));
const GameView = lazy(() => import("./pages/GameView"));
const SharedAnalysisReport = lazy(() => import("./pages/SharedAnalysisReport"));

// Low priority routes
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const DMCA = lazy(() => import("./pages/DMCA"));
const DMCACounterNotification = lazy(() => import("./pages/DMCACounterNotification"));
const DMCAStatusTracking = lazy(() => import("./pages/DMCAStatusTracking"));

// Redirect pages
const VisualizationRedirect = lazy(() => import("./pages/VisualizationRedirect"));
const GalleryDetailRedirect = lazy(() => import("./pages/GalleryDetailRedirect"));
const MarketplaceDetailRedirect = lazy(() => import("./pages/MarketplaceDetailRedirect"));

// Admin/CEO routes - always lazy loaded
const Investors = lazy(() => import("./pages/Investors"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const News = lazy(() => import("./pages/News"));
const QRMockup = lazy(() => import("./pages/QRMockup"));
const OrderPrint = lazy(() => import("./pages/OrderPrint"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const AdminSeedMarketplace = lazy(() => import("./pages/AdminSeedMarketplace"));
const PaletteAdminPage = lazy(() => import("./components/admin/PaletteAdminPage"));
const AdminModeration = lazy(() => import("./pages/AdminModeration"));
const AdminEconomics = lazy(() => import("./pages/AdminEconomics"));
const BookGenerator = lazy(() => import("./pages/BookGenerator"));
const EducationFund = lazy(() => import("./pages/EducationFund"));
const CreatorDashboard = lazy(() => import("./pages/CreatorDashboard"));
const AdminWithdrawals = lazy(() => import("./pages/AdminWithdrawals"));
const AdminDMCA = lazy(() => import("./pages/AdminDMCA"));
const AdminWatermarkVerification = lazy(() => import("./pages/AdminWatermarkVerification"));
const AdminBatchWatermarkVerification = lazy(() => import("./pages/AdminBatchWatermarkVerification"));
const VisionScannerPage = lazy(() => import("./pages/VisionScannerPage"));
const PremiumAnalytics = lazy(() => import("./pages/PremiumAnalytics"));
const AdminCEODashboard = lazy(() => import("./pages/AdminCEODashboard"));
const AdminAIArtBank = lazy(() => import("./pages/AdminAIArtBank"));
const AcademicPaper = lazy(() => import("./pages/AcademicPaper"));
const SDKDocs = lazy(() => import("./pages/SDKDocs"));
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

import { UniversalHeartbeatProvider } from "@/providers/UniversalHeartbeatProvider";
import { RealtimeAccuracyProvider } from "@/providers/RealtimeAccuracyProvider";
import { AutoEvolutionProvider } from "@/providers/AutoEvolutionProvider";

// Route preloader component
function RoutePreloader() {
  const location = useLocation();
  
  useEffect(() => {
    // Preload related routes after current page loads
    const timeoutId = setTimeout(() => {
      preloadRoutes(location.pathname);
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);
  
  return null;
}

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
            <StructuredData />
            <DynamicMetaTags />
            <VisionRestorer />
            <BackToMarketplaceButton />
            <RoutePreloader />
            <Suspense fallback={<PageLoadingFallback />}>
              <Routes>
                {/* ===== PUBLIC ROUTES - Chess Visualization & Code Analyzer ===== */}
                <Route path="/" element={<Index />} />
                <Route path="/my-palettes" element={<MyPalettes />} />
                <Route path="/my-vision" element={<MyVision />} />
                <Route path="/my-vision/:id" element={<GalleryDetailRedirect />} />
                <Route path="/about" element={<About />} />
                <Route path="/play" element={<Play />} />
                <Route path="/creative-mode" element={<CreativeMode />} />
                <Route path="/game-history" element={<GameHistory />} />
                <Route path="/v/:shareId" element={<VisualizationRedirect />} />
                <Route path="/g/:gameHash" element={<GameView />} />
                <Route path="/openings" element={<OpeningEncyclopedia />} />
                <Route path="/code-analysis" element={<CodeAnalysis />} />
                <Route path="/analysis/:id" element={<SharedAnalysisReport />} />
                <Route path="/account" element={<Account />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/dmca" element={<DMCA />} />
                <Route path="/dmca/counter-notification" element={<DMCACounterNotification />} />
                <Route path="/dmca/status" element={<DMCAStatusTracking />} />
                
                {/* ===== CEO ONLY - All Business & Proprietary Features ===== */}
                
                {/* Marketplace & Commerce */}
                <Route path="/marketplace" element={<AdminRoute featureName="Marketplace"><Marketplace /></AdminRoute>} />
                <Route path="/marketplace/:id" element={<AdminRoute featureName="Marketplace"><MarketplaceDetailRedirect /></AdminRoute>} />
                <Route path="/order-print" element={<AdminRoute featureName="Print Orders"><OrderPrint /></AdminRoute>} />
                <Route path="/book" element={<AdminRoute featureName="Book Generator"><BookGenerator /></AdminRoute>} />
                
                {/* Analytics & Dashboards */}
                <Route path="/analytics" element={<AdminRoute featureName="Analytics"><Analytics /></AdminRoute>} />
                <Route path="/leaderboard" element={<AdminRoute featureName="Leaderboard"><Leaderboard /></AdminRoute>} />
                <Route path="/premium-analytics" element={<AdminRoute featureName="Premium Analytics"><PremiumAnalytics /></AdminRoute>} />
                <Route path="/creator-dashboard" element={<AdminRoute featureName="Creator Dashboard"><CreatorDashboard /></AdminRoute>} />
                
                {/* Business & Investor Pages */}
                <Route path="/investors" element={<AdminRoute featureName="Investors"><Investors /></AdminRoute>} />
                <Route path="/investor-portal" element={<AdminRoute featureName="Investor Portal"><InvestorPortal /></AdminRoute>} />
                <Route path="/education-fund" element={<AdminRoute featureName="Education Fund"><EducationFund /></AdminRoute>} />
                <Route path="/news" element={<AdminRoute featureName="News"><News /></AdminRoute>} />
                <Route path="/why-this-matters" element={<AdminRoute featureName="Why This Matters"><WhyThisMatters /></AdminRoute>} />
                <Route path="/early-access" element={<AdminRoute featureName="Early Access"><EarlyAccess /></AdminRoute>} />
                <Route path="/showcase" element={<AdminRoute featureName="Showcase"><Showcase /></AdminRoute>} />
                <Route path="/qr-preview" element={<AdminRoute featureName="QR Preview"><QRMockup /></AdminRoute>} />
                
                {/* Academic & Documentation */}
                <Route path="/academic-paper" element={<AdminRoute featureName="Academic Paper"><AcademicPaper /></AdminRoute>} />
                <Route path="/sdk-docs" element={<AdminRoute featureName="SDK Documentation"><SDKDocs /></AdminRoute>} />
                
                {/* Vision Scanner */}
                <Route path="/vision-scanner" element={<AdminRoute featureName="Vision Scanner"><VisionScannerPage /></AdminRoute>} />
                
                {/* En Pensent Proprietary Trading & Predictions */}
                <Route path="/stock-predictions" element={<AdminRoute featureName="Stock Predictions"><StockPredictions /></AdminRoute>} />
                <Route path="/strategic-plan" element={<AdminRoute featureName="Strategic Plan"><StrategicPlan /></AdminRoute>} />
                <Route path="/trading" element={<AdminRoute featureName="Trading Terminal"><ScalpingTerminalPage /></AdminRoute>} />
                <Route path="/options" element={<AdminRoute featureName="Options Scalping"><OptionsScalpingPage /></AdminRoute>} />
                <Route path="/benchmark" element={<AdminRoute featureName="Benchmark"><Benchmark /></AdminRoute>} />
                <Route path="/proof" element={<AdminRoute featureName="Proof Center"><ProofCenter /></AdminRoute>} />
                
                {/* Admin Control Center */}
                <Route path="/admin/ceo-dashboard" element={<AdminRoute featureName="CEO Dashboard"><AdminCEODashboard /></AdminRoute>} />
                <Route path="/admin/system-vitals" element={<AdminRoute featureName="System Vitals"><AdminSystemVitals /></AdminRoute>} />
                <Route path="/admin/seed-marketplace" element={<AdminRoute featureName="Seed Marketplace"><AdminSeedMarketplace /></AdminRoute>} />
                <Route path="/admin/palettes" element={<AdminRoute featureName="Palette Admin"><PaletteAdminPage /></AdminRoute>} />
                <Route path="/admin/moderation" element={<AdminRoute featureName="Moderation"><AdminModeration /></AdminRoute>} />
                <Route path="/admin/economics" element={<AdminRoute featureName="Economics"><AdminEconomics /></AdminRoute>} />
                <Route path="/admin/withdrawals" element={<AdminRoute featureName="Withdrawals"><AdminWithdrawals /></AdminRoute>} />
                <Route path="/admin/dmca" element={<AdminRoute featureName="DMCA Admin"><AdminDMCA /></AdminRoute>} />
                <Route path="/admin/watermark-verification" element={<AdminRoute featureName="Watermark Verification"><AdminWatermarkVerification /></AdminRoute>} />
                <Route path="/admin/batch-watermark-verification" element={<AdminRoute featureName="Batch Watermark Verification"><AdminBatchWatermarkVerification /></AdminRoute>} />
                <Route path="/admin/ai-art-bank" element={<AdminRoute featureName="AI Art Bank"><AdminAIArtBank /></AdminRoute>} />
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
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
