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
import Index from "./pages/Index";
import MyPalettes from "./pages/MyPalettes";
import MyVision from "./pages/MyVision";
import About from "./pages/About";
import Investors from "./pages/Investors";
import Analytics from "./pages/Analytics";
import Leaderboard from "./pages/Leaderboard";
import Play from "./pages/Play";
import CreativeMode from "./pages/CreativeMode";
import GameHistory from "./pages/GameHistory";
import News from "./pages/News";
import QRMockup from "./pages/QRMockup";
import GameView from "./pages/GameView";
import OrderPrint from "./pages/OrderPrint";
import Marketplace from "./pages/Marketplace";
import AdminSeedMarketplace from "./pages/AdminSeedMarketplace";
// Redirect pages for canonical URL unification
import VisualizationRedirect from "./pages/VisualizationRedirect";
import GalleryDetailRedirect from "./pages/GalleryDetailRedirect";
import MarketplaceDetailRedirect from "./pages/MarketplaceDetailRedirect";
import PaletteAdminPage from "./components/admin/PaletteAdminPage";
import AdminModeration from "./pages/AdminModeration";
import AdminEconomics from "./pages/AdminEconomics";
import Account from "./pages/Account";
import BookGenerator from "./pages/BookGenerator";
import EducationFund from "./pages/EducationFund";
import CreatorDashboard from "./pages/CreatorDashboard";
import AdminWithdrawals from "./pages/AdminWithdrawals";
import AdminDMCA from "./pages/AdminDMCA";
import AdminWatermarkVerification from "./pages/AdminWatermarkVerification";
import AdminBatchWatermarkVerification from "./pages/AdminBatchWatermarkVerification";
import DMCACounterNotification from "./pages/DMCACounterNotification";
import DMCAStatusTracking from "./pages/DMCAStatusTracking";
import VisionScannerPage from "./pages/VisionScannerPage";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import DMCA from "./pages/DMCA";
import PremiumAnalytics from "./pages/PremiumAnalytics";
import AdminCEODashboard from "./pages/AdminCEODashboard";
import AdminAIArtBank from "./pages/AdminAIArtBank";
import OpeningEncyclopedia from "./pages/OpeningEncyclopedia";
import CodeAnalysis from "./pages/CodeAnalysis";
import AcademicPaper from "./pages/AcademicPaper";
import SDKDocs from "./pages/SDKDocs";
import SharedAnalysisReport from "./pages/SharedAnalysisReport";
import WhyThisMatters from "./pages/WhyThisMatters";
import InvestorPortal from "./pages/InvestorPortal";
import EarlyAccess from "./pages/EarlyAccess";
import StockPredictions from "./pages/StockPredictions";
import StrategicPlan from "./pages/StrategicPlan";
import ScalpingTerminalPage from "./pages/ScalpingTerminalPage";
import OptionsScalpingPage from "./pages/OptionsScalpingPage";
import Showcase from "./pages/Showcase";
import AdminSystemVitals from "./pages/AdminSystemVitals";
import Benchmark from "./pages/Benchmark";
import ProofCenter from "./pages/ProofCenter";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
            <StructuredData />
            <DynamicMetaTags />
            <VisionRestorer />
            <VisionRestorer />
            <BackToMarketplaceButton />
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
              {/* Alec Arthur Shelton (a.arthur.shelton@gmail.com) exclusive access */}
              
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
