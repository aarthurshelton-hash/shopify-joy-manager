import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import MyPalettes from "./pages/MyPalettes";
import MyVision from "./pages/MyVision";
import About from "./pages/About";
import Investors from "./pages/Investors";
import Analytics from "./pages/Analytics";
import Leaderboard from "./pages/Leaderboard";
import News from "./pages/News";
import QRMockup from "./pages/QRMockup";
import VisualizationView from "./pages/VisualizationView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/my-palettes" element={<MyPalettes />} />
            <Route path="/my-vision" element={<MyVision />} />
            <Route path="/about" element={<About />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/news" element={<News />} />
            <Route path="/qr-preview" element={<QRMockup />} />
            <Route path="/v/:shareId" element={<VisualizationView />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
