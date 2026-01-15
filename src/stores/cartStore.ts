import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';
import { useCurrencyStore } from './currencyStore';

// Map currency codes to Shopify country codes for checkout localization
const CURRENCY_TO_COUNTRY: Record<string, string> = {
  USD: 'US',
  CAD: 'CA',
  EUR: 'DE', // Default to Germany for Euro
  GBP: 'GB',
  AUD: 'AU',
  JPY: 'JP',
  CHF: 'CH',
  CNY: 'CN',
  INR: 'IN',
  MXN: 'MX',
  BRL: 'BR',
  KRW: 'KR',
};

// Re-export types from API
export type { ShopifyProduct } from '@/lib/shopify/api';

export interface CartItem {
  product: {
    node: {
      id: string;
      title: string;
      description: string;
      handle: string;
      priceRange: {
        minVariantPrice: {
          amount: string;
          currencyCode: string;
        };
      };
      images: {
        edges: Array<{
          node: {
            url: string;
            altText: string | null;
          };
        }>;
      };
      variants: {
        edges: Array<{
          node: {
            id: string;
            title: string;
            price: {
              amount: string;
              currencyCode: string;
            };
            availableForSale: boolean;
            selectedOptions: Array<{
              name: string;
              value: string;
            }>;
          };
        }>;
      };
      options: Array<{
        name: string;
        values: string[];
      }>;
    };
  };
  variantId: string;
  variantTitle: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  quantity: number;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
  customPrintData?: {
    pgn: string;
    gameTitle: string;
    previewImageBase64?: string; // Exact current state image for cart thumbnail
    printImageUrl?: string; // Public URL for Printify fulfillment
    frameStyle?: string;
    includeInfoCard?: boolean;
    visualizationId?: string; // For tracking and royalties
    gameId?: string; // For game pool attribution
    paletteId?: string; // For palette pool attribution
    // Game data for display in cart
    gameData?: {
      white?: string;
      black?: string;
      event?: string;
      date?: string;
      result?: string;
    };
    // Game hash for canonical navigation
    gameHash?: string;
    // FEN string for position-only visualizations
    fen?: string;
    // Captured visualization state - ensures print matches exactly what user sees
    capturedState?: {
      currentMove: number;
      lockedPieces: Array<{ pieceType: string; pieceColor: string }>;
      compareMode: boolean;
      darkMode: boolean;
      showPieces?: boolean;
      pieceOpacity?: number;
    };
  };
}

// Shopify config
const SHOPIFY_API_VERSION = '2025-07';
const SHOPIFY_STORE_PERMANENT_DOMAIN = 'printify-shop-manager-fs4kw.myshopify.com';
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
const SHOPIFY_STOREFRONT_TOKEN = 'a0ffa036b52f6150e7e1bfaf4b307ff4';

// Cart creation mutation with buyer identity for currency localization
// Includes attributes for custom line item properties (print images, viz IDs, etc.)
const CART_CREATE_MUTATION = `
  mutation cartCreate($input: CartInput!, $country: CountryCode) @inContext(country: $country) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function createStorefrontCheckout(items: CartItem[]): Promise<string> {
  const lines = items.map(item => {
    // Build line item with attributes for custom print data
    const lineItem: {
      quantity: number;
      merchandiseId: string;
      attributes?: Array<{ key: string; value: string }>;
    } = {
      quantity: item.quantity,
      merchandiseId: item.variantId,
    };
    
    // Add custom attributes for print fulfillment
    if (item.customPrintData) {
      const attributes: Array<{ key: string; value: string }> = [];
      
      // Add print image URL for Printify
      if (item.customPrintData.printImageUrl) {
        attributes.push({ key: '_custom_image_url', value: item.customPrintData.printImageUrl });
      }
      
      // Add game title for order identification
      if (item.customPrintData.gameTitle) {
        attributes.push({ key: '_game_title', value: item.customPrintData.gameTitle });
      }
      
      // Add visualization ID for tracking and royalties
      if (item.customPrintData.visualizationId) {
        attributes.push({ key: '_visualization_id', value: item.customPrintData.visualizationId });
      }
      
      // Add game ID for game pool attribution
      if (item.customPrintData.gameId) {
        attributes.push({ key: '_game_id', value: item.customPrintData.gameId });
      }
      
      // Add palette ID for palette pool attribution
      if (item.customPrintData.paletteId) {
        attributes.push({ key: '_palette_id', value: item.customPrintData.paletteId });
      }
      
      // Add frame style if present
      if (item.customPrintData.frameStyle) {
        attributes.push({ key: '_frame_style', value: item.customPrintData.frameStyle });
      }
      
      // Add info card flag if present
      if (item.customPrintData.includeInfoCard) {
        attributes.push({ key: '_include_info_card', value: 'true' });
      }
      
      if (attributes.length > 0) {
        lineItem.attributes = attributes;
      }
    }
    
    return lineItem;
  });

  // Get user's selected currency and map to country code
  const selectedCurrency = useCurrencyStore.getState().selectedCurrency;
  const countryCode = CURRENCY_TO_COUNTRY[selectedCurrency.code] || 'US';

  const response = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN
    },
    body: JSON.stringify({
      query: CART_CREATE_MUTATION,
      variables: { 
        input: { lines },
        country: countryCode
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    throw new Error(`Shopify error: ${data.errors.map((e: { message: string }) => e.message).join(', ')}`);
  }

  if (data.data.cartCreate.userErrors.length > 0) {
    throw new Error(`Cart error: ${data.data.cartCreate.userErrors.map((e: { message: string }) => e.message).join(', ')}`);
  }

  const checkoutUrl = data.data.cartCreate.cart?.checkoutUrl;
  if (!checkoutUrl) {
    throw new Error('No checkout URL returned');
  }

  const url = new URL(checkoutUrl);
  url.searchParams.set('channel', 'online_store');
  return url.toString();
}

interface CartStore {
  items: CartItem[];
  checkoutUrl: string | null;
  isLoading: boolean;
  
  addItem: (item: CartItem) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
  createCheckout: () => Promise<void>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      checkoutUrl: null,
      isLoading: false,

      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find(i => i.variantId === item.variantId);
        
        if (existingItem) {
          set({
            items: items.map(i =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            )
          });
        } else {
          set({ items: [...items, item] });
        }
        
        toast.success('Added to cart!', { 
          duration: 2000,
          position: 'top-center'
        });
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        set({
          items: get().items.map(item =>
            item.variantId === variantId ? { ...item, quantity } : item
          )
        });
      },

      removeItem: (variantId) => {
        set({
          items: get().items.filter(item => item.variantId !== variantId)
        });
      },

      clearCart: () => {
        set({ items: [], checkoutUrl: null });
      },

      setLoading: (isLoading) => set({ isLoading }),

      createCheckout: async () => {
        const { items } = get();
        if (items.length === 0) return;

        set({ isLoading: true });
        try {
          const checkoutUrl = await createStorefrontCheckout(items);
          set({ checkoutUrl });
        } catch (error) {
          console.error('Failed to create checkout:', error);
          toast.error('Checkout failed. Please try again.');
        } finally {
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'en-pensent-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);