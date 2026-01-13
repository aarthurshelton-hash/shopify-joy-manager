import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  console.log(`[CEO-WITHDRAWAL-ALERT] ${step}`, details ? JSON.stringify(details) : '');
};

// Alert thresholds
const HIGH_VALUE_THRESHOLD_CENTS = 10000; // $100
const BACKLOG_THRESHOLD = 5;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("CEO withdrawal alert check started");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get all pending withdrawals
    const { data: pendingWithdrawals, error: withdrawalError } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (withdrawalError) {
      throw new Error(`Failed to fetch withdrawals: ${withdrawalError.message}`);
    }

    const alerts: string[] = [];
    let alertLevel = 'normal';

    // Check for high-value withdrawals
    const highValueWithdrawals = (pendingWithdrawals || []).filter(
      w => w.amount_cents >= HIGH_VALUE_THRESHOLD_CENTS
    );

    if (highValueWithdrawals.length > 0) {
      const totalHighValue = highValueWithdrawals.reduce((sum, w) => sum + w.amount_cents, 0);
      alerts.push(`⚠️ ${highValueWithdrawals.length} high-value withdrawal(s) pending ($${(totalHighValue / 100).toFixed(2)} total)`);
      alertLevel = 'high';
      logStep("High-value withdrawals found", { count: highValueWithdrawals.length, total_cents: totalHighValue });
    }

    // Check for backlog
    if ((pendingWithdrawals || []).length > BACKLOG_THRESHOLD) {
      alerts.push(`📋 Withdrawal backlog: ${pendingWithdrawals?.length} requests pending`);
      if (alertLevel !== 'high') alertLevel = 'medium';
      logStep("Backlog detected", { count: pendingWithdrawals?.length });
    }

    // Get admin users to notify
    const { data: adminUsers, error: adminError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (adminError) {
      throw new Error(`Failed to fetch admins: ${adminError.message}`);
    }

    // Send notifications if there are alerts
    if (alerts.length > 0 && adminUsers && adminUsers.length > 0) {
      const combinedMessage = alerts.join(' | ');
      
      for (const admin of adminUsers) {
        // Check if we already sent a similar alert today
        const today = new Date().toISOString().split('T')[0];
        const { data: existingAlerts } = await supabaseAdmin
          .from('subscription_notifications')
          .select('id')
          .eq('user_id', admin.user_id)
          .eq('notification_type', 'ceo_withdrawal_alert')
          .gte('created_at', `${today}T00:00:00Z`)
          .lt('created_at', `${today}T23:59:59Z`);

        // Only send if no alert today
        if (!existingAlerts || existingAlerts.length === 0) {
          await supabaseAdmin
            .from('subscription_notifications')
            .insert({
              user_id: admin.user_id,
              notification_type: 'ceo_withdrawal_alert',
              message: combinedMessage,
            });
          logStep("Alert sent to admin", { admin_id: admin.user_id });
        } else {
          logStep("Skipped duplicate alert", { admin_id: admin.user_id, existing_count: existingAlerts.length });
        }
      }
    }

    // Summary stats
    const summary = {
      total_pending: pendingWithdrawals?.length || 0,
      high_value_count: highValueWithdrawals.length,
      high_value_total_cents: highValueWithdrawals.reduce((sum, w) => sum + w.amount_cents, 0),
      alert_level: alertLevel,
      alerts_sent: alerts.length > 0,
      admins_notified: alerts.length > 0 ? adminUsers?.length || 0 : 0,
    };

    logStep("Alert check completed", summary);

    return new Response(JSON.stringify(summary), {
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
