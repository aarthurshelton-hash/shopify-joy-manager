import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart } from 'lucide-react';
import { useCartStore, type ShopifyProduct, type CartItem } from '@/stores/cartStore';

interface ProductCardProps {
  product: ShopifyProduct;
  customPrintData?: {
    pgn: string;
    gameTitle: string;
    previewImageBase64?: string;
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, customPrintData }) => {
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.node.variants.edges[0]?.node.id || ''
  );
  const addItem = useCartStore(state => state.addItem);

  const selectedVariant = product.node.variants.edges.find(
    v => v.node.id === selectedVariantId
  )?.node;

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    const cartItem: CartItem = {
      product,
      variantId: selectedVariant.id,
      variantTitle: selectedVariant.title,
      price: selectedVariant.price,
      quantity: 1,
      selectedOptions: selectedVariant.selectedOptions,
      customPrintData,
    };

    addItem(cartItem);
  };

  const formatPrice = (amount: string, currency: string) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency,
    }).format(parseFloat(amount));
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-muted flex items-center justify-center">
        {product.node.images.edges[0]?.node.url ? (
          <img
            src={product.node.images.edges[0].node.url}
            alt={product.node.images.edges[0].node.altText || product.node.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-6xl">♔</div>
        )}
      </div>
      
      <CardContent className="p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-lg">{product.node.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.node.description}
          </p>
        </div>

        {product.node.variants.edges.length > 1 && (
          <Select value={selectedVariantId} onValueChange={setSelectedVariantId}>
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {product.node.variants.edges.map(({ node: variant }) => (
                <SelectItem key={variant.id} value={variant.id}>
                  {variant.title} - {formatPrice(variant.price.amount, variant.price.currencyCode)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xl font-bold">
            {selectedVariant && formatPrice(selectedVariant.price.amount, selectedVariant.price.currencyCode)}
          </span>
          <Button onClick={handleAddToCart} size="sm" className="gap-2">
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};