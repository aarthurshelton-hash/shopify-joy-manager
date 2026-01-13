import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SHOPIFY_WEBHOOK_SECRET = Deno.env.get('SHOPIFY_WEBHOOK_SECRET');

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SHOPIFY-WEBHOOK] ${step}${detailsStr}`);
};

interface ShopifyOrder {
  id: number;
  name: string;
  email: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  line_items: Array<{
    id: number;
    title: string;
    quantity: number;
    price: string;
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

// Estimated costs per product type (in cents)
const FULFILLMENT_COSTS = {
  print_small: 800,    // $8.00 for 8x10, 11x14
  print_medium: 1200,  // $12.00 for 12x16, 16x20
  print_large: 1800,   // $18.00 for 18x24, 24x36
  framed: 2500,        // $25.00 for framed canvas
  infocard: 300,       // $3.00 for info cards
  book_standard: 3500, // $35.00 for standard book
  book_large: 5000,    // $50.00 for large book
};

// Platform fee rates (percentage as decimal)
const SHOPIFY_FEE_RATE = 0.029 + 0.003; // 2.9% + 0.3% payment processing
const STRIPE_FEE_RATE = 0.029;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");
    
    // Get raw body for HMAC verification
    const rawBody = await req.text();
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
    const topic = req.headers.get('x-shopify-topic');
    
    logStep("Processing topic", { topic });

    // Verify HMAC signature
    if (!hmacHeader) {
      logStep("ERROR: Missing HMAC header");
      return new Response(JSON.stringify({ error: 'Missing HMAC signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!SHOPIFY_WEBHOOK_SECRET) {
      logStep("ERROR: SHOPIFY_WEBHOOK_SECRET not configured");
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!verifyShopifyHmac(rawBody, hmacHeader)) {
      logStep("ERROR: HMAC validation failed - potential forged webhook");
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logStep("HMAC validation passed");

    // Only process order paid webhooks (ensures payment is confirmed)
    if (topic !== 'orders/paid') {
      logStep("Skipping non-payment webhook", { topic });
      return new Response(JSON.stringify({ message: 'Webhook received but not processed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the validated body
    const order: ShopifyOrder = JSON.parse(rawBody);
    logStep("Processing paid order", { orderName: order.name, email: order.email, totalPrice: order.total_price });

    // Validate required fields
    if (!order.email) {
      logStep("ERROR: Missing required order email");
      return new Response(JSON.stringify({ error: 'Invalid order data: missing email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false }
    });

    // Find user by email
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users.find(u => u.email?.toLowerCase() === order.email.toLowerCase());
    const userId = user?.id || null;
    logStep("User lookup", { found: !!user, userId });

    // Extract chess visualization orders (by SKU pattern)
    const chessOrders = order.line_items.filter(item => 
      item.sku?.startsWith('CHESS-PRINT-') || 
      item.sku?.startsWith('CHESS-FRAME-') ||
      item.sku?.startsWith('CHESS-BOOK-') ||
      item.sku?.startsWith('CHESS-CARD-')
    );

    // Calculate financials for each item
    let totalGrossRevenue = 0;
    let totalFulfillmentCosts = 0;
    const visionUpdates: { visualizationId: string; valueCents: number; gameId?: string; paletteId?: string }[] = [];

    for (const item of chessOrders) {
      const itemRevenue = Math.round(parseFloat(item.price) * 100 * item.quantity);
      totalGrossRevenue += itemRevenue;
      
      // Determine fulfillment cost
      let fulfillmentCost = 0;
      let orderType = 'print_order';
      
      if (item.sku?.includes('FRAME')) {
        fulfillmentCost = FULFILLMENT_COSTS.framed;
        orderType = 'framed_print';
      } else if (item.sku?.includes('BOOK')) {
        fulfillmentCost = item.sku.includes('LARGE') ? FULFILLMENT_COSTS.book_large : FULFILLMENT_COSTS.book_standard;
        orderType = 'book_order';
      } else if (item.sku?.includes('CARD')) {
        fulfillmentCost = FULFILLMENT_COSTS.infocard;
        orderType = 'info_card';
      } else {
        // Standard print - determine by size
        const size = item.variant_title || '';
        if (size.includes('24') || size.includes('36')) {
          fulfillmentCost = FULFILLMENT_COSTS.print_large;
        } else if (size.includes('16') || size.includes('18')) {
          fulfillmentCost = FULFILLMENT_COSTS.print_medium;
        } else {
          fulfillmentCost = FULFILLMENT_COSTS.print_small;
        }
      }
      
      totalFulfillmentCosts += fulfillmentCost * item.quantity;
      
      // Extract visualization ID from properties
      const vizIdProperty = item.properties?.find(p => p.name === '_visualization_id');
      const gameIdProperty = item.properties?.find(p => p.name === '_game_id');
      const paletteIdProperty = item.properties?.find(p => p.name === '_palette_id');
      
      if (vizIdProperty?.value) {
        visionUpdates.push({
          visualizationId: vizIdProperty.value,
          valueCents: itemRevenue,
          gameId: gameIdProperty?.value,
          paletteId: paletteIdProperty?.value,
        });
      }
      
      logStep("Processed line item", { 
        sku: item.sku, 
        orderType, 
        revenue: itemRevenue, 
        fulfillmentCost: fulfillmentCost * item.quantity,
        vizId: vizIdProperty?.value 
      });
    }

    // Calculate platform fees
    const grossRevenueDollars = totalGrossRevenue / 100;
    const shopifyFees = Math.round(grossRevenueDollars * SHOPIFY_FEE_RATE * 100);
    const platformFees = shopifyFees; // Shopify handles payment processing

    // Record order financials with distribution
    if (chessOrders.length > 0) {
      const primaryVision = visionUpdates[0];
      
      const { data: financialId, error: financialError } = await supabase.rpc('record_order_with_distribution', {
        p_order_type: chessOrders.some(i => i.sku?.includes('BOOK')) ? 'book_order' : 'print_order',
        p_order_reference: order.name,
        p_gross_revenue_cents: totalGrossRevenue,
        p_platform_fees_cents: platformFees,
        p_fulfillment_costs_cents: totalFulfillmentCosts,
        p_user_id: userId,
        p_visualization_id: primaryVision?.visualizationId || null,
        p_game_id: primaryVision?.gameId || null,
        p_palette_id: primaryVision?.paletteId || null,
      });

      if (financialError) {
        logStep("ERROR: Failed to record order financials", { error: financialError.message });
      } else {
        logStep("Order financials recorded", { financialId });
      }

      // Record print order interactions for each vision
      for (const update of visionUpdates) {
        const { error: interactionError } = await supabase.rpc('record_vision_interaction', {
          p_visualization_id: update.visualizationId,
          p_user_id: userId,
          p_interaction_type: 'print_order',
          p_value_cents: update.valueCents,
          p_ip_hash: null,
        });
        
        if (interactionError) {
          logStep("ERROR: Failed to record vision interaction", { 
            vizId: update.visualizationId, 
            error: interactionError.message 
          });
        } else {
          logStep("Vision interaction recorded", { vizId: update.visualizationId, valueCents: update.valueCents });
        }
      }
    }

    // Call the Printify order edge function for fulfillment
    if (chessOrders.length > 0) {
      const lineItems = chessOrders.map(item => {
        const imageProperty = item.properties?.find(p => p.name === '_custom_image_url');
        const customImageUrl = imageProperty?.value || '';
        const size = item.variant_title || '';

        return {
          title: item.title,
          quantity: item.quantity,
          sku: item.sku,
          size,
          customImageUrl,
          productType: item.sku?.includes('FRAME') ? 'frame' : 
                       item.sku?.includes('BOOK') ? 'book' : 
                       item.sku?.includes('CARD') ? 'infocard' : 'print',
        };
      });

      const printifyResponse = await fetch(`${SUPABASE_URL}/functions/v1/printify-order/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
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
        logStep("WARNING: Printify order creation failed", { error: errorText });
        // Don't throw - we still recorded the financials
      } else {
        const printifyResult = await printifyResponse.json();
        logStep("Printify order created", { orderId: printifyResult.order?.id });
      }
    }

    logStep("Order processing complete", {
      orderName: order.name,
      grossRevenue: totalGrossRevenue,
      fulfillmentCosts: totalFulfillmentCosts,
      platformFees,
      visionsUpdated: visionUpdates.length,
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Order processed and financials recorded',
      grossRevenue: totalGrossRevenue,
      visionsUpdated: visionUpdates.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logStep("ERROR: Webhook processing error", { error: error instanceof Error ? error.message : String(error) });
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
