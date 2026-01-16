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

// 5% marketplace fee distribution constants
const MARKETPLACE_FEE_RATE = 0.05;
const FEE_DISTRIBUTION = {
  companyProfit: 0.25,  // 25% extractable cash reserve
  gamecardPool: 0.25,   // 25% to game attribution
  palettePool: 0.25,    // 25% to palette attribution
  openingPool: 0.15,    // 15% to opening attribution
  platformOps: 0.10,    // 10% to platform operations
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

    // Check transfer rate limit (max 3 per 24 hours) before completing
    const { data: canTransfer, error: transferCheckError } = await supabaseClient
      .rpc('can_transfer_visualization', { p_visualization_id: listing.visualization_id });

    if (transferCheckError) {
      logStep("Error checking transfer limit", { error: transferCheckError.message });
      throw new Error("Failed to check transfer limits");
    }

    if (!canTransfer) {
      throw new Error("This vision has reached its transfer limit (3 per 24h). Payment will be refunded if applicable.");
    }
    logStep("Transfer limit check passed");

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

    const priceCents = listing.price_cents || 0;

    // Calculate 5% fee and distribution
    const totalFeeCents = Math.round(priceCents * MARKETPLACE_FEE_RATE);
    const sellerReceivesCents = priceCents - totalFeeCents;
    const companyProfitCents = Math.round(totalFeeCents * FEE_DISTRIBUTION.companyProfit);
    const gamecardPoolCents = Math.round(totalFeeCents * FEE_DISTRIBUTION.gamecardPool);
    const palettePoolCents = Math.round(totalFeeCents * FEE_DISTRIBUTION.palettePool);
    const openingPoolCents = Math.round(totalFeeCents * FEE_DISTRIBUTION.openingPool);
    const reinvestedCents = totalFeeCents - companyProfitCents;

    logStep("Fee calculation", { 
      priceCents, 
      totalFeeCents, 
      sellerReceivesCents,
      companyProfitCents,
      reinvestedCents
    });

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

    // Record the transfer
    const { error: recordError } = await supabaseClient
      .from('visualization_transfers')
      .insert({
        visualization_id: listing.visualization_id,
        from_user_id: listing.seller_id,
        to_user_id: user.id,
        transfer_type: 'purchase',
      });

    if (recordError) {
      logStep("Warning: Failed to record transfer", { error: recordError.message });
    }

    // Record trade interaction for vision scoring
    await supabaseClient.rpc('record_vision_interaction', {
      p_visualization_id: listing.visualization_id,
      p_user_id: user.id,
      p_interaction_type: 'trade',
      p_value_cents: priceCents,
      p_ip_hash: null,
    });

    // Get game, palette, and opening info for attribution
    const { data: vizData } = await supabaseClient
      .from('saved_visualizations')
      .select('game_data')
      .eq('id', listing.visualization_id)
      .single();

    const gameId = vizData?.game_data?.id as string || null;
    const paletteId = vizData?.game_data?.palette?.id as string || null;
    const openingEco = vizData?.game_data?.eco as string || vizData?.game_data?.opening?.eco as string || null;

    logStep("Attribution data", { gameId, paletteId, openingEco });

    // Record company profit (25% of 5% fee - extractable cash reserve)
    const { error: profitError } = await supabaseClient
      .from('company_profit_pool')
      .upsert({
        source_type: 'marketplace',
        period_date: new Date().toISOString().split('T')[0],
        gross_revenue_cents: priceCents,
        net_profit_cents: totalFeeCents,
        extractable_profit_cents: companyProfitCents,
        reinvested_cents: reinvestedCents,
      }, {
        onConflict: 'source_type,period_date',
      });

    if (profitError) {
      logStep("Warning: Failed to record company profit", { error: profitError.message });
    }

    // Update gamecard pool if game exists
    if (gameId) {
      const gameTitle = vizData?.game_data?.event as string || gameId;
      const { error: gcError } = await supabaseClient
        .from('gamecard_value_pool')
        .upsert({
          game_id: gameId,
          game_title: gameTitle,
          earned_value_cents: gamecardPoolCents,
          total_interactions: 1,
          total_visions: 0,
          total_print_orders: 0,
          last_interaction_at: new Date().toISOString(),
        }, { onConflict: 'game_id' });
      if (gcError) logStep("Warning: gamecard pool update failed", { error: gcError.message });
      else logStep("Gamecard pool updated", { gameId, cents: gamecardPoolCents });
    }

    // Update palette pool if palette exists
    if (paletteId) {
      const paletteName = vizData?.game_data?.palette?.name as string || paletteId;
      const { error: ppError } = await supabaseClient
        .from('palette_value_pool')
        .upsert({
          palette_id: paletteId,
          palette_name: paletteName,
          earned_value_cents: palettePoolCents,
          total_interactions: 1,
          total_visions_using: 0,
          total_print_orders: 0,
          last_interaction_at: new Date().toISOString(),
        }, { onConflict: 'palette_id' });
      if (ppError) logStep("Warning: palette pool update failed", { error: ppError.message });
      else logStep("Palette pool updated", { paletteId, cents: palettePoolCents });
    }

    // Update opening pool if opening exists
    if (openingEco) {
      const openingName = vizData?.game_data?.opening?.name as string || openingEco;
      const { error: opError } = await supabaseClient
        .from('opening_value_pool')
        .upsert({
          opening_eco: openingEco,
          opening_name: openingName,
          earned_value_cents: openingPoolCents,
          total_interactions: 1,
          total_marketplace_trades: 1,
          total_visions_using: 0,
          total_print_orders: 0,
          last_interaction_at: new Date().toISOString(),
        }, { onConflict: 'opening_eco' });
      if (opError) logStep("Warning: opening pool update failed", { error: opError.message });
      else logStep("Opening pool updated", { openingEco, cents: openingPoolCents });
    }

    logStep("Trade interaction recorded", { visualizationId: listing.visualization_id, priceCents });
    logStep("Transfer completed successfully");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Visualization transferred successfully!",
      visualizationId: listing.visualization_id,
      economics: {
        priceCents,
        feeCents: totalFeeCents,
        sellerReceivesCents,
        companyProfitCents,
        reinvestedCents,
      }
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