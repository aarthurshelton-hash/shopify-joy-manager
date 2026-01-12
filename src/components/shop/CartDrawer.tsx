import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Loader2, 
  Sparkles, 
  Gift, 
  Truck, 
  Frame, 
  FileText,
  Crown,
  ChevronRight,
  Eye,
} from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { useCurrencyStore } from "@/stores/currencyStore";
import { CurrencySelector } from "./CurrencySelector";
import { calculateDiscount, DISCOUNT_TIERS, ShippingRegion } from "@/lib/discounts";
import { FRAME_SHIPPING_COST_EXPORT, FREE_SHIPPING_THRESHOLD_EXPORT } from "./FrameAddOn";
import { useAuth } from "@/hooks/useAuth";
import { VisionaryMembershipCard } from "@/components/premium/VisionaryMembershipCard";
import AuthModal from "@/components/auth/AuthModal";

export const CartDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showVisionaryModal, setShowVisionaryModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  
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
  
  // Calculate framed items for shipping logic
  const framedItemCount = items.filter(item => item.customPrintData?.frameStyle).length;
  const qualifiesForFreeFrameShipping = framedItemCount >= FREE_SHIPPING_THRESHOLD_EXPORT;
  const frameShippingCost = framedItemCount > 0 && !qualifiesForFreeFrameShipping ? FRAME_SHIPPING_COST_EXPORT : 0;
  
  // Default to US region for now - shipping region determined at Shopify checkout
  const shippingRegion: ShippingRegion = 'US';
  
  // Calculate discount based on total quantity and shipping region
  const discountInfo = calculateDiscount(subtotalUSD, totalItems, shippingRegion);
  
  // Final total including frame shipping
  const grandTotalWithFrameShipping = discountInfo.grandTotal + frameShippingCost;

  const handleCheckout = async () => {
    const checkoutWindow = window.open('about:blank', '_blank');
    
    try {
      await createCheckout();
      const checkoutUrl = useCartStore.getState().checkoutUrl;
      if (checkoutUrl && checkoutWindow) {
        checkoutWindow.location.href = checkoutUrl;
        setIsOpen(false);
      } else if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      checkoutWindow?.close();
    }
  };

  const handleItemClick = (item: typeof items[0]) => {
    // Navigate to vision detail if there's custom print data with a game title
    if (item.customPrintData?.gameTitle) {
      setIsOpen(false);
      // Navigate to order-print page with the data
      navigate('/order-print');
    }
  };

  // Parse add-ons from variant title for line-item breakdown
  const parseAddOns = (variantTitle: string) => {
    const addOns: { frame?: string; infoCard?: boolean } = {};
    if (variantTitle.includes('Frame')) {
      const frameMatch = variantTitle.match(/\+ (.+?) Frame/);
      if (frameMatch) addOns.frame = frameMatch[1];
    }
    if (variantTitle.includes('Info Card')) {
      addOns.infoCard = true;
    }
    return addOns;
  };

  return (
    <>
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
              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="text-center">
                  <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Your cart is empty</p>
                  <p className="text-sm text-muted-foreground mt-2">Create a visualization and order your print!</p>
                </div>
                
                {/* Subtle Visionary Upsell for Empty Cart */}
                {!isPremium && (
                  <div className="w-full max-w-xs">
                    <button
                      onClick={() => {
                        if (!user) {
                          setShowAuthModal(true);
                        } else {
                          setShowVisionaryModal(true);
                        }
                      }}
                      className="w-full group relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-4 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      <div className="relative flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
                          <Crown className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm">Become a Visionary</p>
                          <p className="text-xs text-muted-foreground">Unlock HD downloads, trading & more</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">2,847 active members</span>
                        <span className="text-primary font-semibold">$7/month</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto pr-2 min-h-0">
                  <div className="space-y-4">
                    {items.map((item) => {
                      const addOns = parseAddOns(item.variantTitle);
                      const hasCustomPrint = !!item.customPrintData?.previewImageBase64;
                      
                      return (
                        <div 
                          key={item.variantId} 
                          className={`flex gap-3 p-3 bg-muted/50 rounded-lg transition-all ${hasCustomPrint ? 'cursor-pointer hover:bg-muted/70' : ''}`}
                          onClick={() => hasCustomPrint && handleItemClick(item)}
                        >
                          {/* Product Image - Mini Print Preview */}
                          <div className="w-16 h-16 bg-secondary/20 rounded-md overflow-hidden flex-shrink-0 relative">
                            {item.customPrintData?.previewImageBase64 ? (
                              <img
                                src={item.customPrintData.previewImageBase64}
                                alt={item.customPrintData.gameTitle || 'Chess Vision'}
                                className="w-full h-full object-cover"
                              />
                            ) : item.product.node.images?.edges?.[0]?.node ? (
                              <img
                                src={item.product.node.images.edges[0].node.url}
                                alt={item.product.node.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-muted">
                                <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            
                            {/* View indicator for custom prints */}
                            {hasCustomPrint && (
                              <div className="absolute inset-0 bg-black/0 hover:bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-all">
                                <Eye className="h-4 w-4 text-white" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            {/* Game Title */}
                            {item.customPrintData?.gameTitle && (
                              <h4 className="font-medium text-sm truncate text-primary">
                                {item.customPrintData.gameTitle}
                              </h4>
                            )}
                            
                            {/* Product & Size */}
                            <p className="text-xs text-muted-foreground truncate">
                              {item.product.node.title} • {item.selectedOptions.map(option => option.value).join(' ')}
                            </p>
                            
                            {/* Line-item breakdown for add-ons */}
                            <div className="mt-1 space-y-0.5">
                              {item.customPrintData?.frameStyle && (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Frame className="h-3 w-3 text-amber-500" />
                                  <span>{addOns.frame || 'Framed'} Frame</span>
                                </div>
                              )}
                              {item.customPrintData?.includeInfoCard && (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <FileText className="h-3 w-3 text-primary" />
                                  <span>Vision Data Card</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Price */}
                            <p className="font-semibold text-sm mt-1">
                              {formatPrice(parseFloat(item.price.amount))}
                            </p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItem(item.variantId);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(item.variantId, item.quantity - 1);
                                }}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center text-xs">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(item.variantId, item.quantity + 1);
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Visionary Upsell when cart has items but user is not premium */}
                  {!isPremium && items.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-dashed">
                      <button
                        onClick={() => {
                          if (!user) {
                            setShowAuthModal(true);
                          } else {
                            setShowVisionaryModal(true);
                          }
                        }}
                        className="w-full group flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-primary/10 border border-amber-500/20 hover:border-amber-500/40 transition-all"
                      >
                        <Crown className="h-5 w-5 text-amber-500" />
                        <div className="flex-1 text-left">
                          <p className="text-xs font-medium">Unlock exclusive add-ons</p>
                          <p className="text-[10px] text-muted-foreground">Vision Data Cards • HD Downloads • More</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex-shrink-0 space-y-3 pt-4 border-t bg-background">
                  {/* Free shipping badge for US/Canada */}
                  <div className="flex items-center justify-center gap-2 py-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <Truck className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      🇺🇸 🇨🇦 FREE shipping to USA & Canada
                    </span>
                  </div>

                  {/* Frame shipping notice */}
                  {framedItemCount > 0 && (
                    <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                      qualifiesForFreeFrameShipping 
                        ? 'bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400' 
                        : 'bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}>
                      <Frame className="h-3 w-3" />
                      <span>
                        {qualifiesForFreeFrameShipping ? (
                          <><span className="font-bold">FREE</span> frame shipping ({framedItemCount} framed)</>
                        ) : (
                          <>Frame shipping: <span className="font-bold">${FRAME_SHIPPING_COST_EXPORT}</span> ({FREE_SHIPPING_THRESHOLD_EXPORT - framedItemCount} more for free)</>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Discount progress indicator */}
                  {discountInfo.nextTier && (
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-2 border border-primary/20">
                      <div className="flex items-center gap-2 text-xs">
                        <Gift className="h-3 w-3 text-primary" />
                        <span>
                          Add <span className="font-bold text-primary">{discountInfo.itemsUntilNextTier} more</span> for{' '}
                          <span className="font-bold text-primary">{discountInfo.nextTier.label}</span>!
                        </span>
                      </div>
                      <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-300"
                          style={{ width: `${(totalItems / discountInfo.nextTier.minQuantity) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Current discount badge */}
                  {discountInfo.discountPercent > 0 && (
                    <div className="flex items-center justify-center gap-2 py-1.5 bg-green-500/10 rounded-lg border border-green-500/20">
                      <Sparkles className="h-3 w-3 text-green-500" />
                      <span className="text-xs font-medium text-green-600 dark:text-green-400">
                        {discountInfo.tier.label} — Save {formatPrice(discountInfo.discountAmount)}!
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">Currency:</span>
                    <CurrencySelector compact />
                  </div>
                  
                  {/* Pricing breakdown */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className={discountInfo.discountPercent > 0 ? 'line-through text-muted-foreground' : ''}>
                        {formatPrice(subtotalUSD)}
                      </span>
                    </div>
                    
                    {discountInfo.discountPercent > 0 && (
                      <div className="flex justify-between items-center text-green-600 dark:text-green-400">
                        <span>Bulk discount ({discountInfo.discountPercent}%)</span>
                        <span>-{formatPrice(discountInfo.discountAmount)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        Shipping
                      </span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        {frameShippingCost > 0 ? `$${frameShippingCost.toFixed(2)}` : 'FREE'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="font-semibold">Total</span>
                      <div className="text-right">
                        <span className="text-lg font-bold">
                          {formatPrice(grandTotalWithFrameShipping)}
                        </span>
                        {selectedCurrency.code !== 'USD' && (
                          <p className="text-[10px] text-muted-foreground">
                            ≈ ${grandTotalWithFrameShipping.toFixed(2)} USD
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
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
                  
                  <p className="text-[10px] text-muted-foreground text-center">
                    Int'l shipping at checkout • Processed in USD
                  </p>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Visionary Membership Modal */}
      <VisionaryMembershipCard
        isOpen={showVisionaryModal}
        onClose={() => setShowVisionaryModal(false)}
        onAuthRequired={() => {
          setShowVisionaryModal(false);
          setShowAuthModal(true);
        }}
        trigger="general"
      />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
};
