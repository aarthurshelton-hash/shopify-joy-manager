import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { LocationTracker } from "@/components/shared/LocationTracker";
import Index from "./pages/Index";
import MyPalettes from "./pages/MyPalettes";
import MyVision from "./pages/MyVision";
import VisualizationDetail from "./pages/VisualizationDetail";
import About from "./pages/About";
import Investors from "./pages/Investors";
import Analytics from "./pages/Analytics";
import Leaderboard from "./pages/Leaderboard";
import Play from "./pages/Play";
import CreativeMode from "./pages/CreativeMode";
import GameHistory from "./pages/GameHistory";
import News from "./pages/News";
import QRMockup from "./pages/QRMockup";
import VisualizationView from "./pages/VisualizationView";
import OrderPrint from "./pages/OrderPrint";
import Marketplace from "./pages/Marketplace";
import MarketplaceVisionDetail from "./pages/MarketplaceVisionDetail";
import AdminSeedMarketplace from "./pages/AdminSeedMarketplace";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <InstallPrompt />
        <LocationTracker />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/my-palettes" element={<MyPalettes />} />
            <Route path="/my-vision" element={<MyVision />} />
            <Route path="/my-vision/:id" element={<VisualizationDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/play" element={<Play />} />
            <Route path="/creative-mode" element={<CreativeMode />} />
            <Route path="/game-history" element={<GameHistory />} />
            <Route path="/news" element={<News />} />
            <Route path="/qr-preview" element={<QRMockup />} />
            <Route path="/v/:shareId" element={<VisualizationView />} />
            <Route path="/order-print" element={<OrderPrint />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/:id" element={<MarketplaceVisionDetail />} />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
