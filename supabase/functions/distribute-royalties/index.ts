import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DISTRIBUTE-ROYALTIES] ${step}${detailsStr}`);
};

// Fee distribution constants (of the 5% marketplace fee)
const FEE_DISTRIBUTION = {
  companyProfit: 0.25,    // 25% extractable cash reserve
  gamecardPool: 0.25,     // 25% to game attribution
  palettePool: 0.25,      // 25% to palette attribution
  openingPool: 0.15,      // 15% to opening attribution
  platformOps: 0.10,      // 10% to platform operations
};

interface RoyaltyDistribution {
  listingId: string;
  visualizationId: string;
  sellerId: string;
  buyerId: string;
  saleAmountCents: number;
  marketplaceFeeCents: number;
  sellerProceedsCents: number;
  distributions: {
    companyProfit: number;
    gamecardPool: number;
    palettePool: number;
    openingPool: number;
    platformOps: number;
  };
  gameId?: string;
  paletteId?: string;
  openingEco?: string;
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

    // Authenticate - require service role or authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    // Allow service calls or webhook calls
    const isServiceCall = token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!isServiceCall && (userError || !userData.user)) {
      throw new Error("Authentication required");
    }

    // Parse input
    const body = await req.json();
    const { 
      listingId, 
      visualizationId, 
      sellerId, 
      buyerId, 
      saleAmountCents, 
      paymentIntentId 
    } = body;

    if (!listingId || !visualizationId || !sellerId || !buyerId || saleAmountCents === undefined) {
      throw new Error("Missing required fields: listingId, visualizationId, sellerId, buyerId, saleAmountCents");
    }

    logStep("Processing royalties", { listingId, saleAmountCents });

    // Calculate fee breakdown
    const marketplaceFeeCents = Math.round(saleAmountCents * 0.05);
    const sellerProceedsCents = saleAmountCents - marketplaceFeeCents;

    const distributions = {
      companyProfit: Math.round(marketplaceFeeCents * FEE_DISTRIBUTION.companyProfit),
      gamecardPool: Math.round(marketplaceFeeCents * FEE_DISTRIBUTION.gamecardPool),
      palettePool: Math.round(marketplaceFeeCents * FEE_DISTRIBUTION.palettePool),
      openingPool: Math.round(marketplaceFeeCents * FEE_DISTRIBUTION.openingPool),
      platformOps: Math.round(marketplaceFeeCents * FEE_DISTRIBUTION.platformOps),
    };

    logStep("Fee breakdown calculated", { 
      marketplaceFeeCents, 
      sellerProceedsCents, 
      distributions 
    });

    // Get visualization game data for attribution
    const { data: vizData } = await supabaseClient
      .from('saved_visualizations')
      .select('game_data')
      .eq('id', visualizationId)
      .single();

    const gameId = (vizData?.game_data as Record<string, unknown>)?.id as string || null;
    const paletteId = ((vizData?.game_data as Record<string, unknown>)?.palette as Record<string, unknown>)?.id as string || null;
    const openingEco = (vizData?.game_data as Record<string, unknown>)?.eco as string || 
                       ((vizData?.game_data as Record<string, unknown>)?.opening as Record<string, unknown>)?.eco as string || null;

    logStep("Attribution data", { gameId, paletteId, openingEco });

    // Record royalty distribution
    const { error: royaltyError } = await supabaseClient
      .from('royalty_distributions')
      .insert({
        payment_intent_id: paymentIntentId || null,
        visualization_id: visualizationId,
        listing_id: listingId,
        creator_id: sellerId,
        buyer_id: buyerId,
        seller_id: sellerId,
        sale_amount_cents: saleAmountCents,
        marketplace_fee_cents: marketplaceFeeCents,
        creator_royalty_cents: sellerProceedsCents,
        platform_share_cents: marketplaceFeeCents,
        seller_proceeds_cents: sellerProceedsCents,
        distribution_metadata: {
          distributions,
          game_id: gameId,
          palette_id: paletteId,
          opening_eco: openingEco,
        }
      });

    if (royaltyError) {
      logStep("Warning: Failed to record royalty distribution", { error: royaltyError.message });
    }

    // Record company profit
    const today = new Date().toISOString().split('T')[0];
    const { error: profitError } = await supabaseClient
      .from('company_profit_pool')
      .upsert({
        source_type: 'marketplace',
        period_date: today,
        gross_revenue_cents: saleAmountCents,
        net_profit_cents: marketplaceFeeCents,
        extractable_profit_cents: distributions.companyProfit,
        reinvested_cents: marketplaceFeeCents - distributions.companyProfit,
      }, {
        onConflict: 'source_type,period_date',
      });

    if (profitError) {
      logStep("Warning: Failed to record company profit", { error: profitError.message });
    }

    // Update gamecard pool if game exists
    if (gameId && distributions.gamecardPool > 0) {
      const gameTitle = (vizData?.game_data as Record<string, unknown>)?.event as string || gameId;
      const { error: gcError } = await supabaseClient
        .from('gamecard_value_pool')
        .upsert({
          game_id: gameId,
          game_title: gameTitle,
          earned_value_cents: distributions.gamecardPool,
          total_interactions: 1,
          total_visions: 0,
          total_print_orders: 0,
          last_interaction_at: new Date().toISOString(),
        }, { onConflict: 'game_id' });
      
      if (gcError) {
        logStep("Warning: gamecard pool update failed", { error: gcError.message });
      } else {
        logStep("Gamecard pool updated", { gameId, cents: distributions.gamecardPool });
      }
    }

    // Update palette pool if palette exists
    if (paletteId && distributions.palettePool > 0) {
      const paletteName = ((vizData?.game_data as Record<string, unknown>)?.palette as Record<string, unknown>)?.name as string || paletteId;
      const { error: ppError } = await supabaseClient
        .from('palette_value_pool')
        .upsert({
          palette_id: paletteId,
          palette_name: paletteName,
          earned_value_cents: distributions.palettePool,
          total_interactions: 1,
          total_visions_using: 0,
          total_print_orders: 0,
          total_marketplace_trades: 1,
          last_interaction_at: new Date().toISOString(),
        }, { onConflict: 'palette_id' });
      
      if (ppError) {
        logStep("Warning: palette pool update failed", { error: ppError.message });
      } else {
        logStep("Palette pool updated", { paletteId, cents: distributions.palettePool });
      }
    }

    // Update opening pool if opening exists
    if (openingEco && distributions.openingPool > 0) {
      const openingName = ((vizData?.game_data as Record<string, unknown>)?.opening as Record<string, unknown>)?.name as string || openingEco;
      const { error: opError } = await supabaseClient
        .from('opening_value_pool')
        .upsert({
          opening_eco: openingEco,
          opening_name: openingName,
          earned_value_cents: distributions.openingPool,
          total_interactions: 1,
          total_marketplace_trades: 1,
          total_visions_using: 0,
          total_print_orders: 0,
          last_interaction_at: new Date().toISOString(),
        }, { onConflict: 'opening_eco' });
      
      if (opError) {
        logStep("Warning: opening pool update failed", { error: opError.message });
      } else {
        logStep("Opening pool updated", { openingEco, cents: distributions.openingPool });
      }
    }

    // Record trade interaction for vision scoring
    await supabaseClient.rpc('record_vision_interaction', {
      p_visualization_id: visualizationId,
      p_user_id: buyerId,
      p_interaction_type: 'trade',
      p_value_cents: saleAmountCents,
      p_ip_hash: null,
    });

    logStep("Royalty distribution completed successfully");

    const distribution: RoyaltyDistribution = {
      listingId,
      visualizationId,
      sellerId,
      buyerId,
      saleAmountCents,
      marketplaceFeeCents,
      sellerProceedsCents,
      distributions,
      gameId: gameId || undefined,
      paletteId: paletteId || undefined,
      openingEco: openingEco || undefined,
    };

    return new Response(JSON.stringify({ 
      success: true, 
      distribution 
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
