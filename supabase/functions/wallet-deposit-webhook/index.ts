import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[WALLET-DEPOSIT-WEBHOOK] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      throw new Error("No Stripe signature");
    }

    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    logStep("Event verified", { type: event.type });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Only process wallet deposits
      if (session.metadata?.type !== "wallet_deposit") {
        logStep("Skipping non-wallet-deposit session");
        return new Response(JSON.stringify({ received: true }), { status: 200 });
      }

      const userId = session.metadata.user_id;
      const amountCents = parseInt(session.metadata.amount_cents, 10);

      if (!userId || !amountCents) {
        throw new Error("Missing metadata");
      }

      logStep("Processing wallet deposit", { userId, amountCents });

      // Use service role to update wallet
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      // Ensure wallet exists
      const { error: walletError } = await supabaseAdmin
        .rpc('get_or_create_wallet', { p_user_id: userId });

      if (walletError) {
        logStep("Wallet error", { error: walletError.message });
        throw new Error(`Failed to get wallet: ${walletError.message}`);
      }

      // Optimistic-lock update: read current balance, then update with WHERE clause
      // to prevent race conditions when multiple deposits arrive simultaneously
      const MAX_RETRIES = 3;
      let newBalance = 0;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const { data: currentWallet } = await supabaseAdmin
          .from('user_wallets')
          .select('balance_cents, total_deposited_cents')
          .eq('user_id', userId)
          .single();

        if (!currentWallet) throw new Error("Wallet not found after creation");

        const expectedBalance = currentWallet.balance_cents;
        newBalance = expectedBalance + amountCents;

        const { data: updated, error: updateError } = await supabaseAdmin
          .from('user_wallets')
          .update({
            balance_cents: newBalance,
            total_deposited_cents: currentWallet.total_deposited_cents + amountCents,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('balance_cents', expectedBalance) // Optimistic lock — fails if balance changed
          .select('balance_cents')
          .single();

        if (updateError && attempt < MAX_RETRIES - 1) {
          logStep(`Optimistic lock conflict, retry ${attempt + 1}/${MAX_RETRIES}`);
          continue;
        }

        if (updated) {
          newBalance = updated.balance_cents;
          break;
        }

        if (attempt === MAX_RETRIES - 1) {
          throw new Error("Failed to update wallet after retries — possible concurrent modification");
        }
      }

      // Record transaction
      const { error: txError } = await supabaseAdmin
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          transaction_type: 'deposit',
          amount_cents: amountCents,
          balance_after_cents: newBalance,
          description: `Deposit via Stripe (${session.payment_intent})`,
        });

      if (txError) {
        logStep("Transaction record error", { error: txError.message });
      }

      logStep("Deposit completed successfully", { userId, amountCents, newBalance });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    return new Response(JSON.stringify({ error: message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});
