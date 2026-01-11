import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SHOPIFY_WEBHOOK_SECRET = Deno.env.get('SHOPIFY_WEBHOOK_SECRET');

interface ShopifyOrder {
  id: number;
  name: string;
  email: string;
  line_items: Array<{
    id: number;
    title: string;
    quantity: number;
    sku: string;
    variant_title: string;
    properties: Array<{ name: string; value: string }>;
  }>;
  shipping_address: {
    first_name: string;
    last_name: string;
    address1: string;
    address2: string;
    city: string;
    province: string;
    country: string;
    zip: string;
    phone: string;
  };
  note_attributes: Array<{ name: string; value: string }>;
}

/**
 * Verify Shopify webhook HMAC signature
 */
function verifyShopifyHmac(rawBody: string, hmacHeader: string): boolean {
  if (!SHOPIFY_WEBHOOK_SECRET || !hmacHeader) {
    return false;
  }
  
  const hash = createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('base64');
  
  // Use timing-safe comparison
  if (hash.length !== hmacHeader.length) {
    return false;
  }
  
  let mismatch = 0;
  for (let i = 0; i < hash.length; i++) {
    mismatch |= hash.charCodeAt(i) ^ hmacHeader.charCodeAt(i);
  }
  
  return mismatch === 0;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get raw body for HMAC verification
    const rawBody = await req.text();
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
    const topic = req.headers.get('x-shopify-topic');
    
    console.log('Received Shopify webhook:', topic);

    // Verify HMAC signature
    if (!hmacHeader) {
      console.error('Missing HMAC header');
      return new Response(JSON.stringify({ error: 'Missing HMAC signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!SHOPIFY_WEBHOOK_SECRET) {
      console.error('SHOPIFY_WEBHOOK_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!verifyShopifyHmac(rawBody, hmacHeader)) {
      console.error('HMAC validation failed - potential forged webhook');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('HMAC validation passed');

    // Only process order creation webhooks
    if (topic !== 'orders/create' && topic !== 'orders/paid') {
      return new Response(JSON.stringify({ message: 'Webhook received but not processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the validated body
    const order: ShopifyOrder = JSON.parse(rawBody);
    console.log('Processing order:', order.name);

    // Validate required fields
    if (!order.email) {
      console.error('Missing required order email');
      return new Response(JSON.stringify({ error: 'Invalid order data: missing email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract chess visualization orders (by SKU pattern)
    const chessOrders = order.line_items.filter(item => 
      item.sku?.startsWith('CHESS-PRINT-')
    );

    if (chessOrders.length === 0) {
      console.log('No chess print items in order, skipping');
      return new Response(JSON.stringify({ message: 'No chess prints to fulfill' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract custom print data from line item properties or note attributes
    const lineItems = chessOrders.map(item => {
      // Find the custom image URL from properties
      const imageProperty = item.properties?.find(p => p.name === '_custom_image_url');
      const customImageUrl = imageProperty?.value || '';

      // Parse size from variant title (e.g., "8×10\"")
      const size = item.variant_title || '';

      return {
        title: item.title,
        quantity: item.quantity,
        sku: item.sku,
        size,
        customImageUrl,
      };
    });

    // Call the Printify order edge function
    const printifyResponse = await fetch(`${SUPABASE_URL}/functions/v1/printify-order/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        shopifyOrderId: order.name,
        lineItems,
        shippingAddress: {
          first_name: order.shipping_address?.first_name || '',
          last_name: order.shipping_address?.last_name || '',
          email: order.email,
          phone: order.shipping_address?.phone || '',
          country: order.shipping_address?.country || 'CA',
          region: order.shipping_address?.province || '',
          address1: order.shipping_address?.address1 || '',
          address2: order.shipping_address?.address2 || '',
          city: order.shipping_address?.city || '',
          zip: order.shipping_address?.zip || '',
        },
      }),
    });

    if (!printifyResponse.ok) {
      const errorText = await printifyResponse.text();
      console.error('Printify order creation failed:', errorText);
      throw new Error(`Printify order failed: ${errorText}`);
    }

    const printifyResult = await printifyResponse.json();
    console.log('Printify order created:', printifyResult);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Order sent to Printify',
      printifyOrder: printifyResult 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
