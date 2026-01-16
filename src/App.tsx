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
import Showcase from "./pages/Showcase";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

import { UniversalHeartbeatProvider } from "@/providers/UniversalHeartbeatProvider";
import { RealtimeAccuracyProvider } from "@/providers/RealtimeAccuracyProvider";

const App = () => (
  <ErrorBoundary componentName="App">
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealtimeAccuracyProvider enabled={true}>
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
              <Route path="/" element={<Index />} />
              <Route path="/my-palettes" element={<MyPalettes />} />
              <Route path="/my-vision" element={<MyVision />} />
              <Route path="/my-vision/:id" element={<GalleryDetailRedirect />} />
              <Route path="/about" element={<About />} />
              <Route path="/investors" element={<Investors />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/play" element={<Play />} />
              <Route path="/creative-mode" element={<CreativeMode />} />
              <Route path="/game-history" element={<GameHistory />} />
              <Route path="/news" element={<News />} />
              <Route path="/qr-preview" element={<QRMockup />} />
              <Route path="/v/:shareId" element={<VisualizationRedirect />} />
              <Route path="/g/:gameHash" element={<GameView />} />
              <Route path="/order-print" element={<OrderPrint />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/marketplace/:id" element={<MarketplaceDetailRedirect />} />
              <Route path="/admin/seed-marketplace" element={<AdminSeedMarketplace />} />
              <Route path="/admin/palettes" element={<PaletteAdminPage />} />
              <Route path="/admin/moderation" element={<AdminModeration />} />
              <Route path="/admin/economics" element={<AdminEconomics />} />
              <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
              <Route path="/admin/dmca" element={<AdminDMCA />} />
              <Route path="/admin/watermark-verification" element={<AdminWatermarkVerification />} />
              <Route path="/admin/batch-watermark-verification" element={<AdminBatchWatermarkVerification />} />
              <Route path="/account" element={<Account />} />
              <Route path="/book" element={<BookGenerator />} />
              <Route path="/education-fund" element={<EducationFund />} />
              <Route path="/creator-dashboard" element={<CreatorDashboard />} />
              <Route path="/vision-scanner" element={<VisionScannerPage />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/dmca" element={<DMCA />} />
              <Route path="/dmca/counter-notification" element={<DMCACounterNotification />} />
              <Route path="/dmca/status" element={<DMCAStatusTracking />} />
              <Route path="/premium-analytics" element={<PremiumAnalytics />} />
              <Route path="/admin/ceo-dashboard" element={<AdminCEODashboard />} />
              <Route path="/admin/ai-art-bank" element={<AdminAIArtBank />} />
              <Route path="/openings" element={<OpeningEncyclopedia />} />
              <Route path="/code-analysis" element={<CodeAnalysis />} />
              <Route path="/academic-paper" element={<AcademicPaper />} />
              <Route path="/sdk-docs" element={<SDKDocs />} />
              <Route path="/analysis/:id" element={<SharedAnalysisReport />} />
              <Route path="/why-this-matters" element={<WhyThisMatters />} />
              <Route path="/investor-portal" element={<InvestorPortal />} />
              <Route path="/early-access" element={<EarlyAccess />} />
              <Route path="/showcase" element={<Showcase />} />
              
              {/* ADMIN ONLY - Private En Pensent Features */}
              <Route path="/stock-predictions" element={<AdminRoute featureName="Stock Predictions"><StockPredictions /></AdminRoute>} />
              <Route path="/strategic-plan" element={<AdminRoute featureName="Strategic Plan"><StrategicPlan /></AdminRoute>} />
              <Route path="/trading" element={<AdminRoute featureName="Trading Terminal"><ScalpingTerminalPage /></AdminRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </UniversalHeartbeatProvider>
        </RealtimeAccuracyProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
