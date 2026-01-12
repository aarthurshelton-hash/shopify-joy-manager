import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Loader2, Check, Frame, Sofa, Briefcase, Image } from 'lucide-react';
import { fetchProducts, type ShopifyProduct } from '@/lib/shopify/api';
import { useCartStore, type CartItem } from '@/stores/cartStore';
import { useCurrencyStore } from '@/stores/currencyStore';
import { CurrencySelector } from './CurrencySelector';
import WallMockup, { RoomSetting } from './WallMockup';
import PrintReadyVisualization from '@/components/chess/PrintReadyVisualization';
import { EnPensentOverlay, MoveHistoryEntry } from '@/components/chess/EnPensentOverlay';
import { SimulationResult, SquareData } from '@/lib/chess/gameSimulator';
import { generateCleanPrintImage } from '@/lib/chess/printImageGenerator';
import { PieceType } from '@/lib/chess/pieceColors';
import { toast } from 'sonner';


interface CapturedState {
  currentMove: number;
  selectedPhase: string;
  lockedPieces: Array<{ pieceType: string; pieceColor: string }>;
  compareMode: boolean;
  displayMode: string;
  darkMode: boolean;
  showTerritory: boolean;
  showHeatmaps: boolean;
  capturedAt: Date;
}

interface EnPensentData {
  moveHistory: MoveHistoryEntry[];
  whitePalette: Record<PieceType, string>;
  blackPalette: Record<PieceType, string>;
  gameInfo: {
    white: string;
    black: string;
    result?: string;
  };
}

interface ProductSelectorProps {
  customPrintData: {
    pgn: string;
    gameTitle: string;
    previewImageBase64?: string;
  };
  simulation?: SimulationResult;
  shareId?: string | null;
  capturedState?: CapturedState;
  enPensentData?: EnPensentData;
  onAddedToCart?: () => void;
}

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

export const ProductSelector: React.FC<ProductSelectorProps> = ({ 
  customPrintData,
  simulation,
  shareId,
  capturedState,
  enPensentData,
  onAddedToCart 
}) => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [hoveredVariantId, setHoveredVariantId] = useState<string | null>(null);
  const [roomSetting, setRoomSetting] = useState<RoomSetting>('living');
  const [added, setAdded] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const addItem = useCartStore(state => state.addItem);
  const { formatPrice: formatWithCurrency, selectedCurrency } = useCurrencyStore();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts(10);
      setProducts(data);
      
      const chessProduct = data.find(p => 
        p.node.handle.includes('chess') || p.node.title.toLowerCase().includes('chess')
      );
      
      if (chessProduct) {
        setSelectedProduct(chessProduct);
        setSelectedVariantId(chessProduct.node.variants.edges[0]?.node.id || '');
      } else if (data.length > 0) {
        setSelectedProduct(data[0]);
        setSelectedVariantId(data[0].node.variants.edges[0]?.node.id || '');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedVariant = selectedProduct?.node.variants.edges.find(
    v => v.node.id === selectedVariantId
  )?.node;

  const displayVariant = selectedProduct?.node.variants.edges.find(
    v => v.node.id === (hoveredVariantId || selectedVariantId)
  )?.node;

  // Create mini visualization for mockup - applies captured state filtering
  const displayBoard = useMemo(() => {
    if (!simulation) return null;
    
    // Apply captured state filtering if available
    if (capturedState && capturedState.currentMove !== Infinity && capturedState.currentMove > 0) {
      return filterBoardToMove(simulation.board, capturedState.currentMove);
    }
    return simulation.board;
  }, [simulation, capturedState]);

  // Create mini visualization for mockup - supports both simulation and EnPensent data
  // Uses unified PrintReadyVisualization for consistent "trademark look"
  const miniVisualization = useMemo(() => {
    const darkMode = capturedState?.darkMode || false;
    
    // If we have EnPensent data (from live games), use unified component
    if (enPensentData) {
      return (
        <PrintReadyVisualization 
          gameData={{
            white: enPensentData.gameInfo.white,
            black: enPensentData.gameInfo.black,
            result: enPensentData.gameInfo.result,
            event: 'Chess Game',
          }}
          enPensentData={{
            moveHistory: enPensentData.moveHistory,
            whitePalette: enPensentData.whitePalette,
            blackPalette: enPensentData.blackPalette,
          }}
          size={100}
          darkMode={darkMode}
          compact={true}
        />
      );
    }
    
    // Fall back to simulation-based rendering using the unified PrintReadyVisualization
    if (!displayBoard || !simulation) return null;
    return (
      <PrintReadyVisualization 
        board={displayBoard}
        gameData={simulation.gameData}
        size={100}
        darkMode={darkMode}
        compact={true}
      />
    );
  }, [displayBoard, simulation, capturedState?.darkMode, enPensentData]);

  const handleAddToCart = async () => {
    if (!selectedProduct || !selectedVariant) return;
    
    setIsGeneratingImage(true);
    
    try {
      // Generate clean print image for Printify (no watermark - same as preview)
      let previewImageBase64: string | undefined;
      
      if (simulation) {
        try {
          // Include QR code on premium prints when shareId is available
          // Pass capturedState to ensure print matches exact visualization state
          previewImageBase64 = await generateCleanPrintImage(simulation, { 
            darkMode: capturedState?.darkMode || false,
            includeQR: !!shareId,
            shareId: shareId || undefined,
            capturedState,
          });
        } catch (error) {
          console.error('Failed to generate print image:', error);
          toast.error('Failed to generate print image. Adding to cart without image.');
        }
      }

      const cartItem: CartItem = {
        product: selectedProduct,
        variantId: selectedVariant.id,
        variantTitle: selectedVariant.title,
        price: selectedVariant.price,
        quantity: 1,
        selectedOptions: selectedVariant.selectedOptions,
        customPrintData: {
          ...customPrintData,
          previewImageBase64,
        },
      };

      addItem(cartItem);
      setAdded(true);
      onAddedToCart?.();
      
      setTimeout(() => setAdded(false), 3000);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Format price with currency conversion
  const formatPrice = (amount: string) => {
    const usdAmount = parseFloat(amount);
    return formatWithCurrency(usdAmount);
  };

  const roomOptions: { id: RoomSetting; label: string; icon: typeof Sofa }[] = [
    { id: 'living', label: 'Living Room', icon: Sofa },
    { id: 'office', label: 'Office', icon: Briefcase },
    { id: 'gallery', label: 'Gallery', icon: Image },
  ];

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No products available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Order Your Print
          </CardTitle>
          <CurrencySelector compact />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Room Setting Toggle */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview Setting</label>
          <div className="flex gap-2">
            {roomOptions.map((room) => {
              const Icon = room.icon;
              const isActive = roomSetting === room.id;
              return (
                <button
                  key={room.id}
                  onClick={() => setRoomSetting(room.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${isActive 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="h-3 w-3" />
                  {room.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Wall Mockup Preview */}
        {displayVariant && (
          <div className="flex justify-center py-6 bg-muted/20 rounded-xl">
            <WallMockup 
              sizeLabel={displayVariant.title} 
              roomSetting={roomSetting}
              visualizationElement={miniVisualization}
            />
          </div>
        )}

        {/* Size selector - Grid of buttons */}
        {selectedProduct && selectedProduct.node.variants.edges.length > 1 && (
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Frame className="h-4 w-4 text-muted-foreground" />
              Select Size
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {selectedProduct.node.variants.edges.map(({ node: variant }) => {
                const isSelected = variant.id === selectedVariantId;
                return (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariantId(variant.id)}
                    onMouseEnter={() => setHoveredVariantId(variant.id)}
                    onMouseLeave={() => setHoveredVariantId(null)}
                    className={`
                      relative p-3 rounded-lg border-2 transition-all duration-200 text-left
                      ${isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                      }
                    `}
                  >
                    <div className="font-medium text-sm">{variant.title}</div>
                    <div className={`text-xs ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                      {formatPrice(variant.price.amount)}
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1">
                        <Check className="h-3 w-3 text-primary" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div>
            {selectedVariant && (
              <div>
                <span className="text-2xl font-bold">
                  {formatPrice(selectedVariant.price.amount)}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  {selectedVariant.title}
                </span>
                {selectedCurrency.code !== 'USD' && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    ≈ ${parseFloat(selectedVariant.price.amount).toFixed(2)} USD
                  </div>
                )}
              </div>
            )}
          </div>
          <Button 
            onClick={handleAddToCart} 
            disabled={!selectedVariant || added || isGeneratingImage}
            className="gap-2"
            size="lg"
          >
            {isGeneratingImage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing...
              </>
            ) : added ? (
              <>
                <Check className="h-4 w-4" />
                Added!
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </>
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Museum-quality archival paper • Vibrant fade-resistant inks • Ships worldwide
          </p>
          <div className="flex items-center gap-1.5 text-xs text-primary">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span>Buy more, save more — up to 35% off bulk orders!</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
