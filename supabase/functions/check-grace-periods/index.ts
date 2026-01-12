import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GRACE-PERIOD-CHECK] ${step}${detailsStr}`);
};

// Grace period duration
const GRACE_PERIOD_DAYS = 7;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting grace period check");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get all users with active grace periods
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select('user_id, grace_period_end, grace_notified_at')
      .not('grace_period_end', 'is', null)
      .in('subscription_status', ['canceled', 'unpaid', 'past_due', 'paused']);

    if (subError) {
      throw new Error(`Failed to fetch subscriptions: ${subError.message}`);
    }

    logStep("Found subscriptions with grace period", { count: subscriptions?.length || 0 });

    const now = new Date();
    let expiredCount = 0;
    let reminderCount = 0;

    for (const sub of subscriptions || []) {
      const gracePeriodEnd = new Date(sub.grace_period_end);
      const daysRemaining = Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Check if grace period has expired
      if (gracePeriodEnd <= now) {
        logStep("Grace period expired, releasing visions", { userId: sub.user_id });
        
        // Release visions
        const { data: releasedCount, error: releaseError } = await supabase
          .rpc('release_user_visions', { p_user_id: sub.user_id });

        if (releaseError) {
          logStep("Error releasing visions", { error: releaseError.message, userId: sub.user_id });
          continue;
        }

        // Clear grace period
        await supabase
          .from('user_subscriptions')
          .update({ 
            grace_period_end: null, 
            grace_notified_at: now.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('user_id', sub.user_id);

        // Create notification
        if (releasedCount > 0) {
          await supabase.from('subscription_notifications').insert({
            user_id: sub.user_id,
            notification_type: 'visions_released',
            message: `Your grace period has ended. ${releasedCount} vision(s) have been released to the marketplace and can be claimed by other members.`,
          });
        }

        expiredCount++;
        continue;
      }

      // Send reminder at 3 days and 1 day remaining
      const shouldRemind = (daysRemaining === 3 || daysRemaining === 1);
      const lastNotified = sub.grace_notified_at ? new Date(sub.grace_notified_at) : null;
      const notifiedToday = lastNotified && (now.getTime() - lastNotified.getTime()) < 24 * 60 * 60 * 1000;

      if (shouldRemind && !notifiedToday) {
        // Count user's visions
        const { count: visionCount } = await supabase
          .from('saved_visualizations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', sub.user_id);

        await supabase.from('subscription_notifications').insert({
          user_id: sub.user_id,
          notification_type: 'grace_period_ending',
          message: `Only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left! Your ${visionCount || 0} vision(s) will be released to the marketplace on ${gracePeriodEnd.toLocaleDateString()}. Renew now to keep them.`,
        });

        await supabase
          .from('user_subscriptions')
          .update({ grace_notified_at: now.toISOString() })
          .eq('user_id', sub.user_id);

        reminderCount++;
        logStep("Sent reminder notification", { userId: sub.user_id, daysRemaining });
      }
    }

    logStep("Grace period check complete", { expiredCount, reminderCount });

    return new Response(
      JSON.stringify({ 
        success: true, 
        expired: expiredCount, 
        reminders: reminderCount 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
