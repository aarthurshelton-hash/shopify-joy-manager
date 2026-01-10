import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2, ExternalLink, Loader2, Sparkles, Gift } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useCurrencyStore } from "@/stores/currencyStore";
import { CurrencySelector } from "./CurrencySelector";
import { calculateDiscount, DISCOUNT_TIERS } from "@/lib/discounts";

export const CartDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    items, 
    isLoading, 
    updateQuantity, 
    removeItem, 
    createCheckout 
  } = useCartStore();
  
  const { formatPrice, selectedCurrency } = useCurrencyStore();
  
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalUSD = items.reduce((sum, item) => sum + (parseFloat(item.price.amount) * item.quantity), 0);
  
  // Calculate discount based on total quantity
  const discountInfo = calculateDiscount(subtotalUSD, totalItems);

  const handleCheckout = async () => {
    // Open window immediately to avoid popup blocker
    const checkoutWindow = window.open('about:blank', '_blank');
    
    try {
      await createCheckout();
      const checkoutUrl = useCartStore.getState().checkoutUrl;
      if (checkoutUrl && checkoutWindow) {
        checkoutWindow.location.href = checkoutUrl;
        setIsOpen(false);
      } else if (checkoutUrl) {
        // Fallback: redirect current window if popup was blocked
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      // Close the blank window if checkout failed
      checkoutWindow?.close();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>
            {totalItems === 0 ? "Your cart is empty" : `${totalItems} item${totalItems !== 1 ? 's' : ''} in your cart`}
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex flex-col flex-1 pt-6 min-h-0">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Your cart is empty</p>
                <p className="text-sm text-muted-foreground mt-2">Create a visualization and order your print!</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.variantId} className="flex gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="w-16 h-16 bg-secondary/20 rounded-md overflow-hidden flex-shrink-0">
                        {item.product.node.images?.edges?.[0]?.node && (
                          <img
                            src={item.product.node.images.edges[0].node.url}
                            alt={item.product.node.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{item.product.node.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.selectedOptions.map(option => option.value).join(' • ')}
                        </p>
                        {item.customPrintData && (
                          <p className="text-xs text-primary mt-1">
                            {item.customPrintData.gameTitle}
                          </p>
                        )}
                        <p className="font-semibold mt-1">
                          {formatPrice(parseFloat(item.price.amount))}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeItem(item.variantId)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex-shrink-0 space-y-3 pt-4 border-t bg-background">
                {/* Discount progress indicator */}
                {discountInfo.nextTier && (
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20">
                    <div className="flex items-center gap-2 text-sm">
                      <Gift className="h-4 w-4 text-primary" />
                      <span className="text-foreground">
                        Add <span className="font-bold text-primary">{discountInfo.itemsUntilNextTier} more</span> for{' '}
                        <span className="font-bold text-primary">{discountInfo.nextTier.label}</span>!
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(totalItems / discountInfo.nextTier.minQuantity) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Current discount badge */}
                {discountInfo.discountPercent > 0 && (
                  <div className="flex items-center justify-center gap-2 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
                    <Sparkles className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {discountInfo.tier.label} applied — You save {formatPrice(discountInfo.discountAmount)}!
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Display currency:</span>
                  <CurrencySelector compact />
                </div>
                
                {/* Pricing breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className={discountInfo.discountPercent > 0 ? 'line-through text-muted-foreground' : ''}>
                      {formatPrice(subtotalUSD)}
                    </span>
                  </div>
                  
                  {discountInfo.discountPercent > 0 && (
                    <div className="flex justify-between items-center text-sm text-green-600 dark:text-green-400">
                      <span>Bulk discount ({discountInfo.discountPercent}%)</span>
                      <span>-{formatPrice(discountInfo.discountAmount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-lg font-semibold">Total</span>
                    <div className="text-right">
                      <span className="text-xl font-bold">
                        {formatPrice(discountInfo.finalTotal)}
                      </span>
                      {selectedCurrency.code !== 'USD' && (
                        <p className="text-xs text-muted-foreground">
                          ≈ ${discountInfo.finalTotal.toFixed(2)} USD
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  Checkout will be processed in USD. Your bank will convert to {selectedCurrency.code}.
                </p>
                
                <Button 
                  onClick={handleCheckout}
                  className="w-full" 
                  size="lg"
                  disabled={items.length === 0 || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating Checkout...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Checkout
                    </>
                  )}
                </Button>
                
                {/* Discount tiers info */}
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer hover:text-foreground transition-colors">
                    View bulk discount tiers
                  </summary>
                  <div className="mt-2 space-y-1 pl-2 border-l-2 border-muted">
                    {DISCOUNT_TIERS.slice(1).map((tier) => (
                      <div 
                        key={tier.minQuantity} 
                        className={`flex justify-between ${totalItems >= tier.minQuantity ? 'text-green-600 dark:text-green-400 font-medium' : ''}`}
                      >
                        <span>{tier.minQuantity}+ prints</span>
                        <span>{tier.label}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
