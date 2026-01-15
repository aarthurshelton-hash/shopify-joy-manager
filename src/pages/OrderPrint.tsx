import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Sparkles, 
  Sun, 
  Moon, 
  Package,
  Crown,
  Image as ImageIcon,
  ShoppingCart,
  Check,
  Palette,
  Swords,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/shop/Header';
import { Footer } from '@/components/shop/Footer';
import { ProductSelector } from '@/components/shop/ProductSelector';
import { usePrintOrderStore, PrintOrderData } from '@/stores/printOrderStore';
import { useCartStore } from '@/stores/cartStore';
import PrintReadyVisualization from '@/components/chess/PrintReadyVisualization';
import GameInfoDisplay from '@/components/chess/GameInfoDisplay';
import { SquareData } from '@/lib/chess/gameSimulator';
import { getPaletteArt, getPaletteDisplayName, isPremiumPalette } from '@/lib/marketplace/paletteArtMap';
import { getGameImage } from '@/lib/chess/gameImages';
import { detectGameCard, GameCardMatch } from '@/lib/chess/gameCardDetection';
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

  // Get palette and game card artwork for banners
  const paletteArt = useMemo(() => getPaletteArt(orderData.paletteId), [orderData.paletteId]);
  const paletteName = useMemo(() => getPaletteDisplayName(orderData.paletteId), [orderData.paletteId]);
  const isPremiumPaletteFlag = useMemo(() => isPremiumPalette(orderData.paletteId), [orderData.paletteId]);
  
  // Get game card artwork - either from stored gameId or by detecting from PGN
  const gameCardArt = useMemo(() => {
    // First try direct lookup by gameId
    if (orderData.gameId) {
      const art = getGameImage(orderData.gameId);
      if (art) return art;
    }
    // Otherwise detect from PGN
    if (orderData.pgn) {
      const match = detectGameCard(orderData.pgn);
      if (match.isMatch && match.matchedGame) {
        return getGameImage(match.matchedGame.id);
      }
    }
    return null;
  }, [orderData.gameId, orderData.pgn]);
  
  // Get game card match info for display
  const gameCardMatch = useMemo(() => {
    if (orderData.pgn) {
      return detectGameCard(orderData.pgn);
    }
    return null;
  }, [orderData.pgn]);
  
  // Check if this item is already in cart
  const cartItems = useCartStore(state => state.items);
  const isInCart = useMemo(() => {
    return cartItems.some(item => 
      item.customPrintData?.gameHash === orderData.gameHash &&
      item.customPrintData?.paletteId === orderData.paletteId
    );
  }, [cartItems, orderData.gameHash, orderData.paletteId]);
  
  // Count similar items in cart (same game, different sizes/frames)
  const cartItemCount = useMemo(() => {
    return cartItems.filter(item => 
      item.customPrintData?.gameHash === orderData.gameHash
    ).reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems, orderData.gameHash]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Game Card / Palette Hero Banner */}
        <AnimatePresence>
          {(gameCardArt || paletteArt) && (
            <motion.div 
              className="relative h-32 md:h-40 -mx-4 mb-6 overflow-hidden rounded-xl mx-0"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <img 
                src={gameCardArt || paletteArt!} 
                alt="Vision Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              
              {/* Banner Content */}
              <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                <div className="space-y-1">
                  {gameCardMatch?.isMatch && gameCardMatch.matchedGame && (
                    <div className="flex items-center gap-2">
                      <Swords className="h-4 w-4 text-white/90" />
                      <span className="text-sm font-medium text-white/90">
                        Famous Game Card
                      </span>
                      <Badge className="bg-amber-500/90 text-stone-900 text-[10px] px-1.5">
                        {gameCardMatch.matchType === 'exact' ? 'Exact Match' : 'Partial Match'}
                      </Badge>
                    </div>
                  )}
                  {paletteArt && paletteName && (
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-white/90" />
                      <span className="text-sm font-medium text-white/90">
                        {paletteName} Palette
                      </span>
                      {isPremiumPaletteFlag && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-stone-900 text-[10px] px-1.5 border-0">
                          Premium
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Cart indicator on banner */}
                {cartItemCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-lg"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>{cartItemCount} in cart</span>
                    <Check className="h-3 w-3" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
          
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Package className="h-6 w-6 text-stone-900" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-display font-bold">Order Premium Print</h1>
                <p className="text-muted-foreground text-sm">Turn your chess art into museum-quality wall art</p>
              </div>
            </div>
            
            {/* Mobile cart indicator */}
            {cartItemCount > 0 && !(gameCardArt || paletteArt) && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-xs font-medium"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                <span>{cartItemCount}</span>
              </motion.div>
            )}
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
                      darkMode={orderData.capturedState?.darkMode ?? darkMode}
                      title={orderData.title}
                      compact={false}
                      pgn={orderData.pgn}
                      highlightState={orderData.capturedState?.lockedPieces && orderData.capturedState.lockedPieces.length > 0 ? {
                        lockedPieces: orderData.capturedState.lockedPieces.map(p => ({
                          pieceType: p.pieceType as 'k' | 'q' | 'r' | 'b' | 'n' | 'p',
                          pieceColor: (p.pieceColor === 'white' ? 'w' : p.pieceColor === 'black' ? 'b' : p.pieceColor) as 'w' | 'b',
                        })),
                        compareMode: orderData.capturedState.compareMode || false,
                      } : undefined}
                      piecesState={orderData.capturedState?.showPieces ? {
                        showPieces: true,
                        pieceOpacity: orderData.capturedState.pieceOpacity ?? 0.7,
                        currentMoveNumber: orderData.capturedState.currentMove,
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
                gameHash: orderData.gameHash,
                gameId: orderData.gameId,
                paletteId: orderData.paletteId,
                gameData: orderData.gameData,
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
