import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[PROCESS-WITHDRAWAL] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Verify admin caller
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("User not authenticated");

    // Check admin role
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      throw new Error("Admin access required");
    }

    logStep("Admin verified", { adminId: userData.user.id });

    const { request_id, user_id, amount_cents } = await req.json();

    if (!request_id || !user_id || !amount_cents) {
      throw new Error("Missing required parameters");
    }

    logStep("Processing withdrawal", { request_id, user_id, amount_cents });

    // Use service role for wallet update
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get current wallet
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('user_wallets')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (walletError || !wallet) {
      throw new Error("Wallet not found");
    }

    logStep("Wallet found", { balance: wallet.balance_cents, withdrawn: wallet.total_withdrawn_cents });

    // Update wallet - deduct from balance, add to withdrawn
    const { error: updateError } = await supabaseAdmin
      .from('user_wallets')
      .update({
        balance_cents: wallet.balance_cents - amount_cents,
        total_withdrawn_cents: wallet.total_withdrawn_cents + amount_cents,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user_id);

    if (updateError) {
      throw new Error(`Failed to update wallet: ${updateError.message}`);
    }

    // Record transaction
    const { error: txError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        user_id,
        transaction_type: 'withdrawal',
        amount_cents: -amount_cents,
        balance_after_cents: wallet.balance_cents - amount_cents,
        description: `Withdrawal completed (Request: ${request_id})`,
      });

    if (txError) {
      logStep("Transaction record error", { error: txError.message });
    }

    logStep("Withdrawal processed successfully", { 
      user_id, 
      amount_cents,
      new_balance: wallet.balance_cents - amount_cents 
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
