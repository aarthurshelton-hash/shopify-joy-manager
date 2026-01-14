import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  Sun, 
  Moon, 
  Package,
  Crown,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { ProductSelector } from '@/components/shop/ProductSelector';
import { usePrintOrderStore, PrintOrderData } from '@/stores/printOrderStore';
import PrintReadyVisualization from '@/components/chess/PrintReadyVisualization';
import GameInfoDisplay from '@/components/chess/GameInfoDisplay';
import { SquareData } from '@/lib/chess/gameSimulator';
import enPensentLogo from '@/assets/en-pensent-logo-new.png';

/**
 * Filter board data to match a specific move in the timeline
 */
function filterBoardToMove(board: SquareData[][], currentMove: number): SquareData[][] {
  if (currentMove === Infinity || currentMove <= 0) return board;
  
  return board.map(row => 
    row.map(square => ({
      ...square,
      visits: square.visits.filter(visit => visit.moveNumber <= currentMove)
    }))
  );
}

// Location state from marketplace navigation
interface MarketplaceNavState {
  fromMarketplace?: boolean;
  visualizationId?: string;
  title?: string;
  imageUrl?: string;
}

const OrderPrint: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderData: storeOrderData, setOrderData, clearOrderData } = usePrintOrderStore();
  const [darkMode, setDarkMode] = useState(false);

  // Check for marketplace navigation state
  const navState = location.state as MarketplaceNavState | null;
  
  // Build order data from either store or navigation state
  const orderData = useMemo(() => {
    // If we have store data, use that
    if (storeOrderData) return storeOrderData;
    
    // If we came from marketplace with state, construct order data
    if (navState?.fromMarketplace && navState.title) {
      const marketplaceOrder: PrintOrderData = {
        visualizationId: navState.visualizationId,
        imagePath: navState.imageUrl,
        title: navState.title || 'Chess Visualization',
        gameData: {
          white: 'White',
          black: 'Black',
        },
        returnPath: `/marketplace/${navState.visualizationId}`,
      };
      return marketplaceOrder;
    }
    
    return null;
  }, [storeOrderData, navState]);

  // Redirect if no order data
  useEffect(() => {
    if (!orderData) {
      navigate('/', { replace: true });
    }
  }, [orderData, navigate]);

  if (!orderData) {
    return null;
  }

  const hasEnPensentData = orderData.moveHistory && orderData.whitePalette && orderData.blackPalette;
  const hasSimulation = !!orderData.simulation;
  const hasImagePath = !!orderData.imagePath;

  // Prepare simulation for ProductSelector - apply captured state filtering
  const simulationForCart = orderData.simulation;
  
  // Apply captured state filtering to the display board
  const displayBoard = useMemo(() => {
    if (!orderData.simulation) return null;
    
    const capturedState = orderData.capturedState;
    if (capturedState && capturedState.currentMove !== Infinity && capturedState.currentMove > 0) {
      return filterBoardToMove(orderData.simulation.board, capturedState.currentMove);
    }
    return orderData.simulation.board;
  }, [orderData.simulation, orderData.capturedState]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button & Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button 
            variant="ghost" 
            onClick={() => {
              if (orderData.returnPath) {
                navigate(orderData.returnPath);
              } else {
                navigate(-1);
              }
            }}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Package className="h-6 w-6 text-stone-900" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold">Order Premium Print</h1>
              <p className="text-muted-foreground text-sm">Turn your chess art into museum-quality wall art</p>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Preview Column */}
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                {/* Mode Toggle for En Pensent visualization */}
                {hasEnPensentData && (
                  <div className="flex justify-center gap-2 mb-4">
                    <Button
                      variant={darkMode ? "outline" : "default"}
                      size="sm"
                      onClick={() => setDarkMode(false)}
                      className="gap-2 text-xs"
                    >
                      <Sun className="h-3 w-3" />
                      Light
                    </Button>
                    <Button
                      variant={darkMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDarkMode(true)}
                      className="gap-2 text-xs"
                    >
                      <Moon className="h-3 w-3" />
                      Dark
                    </Button>
                  </div>
                )}

                {/* Visualization Preview - using unified PrintReadyVisualization */}
                <div className="flex justify-center">
                  {hasSimulation && displayBoard ? (
                    // Full simulation visualization - includes highlight state for exact match
                    <PrintReadyVisualization 
                      board={displayBoard}
                      gameData={{
                        ...orderData.simulation!.gameData,
                        moves: orderData.simulation!.gameData.moves,
                      }}
                      size={400}
                      darkMode={darkMode}
                      title={orderData.title}
                      compact={false}
                      highlightState={orderData.capturedState?.lockedPieces && orderData.capturedState.lockedPieces.length > 0 ? {
                        lockedPieces: orderData.capturedState.lockedPieces.map(p => ({
                          pieceType: p.pieceType as 'k' | 'q' | 'r' | 'b' | 'n' | 'p',
                          pieceColor: (p.pieceColor === 'white' ? 'w' : p.pieceColor === 'black' ? 'b' : p.pieceColor) as 'w' | 'b',
                        })),
                        compareMode: orderData.capturedState.compareMode || false,
                      } : undefined}
                    />
                  ) : hasEnPensentData ? (
                    // En Pensent live game visualization - unified component
                    <PrintReadyVisualization 
                      enPensentData={{
                        moveHistory: orderData.moveHistory!,
                        whitePalette: orderData.whitePalette!,
                        blackPalette: orderData.blackPalette!,
                      }}
                      gameData={{
                        white: orderData.gameData.white,
                        black: orderData.gameData.black,
                        event: orderData.gameData.event || 'Chess Game',
                        date: orderData.gameData.date || '',
                        result: orderData.gameData.result || '',
                      }}
                      size={400}
                      darkMode={darkMode}
                      title={orderData.title}
                      compact={false}
                    />
                  ) : hasImagePath ? (
                    // Saved visualization from gallery
                    <div 
                      className={`p-6 rounded-lg border shadow-xl ${
                        darkMode 
                          ? 'bg-[#0A0A0A] border-stone-800' 
                          : 'bg-[#FDFCFB] border-stone-200'
                      }`}
                    >
                      <img 
                        src={orderData.imagePath} 
                        alt={orderData.title}
                        className="w-72 h-72 sm:w-80 sm:h-80 object-contain"
                      />
                      <GameInfoDisplay 
                        gameData={{
                          white: orderData.gameData.white,
                          black: orderData.gameData.black,
                          event: orderData.gameData.event || 'Chess Game',
                          date: orderData.gameData.date || '',
                          result: orderData.gameData.result || '',
                          moves: [],
                          pgn: '',
                        }}
                        darkMode={darkMode}
                      />
                      <p 
                        className={`text-center text-[10px] tracking-[0.3em] uppercase mt-4 ${
                          darkMode ? 'text-stone-600' : 'text-stone-400'
                        }`}
                      >
                        ♔ En Pensent ♚
                      </p>
                    </div>
                  ) : (
                    // Fallback placeholder
                    <div className="w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center bg-muted/20 rounded">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Game Title */}
                <div className="mt-6 text-center space-y-2">
                  <h2 className="text-lg font-display font-semibold">{orderData.title}</h2>
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    <span>Unique chess art visualization</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Premium Print Benefits */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Crown className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Premium Print Features</span>
                </div>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    Museum-quality archival paper (100+ year color guarantee)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    Vibrant, fade-resistant giclée inks
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    Worldwide shipping with tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    Optional artistic QR code linking to game replay
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Product Selector Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ProductSelector
              customPrintData={{
                pgn: orderData.pgn || '',
                gameTitle: orderData.title,
                previewImageBase64: orderData.imagePath,
              }}
              simulation={simulationForCart}
              shareId={orderData.shareId}
              capturedState={{
                ...orderData.capturedState,
                darkMode, // Use current page dark mode setting
              }}
              enPensentData={hasEnPensentData ? {
                moveHistory: orderData.moveHistory!,
                whitePalette: orderData.whitePalette!,
                blackPalette: orderData.blackPalette!,
                gameInfo: orderData.gameData,
              } : undefined}
              onAddedToCart={() => {
                // Optional: could navigate to cart or show success
              }}
            />
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderPrint;
