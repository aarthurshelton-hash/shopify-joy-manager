import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[COMPLETE-MARKETPLACE-PURCHASE] ${step}${detailsStr}`);
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
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { listingId } = await req.json();
    if (!listingId) throw new Error("Listing ID is required");

    // Fetch the listing
    const { data: listing, error: listingError } = await supabaseClient
      .from('visualization_listings')
      .select('*')
      .eq('id', listingId)
      .eq('status', 'active')
      .single();

    if (listingError || !listing) {
      // Check if already sold to this user
      const { data: soldListing } = await supabaseClient
        .from('visualization_listings')
        .select('*')
        .eq('id', listingId)
        .eq('status', 'sold')
        .eq('buyer_id', user.id)
        .single();

      if (soldListing) {
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Transfer already completed!",
          visualizationId: soldListing.visualization_id
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      throw new Error("Listing not found or no longer available");
    }

    // Verify payment was successful via Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Search for successful checkout session with this listing
    const sessions = await stripe.checkout.sessions.list({
      limit: 10,
    });

    const successfulSession = sessions.data.find(
      (session: Stripe.Checkout.Session) => 
        session.metadata?.listing_id === listingId &&
        session.metadata?.buyer_id === user.id &&
        session.payment_status === 'paid'
    );

    if (!successfulSession) {
      throw new Error("Payment not found or not completed");
    }

    logStep("Payment verified", { sessionId: successfulSession.id });

    // Transfer ownership
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
        stripe_payment_intent_id: successfulSession.payment_intent as string,
      })
      .eq('id', listingId);

    if (listingUpdateError) {
      throw new Error(`Failed to update listing: ${listingUpdateError.message}`);
    }

    // Record trade interaction for vision scoring
    const priceCents = listing.price_cents || 0;
    await supabaseClient.rpc('record_vision_interaction', {
      p_visualization_id: listing.visualization_id,
      p_user_id: user.id,
      p_interaction_type: 'trade',
      p_value_cents: priceCents,
      p_ip_hash: null,
    });

    logStep("Trade interaction recorded", { visualizationId: listing.visualization_id, priceCents });
    logStep("Transfer completed successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Visualization transferred successfully!",
      visualizationId: listing.visualization_id
    }), {
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