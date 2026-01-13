import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const timestamp = new Date().toISOString();
  console.log(`[DAILY-SNAPSHOT ${timestamp}] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Daily snapshot function started");

    // Use service role for database access
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Call the snapshot function
    const { error: snapshotError } = await supabaseAdmin.rpc('snapshot_daily_financials');

    if (snapshotError) {
      throw new Error(`Snapshot failed: ${snapshotError.message}`);
    }

    logStep("Daily financial snapshot completed successfully");

    // Also check for pending withdrawals over $100 to alert CEO
    const { data: pendingWithdrawals, error: withdrawalError } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*')
      .eq('status', 'pending')
      .gte('amount_cents', 10000); // $100+

    if (!withdrawalError && pendingWithdrawals && pendingWithdrawals.length > 0) {
      logStep("High-value pending withdrawals detected", { 
        count: pendingWithdrawals.length,
        total_cents: pendingWithdrawals.reduce((sum, w) => sum + w.amount_cents, 0)
      });

      // Create CEO alert notification
      const { data: adminUsers } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminUsers && adminUsers.length > 0) {
        for (const admin of adminUsers) {
          await supabaseAdmin
            .from('subscription_notifications')
            .insert({
              user_id: admin.user_id,
              notification_type: 'ceo_withdrawal_alert',
              message: `${pendingWithdrawals.length} withdrawal request(s) pending over $100. Total: $${(pendingWithdrawals.reduce((sum, w) => sum + w.amount_cents, 0) / 100).toFixed(2)}. Review required.`,
            });
        }
        logStep("CEO alerts created", { admin_count: adminUsers.length });
      }
    }

    // Check for more than 5 pending requests (regardless of amount)
    const { data: allPending, error: allPendingError } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('id')
      .eq('status', 'pending');

    if (!allPendingError && allPending && allPending.length > 5) {
      logStep("Multiple pending withdrawals detected", { count: allPending.length });
      
      const { data: adminUsers } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminUsers && adminUsers.length > 0) {
        for (const admin of adminUsers) {
          await supabaseAdmin
            .from('subscription_notifications')
            .insert({
              user_id: admin.user_id,
              notification_type: 'ceo_withdrawal_backlog',
              message: `${allPending.length} withdrawal requests pending. Backlog building up - review queue.`,
            });
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      timestamp: new Date().toISOString(),
      pending_withdrawals_over_100: pendingWithdrawals?.length || 0,
      total_pending_withdrawals: allPending?.length || 0,
    }), {
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
