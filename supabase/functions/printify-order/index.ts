import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PRINTIFY_API_KEY = Deno.env.get('PRINTIFY_API_KEY');
const PRINTIFY_BASE_URL = 'https://api.printify.com/v1';

interface PrintifyShop {
  id: number;
  title: string;
  sales_channel: string;
}

interface OrderLineItem {
  title: string;
  quantity: number;
  sku: string;
  size: string;
  customImageUrl: string;
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

async function getShops(): Promise<PrintifyShop[]> {
  return printifyRequest('/shops.json');
}

async function uploadImage(shopId: number, imageUrl: string, fileName: string) {
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

async function createPrintifyOrder(
  shopId: number,
  shopifyOrderId: string,
  lineItems: OrderLineItem[],
  shippingAddress: ShippingAddress
) {
  const printifyLineItems = [];

  for (const item of lineItems) {
    const sizeConfig = SIZE_TO_BLUEPRINT[item.size];
    if (!sizeConfig) {
      console.error(`Unknown size: ${item.size}`);
      continue;
    }

    // Upload the custom image
    const uploadResult = await uploadImage(
      shopId,
      item.customImageUrl,
      `chess-visualization-${shopifyOrderId}-${Date.now()}.png`
    );

    printifyLineItems.push({
      product_id: null, // Will be created as external product
      blueprint_id: sizeConfig.blueprint_id,
      variant_id: sizeConfig.variant_id,
      print_provider_id: sizeConfig.print_provider_id,
      quantity: item.quantity,
      print_areas: {
        front: uploadResult.id,
      },
    });
  }

  const order = await printifyRequest(`/shops/${shopId}/orders.json`, {
    method: 'POST',
    body: JSON.stringify({
      external_id: shopifyOrderId,
      label: `Chess Visualization - ${shopifyOrderId}`,
      line_items: printifyLineItems,
      shipping_method: 1, // Standard shipping
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
    if (!PRINTIFY_API_KEY) {
      throw new Error('PRINTIFY_API_KEY not configured');
    }

    const url = new URL(req.url);
    const path = url.pathname.replace('/printify-order', '');

    // GET /shops - List available shops
    if (req.method === 'GET' && path === '/shops') {
      const shops = await getShops();
      return new Response(JSON.stringify({ shops }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /create - Create an order
    if (req.method === 'POST' && path === '/create') {
      const body: CreateOrderRequest = await req.json();
      
      // Get the first shop
      const shops = await getShops();
      if (shops.length === 0) {
        throw new Error('No Printify shops found. Please create a shop in Printify first.');
      }
      const shopId = shops[0].id;

      const order = await createPrintifyOrder(
        shopId,
        body.shopifyOrderId,
        body.lineItems,
        body.shippingAddress
      );

      return new Response(JSON.stringify({ success: true, order }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /upload-image - Upload an image to Printify
    if (req.method === 'POST' && path === '/upload-image') {
      const { imageUrl, fileName } = await req.json();
      
      const shops = await getShops();
      if (shops.length === 0) {
        throw new Error('No Printify shops found');
      }
      
      const result = await uploadImage(shops[0].id, imageUrl, fileName);
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