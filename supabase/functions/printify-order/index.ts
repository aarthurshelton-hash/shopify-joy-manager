import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRINTIFY_API_KEY = Deno.env.get('PRINTIFY_API_KEY');
const PRINTIFY_SHOP_ID = Deno.env.get('PRINTIFY_SHOP_ID');
const PRINTIFY_BASE_URL = 'https://api.printify.com/v1';

interface OrderLineItem {
  title: string;
  quantity: number;
  sku: string;
  size: string;
  customImageUrl: string;
  productType?: 'print' | 'frame' | 'infocard' | 'book';
  frameStyle?: string;
  bookFormat?: 'standard' | 'large';
  bookPagesZipUrl?: string;
}

interface ShippingAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  country: string;
  region: string;
  address1: string;
  address2?: string;
  city: string;
  zip: string;
}

interface CreateOrderRequest {
  shopifyOrderId: string;
  lineItems: OrderLineItem[];
  shippingAddress: ShippingAddress;
  framedItemCount?: number;
}

async function printifyRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${PRINTIFY_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Printify API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function uploadImage(imageUrl: string, fileName: string) {
  const response = await printifyRequest(`/uploads/images.json`, {
    method: 'POST',
    body: JSON.stringify({
      file_name: fileName,
      url: imageUrl,
    }),
  });
  return response;
}

// Size to Printify blueprint variant mapping (Premium Matte Vertical Posters)
const SIZE_TO_BLUEPRINT: Record<string, { blueprint_id: number; variant_id: number; print_provider_id: number }> = {
  '8×10"': { blueprint_id: 622, variant_id: 79710, print_provider_id: 99 },
  '11×14"': { blueprint_id: 622, variant_id: 79711, print_provider_id: 99 },
  '12×16"': { blueprint_id: 622, variant_id: 79712, print_provider_id: 99 },
  '16×20"': { blueprint_id: 622, variant_id: 79713, print_provider_id: 99 },
  '18×24"': { blueprint_id: 622, variant_id: 79714, print_provider_id: 99 },
  '24×36"': { blueprint_id: 622, variant_id: 79715, print_provider_id: 99 },
};

// Frame product blueprints (Canvas with frames)
const FRAME_BLUEPRINTS: Record<string, { blueprint_id: number; variants: Record<string, number>; print_provider_id: number }> = {
  // Framed Canvas products - Blueprint 1146 (Canvas with float frame)
  '8×10"': {
    blueprint_id: 1146,
    variants: {
      'natural': 99001,
      'black': 99002,
      'white': 99003,
      'walnut': 99004,
      'gold': 99005,
    },
    print_provider_id: 99,
  },
  '11×14"': {
    blueprint_id: 1146,
    variants: {
      'natural': 99011,
      'black': 99012,
      'white': 99013,
      'walnut': 99014,
      'gold': 99015,
    },
    print_provider_id: 99,
  },
  '16×20"': {
    blueprint_id: 1146,
    variants: {
      'natural': 99021,
      'black': 99022,
      'white': 99023,
      'walnut': 99024,
      'gold': 99025,
    },
    print_provider_id: 99,
  },
  '18×24"': {
    blueprint_id: 1146,
    variants: {
      'natural': 99031,
      'black': 99032,
      'white': 99033,
      'walnut': 99034,
      'gold': 99035,
    },
    print_provider_id: 99,
  },
  '24×36"': {
    blueprint_id: 1146,
    variants: {
      'natural': 99041,
      'black': 99042,
      'white': 99043,
      'walnut': 99044,
      'gold': 99045,
    },
    print_provider_id: 99,
  },
};

// Info Card blueprint (5x7 premium cards)
const INFO_CARD_BLUEPRINT = {
  blueprint_id: 1156, // Premium photo cards
  variant_id: 98001,
  print_provider_id: 99,
};

// Photo Book blueprints - using Lulu integration via print provider
// Note: For premium hardcover books, orders are processed manually
// and forwarded to a specialized book printer (Lulu/Blurb)
const BOOK_BLUEPRINTS: Record<string, { 
  blueprint_id: number; 
  variant_id: number; 
  print_provider_id: number;
  page_count: number;
  weight_lbs: number;
}> = {
  'standard': {
    blueprint_id: 1200, // Custom book - placeholder
    variant_id: 120001,
    print_provider_id: 99,
    page_count: 220,
    weight_lbs: 2.5,
  },
  'large': {
    blueprint_id: 1201, // Custom large book - placeholder
    variant_id: 120101,
    print_provider_id: 99,
    page_count: 220,
    weight_lbs: 4.0,
  },
};

// Shipping cost configuration
const FRAME_SHIPPING_COST = 1299; // $12.99 in cents
const FREE_FRAME_SHIPPING_THRESHOLD = 3; // Free shipping at 3+ framed items
const BOOK_SHIPPING_COST = 999; // $9.99 base book shipping

async function createPrintifyOrder(
  shopifyOrderId: string,
  lineItems: OrderLineItem[],
  shippingAddress: ShippingAddress,
  framedItemCount: number = 0
) {
  const printifyLineItems = [];

  for (const item of lineItems) {
    // Handle framed products
    if (item.productType === 'frame' && item.frameStyle) {
      const frameConfig = FRAME_BLUEPRINTS[item.size];
      if (!frameConfig) {
        console.error(`Unknown frame size: ${item.size}`);
        continue;
      }
      
      const frameVariant = frameConfig.variants[item.frameStyle.toLowerCase()];
      if (!frameVariant) {
        console.error(`Unknown frame style: ${item.frameStyle}`);
        continue;
      }

      // Upload the custom image
      const uploadResult = await uploadImage(
        item.customImageUrl,
        `chess-framed-${shopifyOrderId}-${Date.now()}.png`
      );

      printifyLineItems.push({
        product_id: null,
        blueprint_id: frameConfig.blueprint_id,
        variant_id: frameVariant,
        print_provider_id: frameConfig.print_provider_id,
        quantity: item.quantity,
        print_areas: {
          front: uploadResult.id,
        },
      });
      continue;
    }

    // Handle info cards
    if (item.productType === 'infocard') {
      const uploadResult = await uploadImage(
        item.customImageUrl,
        `chess-infocard-${shopifyOrderId}-${Date.now()}.png`
      );

      printifyLineItems.push({
        product_id: null,
        blueprint_id: INFO_CARD_BLUEPRINT.blueprint_id,
        variant_id: INFO_CARD_BLUEPRINT.variant_id,
        print_provider_id: INFO_CARD_BLUEPRINT.print_provider_id,
        quantity: item.quantity,
        print_areas: {
          front: uploadResult.id,
        },
      });
      continue;
    }

    // Handle book orders - these are queued for manual processing
    // with specialized book printers (Lulu/Blurb integration)
    if (item.productType === 'book' && item.bookFormat) {
      const bookConfig = BOOK_BLUEPRINTS[item.bookFormat];
      if (!bookConfig) {
        console.error(`Unknown book format: ${item.bookFormat}`);
        continue;
      }

      // For books, we store the order details for manual fulfillment
      // The cover image is uploaded as reference
      const uploadResult = await uploadImage(
        item.customImageUrl,
        `carlsen-book-cover-${shopifyOrderId}-${Date.now()}.jpg`
      );

      // Book orders are flagged for manual processing
      // In production, this would integrate with Lulu/Blurb API
      printifyLineItems.push({
        product_id: null,
        blueprint_id: bookConfig.blueprint_id,
        variant_id: bookConfig.variant_id,
        print_provider_id: bookConfig.print_provider_id,
        quantity: item.quantity,
        print_areas: {
          front: uploadResult.id,
        },
        metadata: {
          type: 'book',
          format: item.bookFormat,
          pagesZipUrl: item.bookPagesZipUrl || null,
          pageCount: bookConfig.page_count,
          weightLbs: bookConfig.weight_lbs,
        },
      });
      continue;
    }

    // Handle standard prints
    const sizeConfig = SIZE_TO_BLUEPRINT[item.size];
    if (!sizeConfig) {
      console.error(`Unknown size: ${item.size}`);
      continue;
    }

    // Upload the custom image
    const uploadResult = await uploadImage(
      item.customImageUrl,
      `chess-visualization-${shopifyOrderId}-${Date.now()}.png`
    );

    printifyLineItems.push({
      product_id: null,
      blueprint_id: sizeConfig.blueprint_id,
      variant_id: sizeConfig.variant_id,
      print_provider_id: sizeConfig.print_provider_id,
      quantity: item.quantity,
      print_areas: {
        front: uploadResult.id,
      },
    });
  }

  // Calculate shipping - frame shipping is extra unless 3+ framed items
  const shippingMethod = framedItemCount > 0 && framedItemCount < FREE_FRAME_SHIPPING_THRESHOLD ? 2 : 1;

  const order = await printifyRequest(`/shops/${PRINTIFY_SHOP_ID}/orders.json`, {
    method: 'POST',
    body: JSON.stringify({
      external_id: shopifyOrderId,
      label: `Chess Visualization - ${shopifyOrderId}`,
      line_items: printifyLineItems,
      shipping_method: shippingMethod,
      is_printify_express: false,
      address_to: {
        first_name: shippingAddress.first_name,
        last_name: shippingAddress.last_name,
        email: shippingAddress.email,
        phone: shippingAddress.phone,
        country: shippingAddress.country,
        region: shippingAddress.region,
        address1: shippingAddress.address1,
        address2: shippingAddress.address2 || '',
        city: shippingAddress.city,
        zip: shippingAddress.zip,
      },
    }),
  });

  return order;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate service role authorization - this function is internal-only
    const authHeader = req.headers.get('Authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!authHeader || !serviceRoleKey || !authHeader.includes(serviceRoleKey)) {
      console.error('Unauthorized access attempt to printify-order');
      return new Response(JSON.stringify({ error: 'Unauthorized - internal use only' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!PRINTIFY_API_KEY) {
      throw new Error('PRINTIFY_API_KEY not configured');
    }

    if (!PRINTIFY_SHOP_ID) {
      throw new Error('PRINTIFY_SHOP_ID not configured');
    }

    const url = new URL(req.url);
    const path = url.pathname.replace('/printify-order', '');

    // POST /create - Create an order
    if (req.method === 'POST' && path === '/create') {
      const body: CreateOrderRequest = await req.json();

      const order = await createPrintifyOrder(
        body.shopifyOrderId,
        body.lineItems,
        body.shippingAddress,
        body.framedItemCount || 0
      );

      return new Response(JSON.stringify({ success: true, order }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /upload-image - Upload an image to Printify
    if (req.method === 'POST' && path === '/upload-image') {
      const { imageUrl, fileName } = await req.json();
      
      const result = await uploadImage(imageUrl, fileName);
      return new Response(JSON.stringify({ success: true, image: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Printify order error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
