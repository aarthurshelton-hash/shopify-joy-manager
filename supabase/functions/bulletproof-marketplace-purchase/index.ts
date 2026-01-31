import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BULLETPROOF-PURCHASE] ${step}${detailsStr}`);
};

// 5% marketplace fee
const MARKETPLACE_FEE_RATE = 0.05;

// Input validation helper - validates UUID format
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Check if user has premium access (uses database function)
// deno-lint-ignore no-explicit-any
async function checkPremiumStatus(supabase: any, userId: string): Promise<boolean> {
  const { data: isPremium } = await supabase.rpc('is_premium_user', { p_user_id: userId });
  return !!isPremium;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse and validate input
    let requestBody: unknown;
    try {
      requestBody = await req.json();
    } catch {
      throw new Error("Invalid JSON in request body");
    }
    
    if (typeof requestBody !== 'object' || requestBody === null) {
      throw new Error("Request body must be an object");
    }
    
    const body = requestBody as Record<string, unknown>;
    const listingId = body.listingId;
    
    if (typeof listingId !== 'string' || !isValidUUID(listingId)) {
      throw new Error("Invalid listing ID format - must be a valid UUID");
    }
    
    logStep("Request validated", { listingId });

    // Check premium status using database function (no hardcoded emails)
    const isPremium = await checkPremiumStatus(supabaseClient, user.id);
    if (!isPremium) {
      throw new Error("Premium membership required to acquire visions");
    }
    logStep("Premium status verified");

    // Rate limit check
    const { data: rateLimitResult } = await supabaseClient.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_action: 'marketplace-purchase',
      p_resource_id: null,
      p_window_minutes: 60,
      p_max_requests: 10
    });

    if (rateLimitResult && !rateLimitResult.allowed) {
      throw new Error(`Rate limit exceeded. Try again in ${Math.ceil((new Date(rateLimitResult.reset_at).getTime() - Date.now()) / 60000)} minutes.`);
    }
    logStep("Rate limit check passed");

    // Acquire listing lock atomically
    const { data: lockResult, error: lockError } = await supabaseClient.rpc('acquire_listing_lock', {
      p_listing_id: listingId,
      p_buyer_id: user.id,
      p_lock_duration_minutes: 10
    });

    if (lockError) {
      logStep("Lock acquisition error", { error: lockError.message });
      throw new Error("Failed to acquire listing lock");
    }

    if (!lockResult || !lockResult.success) {
      throw new Error(lockResult?.error || "Listing not available or already being processed");
    }

    logStep("Listing lock acquired", { 
      listingId, 
      priceCents: lockResult.price_cents,
      sellerId: lockResult.seller_id 
    });

    const priceCents = lockResult.price_cents as number;
    const sellerId = lockResult.seller_id as string;
    const visualizationId = lockResult.visualization_id as string;

    // Check transfer rate limit (3 per 24 hours per visualization)
    const { data: canTransfer } = await supabaseClient.rpc('can_transfer_visualization', { 
      p_visualization_id: visualizationId 
    });

    if (!canTransfer) {
      throw new Error("This vision has reached its transfer limit (3 per 24h). Try again later.");
    }
    logStep("Transfer limit check passed");

    // Calculate economics
    const totalFeeCents = Math.round(priceCents * MARKETPLACE_FEE_RATE);
    const sellerReceivesCents = priceCents - totalFeeCents;

    logStep("Economics calculated", { 
      priceCents, 
      feeCents: totalFeeCents, 
      sellerReceivesCents 
    });

    // Handle free transfers directly
    if (priceCents === 0) {
      logStep("Free transfer - processing immediately");

      // Use atomic transfer function
      const { data: transferResult } = await supabaseClient.rpc('atomic_transfer_visualization', {
        p_visualization_id: visualizationId,
        p_from_user_id: sellerId,
        p_to_user_id: user.id,
        p_transfer_type: 'free_claim'
      });

      if (!transferResult?.success) {
        throw new Error(transferResult?.error || "Transfer failed");
      }

      // Mark listing as sold
      await supabaseClient
        .from('visualization_listings')
        .update({
          status: 'sold',
          buyer_id: user.id,
          sold_at: new Date().toISOString(),
        })
        .eq('id', listingId);

      // Clear the payment state lock
      await supabaseClient
        .from('payment_states')
        .update({ state: 'completed', completed_at: new Date().toISOString() })
        .eq('listing_id', listingId)
        .eq('buyer_id', user.id)
        .eq('state', 'pending');

      // Log audit event
      await supabaseClient.rpc('log_marketplace_audit', {
        p_user_id: user.id,
        p_action: 'purchase_completed',
        p_resource_type: 'payment',
        p_resource_id: listingId,
        p_metadata: { amount_cents: 0, seller_id: sellerId, visualization_id: visualizationId },
        p_severity: 'low',
        p_ip_address: null,
        p_user_agent: null
      });

      logStep("Free transfer completed");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Visualization transferred successfully!",
        visualizationId,
        economics: {
          priceCents: 0,
          feeCents: 0,
          sellerReceivesCents: 0,
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Paid listing - create Stripe checkout session
    logStep("Paid listing - creating Stripe checkout");
    
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Get visualization title for description
    const { data: vizData } = await supabaseClient
      .from('saved_visualizations')
      .select('title')
      .eq('id', visualizationId)
      .single();

    const vizTitle = vizData?.title || 'Chess Visualization';

    // Get seller display name
    const { data: sellerProfile } = await supabaseClient
      .from('profiles')
      .select('display_name')
      .eq('user_id', sellerId)
      .single();

    const sellerName = sellerProfile?.display_name || 'Collector';

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: vizTitle,
              description: `Vision ownership transfer from ${sellerName}. Seller receives $${(sellerReceivesCents / 100).toFixed(2)} (95%). Platform fee: $${(totalFeeCents / 100).toFixed(2)} (5%).`,
            },
            unit_amount: priceCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/marketplace?success=true&listing=${listingId}`,
      cancel_url: `${req.headers.get("origin")}/marketplace?cancelled=true`,
      metadata: {
        listing_id: listingId,
        buyer_id: user.id,
        visualization_id: visualizationId,
        seller_id: sellerId,
        price_cents: priceCents.toString(),
        fee_cents: totalFeeCents.toString(),
        seller_receives_cents: sellerReceivesCents.toString(),
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 min expiry
    });

    // Update payment state with Stripe session ID
    await supabaseClient
      .from('payment_states')
      .update({ 
        payment_intent_id: session.id,
        state: 'processing'
      })
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .eq('state', 'pending');

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id,
      economics: {
        priceCents,
        feeCents: totalFeeCents,
        sellerReceivesCents,
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    // Log failed attempt
    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: userData } = await supabaseClient.auth.getUser(token);
        if (userData?.user) {
          await supabaseClient.rpc('log_marketplace_audit', {
            p_user_id: userData.user.id,
            p_action: 'purchase_failed',
            p_resource_type: 'payment',
            p_resource_id: null,
            p_metadata: { error: errorMessage },
            p_severity: 'high',
            p_ip_address: null,
            p_user_agent: null
          });
        }
      }
    } catch (auditError) {
      console.error('[BULLETPROOF-PURCHASE] Audit log failed:', auditError);
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
