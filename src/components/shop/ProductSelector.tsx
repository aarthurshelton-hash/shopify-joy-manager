import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, Loader2, Check, Frame } from 'lucide-react';
import { fetchProducts, type ShopifyProduct } from '@/lib/shopify/api';
import { useCartStore, type CartItem } from '@/stores/cartStore';
import WallMockup from './WallMockup';

interface ProductSelectorProps {
  customPrintData: {
    pgn: string;
    gameTitle: string;
    previewImageBase64?: string;
  };
  onAddedToCart?: () => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({ 
  customPrintData,
  onAddedToCart 
}) => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<ShopifyProduct | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [hoveredVariantId, setHoveredVariantId] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts(10);
      setProducts(data);
      
      // Auto-select the chess print product if available
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

  // Get the variant to show in mockup (hovered or selected)
  const displayVariant = selectedProduct?.node.variants.edges.find(
    v => v.node.id === (hoveredVariantId || selectedVariantId)
  )?.node;

  const handleAddToCart = () => {
    if (!selectedProduct || !selectedVariant) return;

    const cartItem: CartItem = {
      product: selectedProduct,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions,
      customPrintData,
    };

    addItem(cartItem);
    setAdded(true);
    onAddedToCart?.();
    
    // Reset the added state after a moment
    setTimeout(() => setAdded(false), 3000);
  };

  const formatPrice = (amount: string, currency: string) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency,
    }).format(parseFloat(amount));
  };

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
        <CardTitle className="text-lg flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Order Your Print
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wall Mockup Preview */}
        {displayVariant && (
          <div className="flex justify-center py-4 bg-muted/30 rounded-lg">
            <WallMockup sizeLabel={displayVariant.title} />
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
                      {formatPrice(variant.price.amount, variant.price.currencyCode)}
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
                  {formatPrice(selectedVariant.price.amount, selectedVariant.price.currencyCode)}
                </span>
                <span className="text-sm text-muted-foreground ml-2">
                  {selectedVariant.title}
                </span>
              </div>
            )}
          </div>
          <Button 
            onClick={handleAddToCart} 
            disabled={!selectedVariant || added}
            className="gap-2"
            size="lg"
          >
            {added ? (
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

        <p className="text-xs text-muted-foreground">
          Museum-quality archival paper • Vibrant fade-resistant inks • Ships worldwide
        </p>
      </CardContent>
    </Card>
  );
};
