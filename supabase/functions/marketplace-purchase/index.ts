import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MARKETPLACE-PURCHASE] ${step}${detailsStr}`);
};

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if buyer has premium subscription
    const { data: isPremium } = await supabaseClient.rpc('is_premium_user', { p_user_id: user.id });
    if (!isPremium) {
      throw new Error("Premium membership required to acquire visions");
    }
    logStep("Premium status verified");

    const { listingId, action } = await req.json();
    if (!listingId) throw new Error("Listing ID is required");
    logStep("Request payload", { listingId, action });

    // Fetch the listing
    const { data: listing, error: listingError } = await supabaseClient
      .from('visualization_listings')
      .select('*, saved_visualizations(id, title, image_path, user_id)')
      .eq('id', listingId)
      .eq('status', 'active')
      .single();

    if (listingError || !listing) {
      throw new Error("Listing not found or no longer available");
    }
    logStep("Listing found", { listing });

    // Can't buy your own listing
    if (listing.seller_id === user.id) {
      throw new Error("Cannot purchase your own listing");
    }

    const visualization = listing.saved_visualizations;

    // Check transfer rate limit (max 3 per 24 hours)
    const { data: canTransfer, error: transferCheckError } = await supabaseClient
      .rpc('can_transfer_visualization', { p_visualization_id: listing.visualization_id });

    if (transferCheckError) {
      logStep("Error checking transfer limit", { error: transferCheckError.message });
      throw new Error("Failed to check transfer limits");
    }

    if (!canTransfer) {
      const { data: remaining } = await supabaseClient
        .rpc('get_remaining_transfers', { p_visualization_id: listing.visualization_id });
      throw new Error(`This vision has reached its transfer limit (3 per 24h). Try again later. Remaining: ${remaining || 0}`);
    }
    logStep("Transfer limit check passed");

    // If free (gift), transfer immediately
    if (listing.price_cents === 0) {
      logStep("Free transfer - processing immediately");

      // Update the visualization owner
      const { error: transferError } = await supabaseClient
        .from('saved_visualizations')
        .update({ user_id: user.id })
        .eq('id', listing.visualization_id);

      if (transferError) {
        throw new Error(`Transfer failed: ${transferError.message}`);
      }

      // Mark listing as sold
      const { error: listingUpdateError } = await supabaseClient
        .from('visualization_listings')
        .update({
          status: 'sold',
          buyer_id: user.id,
          sold_at: new Date().toISOString(),
        })
        .eq('id', listingId);

      if (listingUpdateError) {
        throw new Error(`Failed to update listing: ${listingUpdateError.message}`);
      }

      // Record the transfer
      const { error: recordError } = await supabaseClient
        .from('visualization_transfers')
        .insert({
          visualization_id: listing.visualization_id,
          from_user_id: listing.seller_id,
          to_user_id: user.id,
          transfer_type: 'free_claim',
        });

      if (recordError) {
        logStep("Warning: Failed to record transfer", { error: recordError.message });
      }

      logStep("Free transfer completed");
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Visualization transferred successfully!",
        visualizationId: listing.visualization_id
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

    // Get seller info for description
    const { data: sellerProfile } = await supabaseClient
      .from('profiles')
      .select('display_name')
      .eq('user_id', listing.seller_id)
      .single();

    const sellerName = sellerProfile?.display_name || 'Collector';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: visualization.title || 'Chess Visualization',
              description: `Ownership transfer from ${sellerName}`,
              images: visualization.image_path ? [visualization.image_path] : undefined,
            },
            unit_amount: listing.price_cents,
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
        visualization_id: listing.visualization_id,
        seller_id: listing.seller_id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
