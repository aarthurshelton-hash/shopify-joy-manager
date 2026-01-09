import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Loader2, Check } from 'lucide-react';
import { fetchProducts, type ShopifyProduct } from '@/lib/shopify/api';
import { useCartStore, type CartItem } from '@/stores/cartStore';

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
      <CardContent className="space-y-4">
        {/* Size selector */}
        {selectedProduct && selectedProduct.node.variants.edges.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Size</label>
            <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a size" />
              </SelectTrigger>
              <SelectContent>
                {selectedProduct.node.variants.edges.map(({ node: variant }) => (
                  <SelectItem key={variant.id} value={variant.id}>
                    {variant.title} — {formatPrice(variant.price.amount, variant.price.currencyCode)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Price and Add to Cart */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {selectedVariant && (
              <span className="text-2xl font-bold">
                {formatPrice(selectedVariant.price.amount, selectedVariant.price.currencyCode)}
              </span>
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

        <p className="text-xs text-muted-foreground pt-2">
          Museum-quality archival paper • Vibrant fade-resistant inks • Ships worldwide
        </p>
      </CardContent>
    </Card>
  );
};