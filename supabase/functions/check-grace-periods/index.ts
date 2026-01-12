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
// Platform fee percentage (15%), rest goes to education fund (85%)
const PLATFORM_FEE_PERCENT = 15;
const EDUCATION_FUND_PERCENT = 85;

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
    let totalFundContribution = 0;

    for (const sub of subscriptions || []) {
      const gracePeriodEnd = new Date(sub.grace_period_end);
      const daysRemaining = Math.ceil((gracePeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Check if grace period has expired
      if (gracePeriodEnd <= now) {
        logStep("Grace period expired, calculating portfolio value", { userId: sub.user_id });
        
        // Calculate portfolio value before release
        const { data: portfolioValue, error: valueError } = await supabase
          .rpc('calculate_portfolio_value', { p_user_id: sub.user_id });

        if (valueError) {
          logStep("Error calculating portfolio value", { error: valueError.message });
        }

        const forfeitedValueCents = portfolioValue || 0;
        const platformFeeCents = Math.floor(forfeitedValueCents * PLATFORM_FEE_PERCENT / 100);
        const fundContributionCents = Math.floor(forfeitedValueCents * EDUCATION_FUND_PERCENT / 100);

        logStep("Portfolio value calculated", { 
          forfeitedValueCents, 
          platformFeeCents, 
          fundContributionCents 
        });

        // Release visions
        const { data: releasedCount, error: releaseError } = await supabase
          .rpc('release_user_visions', { p_user_id: sub.user_id });

        if (releaseError) {
          logStep("Error releasing visions", { error: releaseError.message, userId: sub.user_id });
          continue;
        }

        // Record to education fund if there was value
        if (forfeitedValueCents > 0) {
          const { error: fundError } = await supabase
            .from('education_fund')
            .insert({
              source_user_id: sub.user_id,
              forfeited_value_cents: forfeitedValueCents,
              platform_fee_cents: platformFeeCents,
              fund_contribution_cents: fundContributionCents,
              visions_released: releasedCount || 0,
              event_type: 'subscription_lapse',
              notes: `Grace period expired. ${releasedCount || 0} visions released to marketplace.`
            });

          if (fundError) {
            logStep("Error recording to education fund", { error: fundError.message });
          } else {
            totalFundContribution += fundContributionCents;
            logStep("Education fund contribution recorded", { fundContributionCents });
          }
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
          let message = `Your grace period has ended. ${releasedCount} vision(s) have been released to the marketplace.`;
          if (fundContributionCents > 0) {
            const fundDollars = (fundContributionCents / 100).toFixed(2);
            message += ` $${fundDollars} from your portfolio value has been contributed to the Chess Education Fund for underprivileged students.`;
          }
          
          await supabase.from('subscription_notifications').insert({
            user_id: sub.user_id,
            notification_type: 'visions_released',
            message,
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
        // Count user's visions and calculate value
        const { count: visionCount } = await supabase
          .from('saved_visualizations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', sub.user_id);

        const { data: portfolioValue } = await supabase
          .rpc('calculate_portfolio_value', { p_user_id: sub.user_id });

        const valueDollars = ((portfolioValue || 0) / 100).toFixed(2);
        const fundContribution = (((portfolioValue || 0) * EDUCATION_FUND_PERCENT / 100) / 100).toFixed(2);

        let message = `Only ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left! Your ${visionCount || 0} vision(s) will be released on ${gracePeriodEnd.toLocaleDateString()}.`;
        if (portfolioValue && portfolioValue > 0) {
          message += ` Portfolio value: $${valueDollars}. If not renewed, $${fundContribution} will go to the Chess Education Fund.`;
        }
        message += ` Renew now to keep them.`;

        await supabase.from('subscription_notifications').insert({
          user_id: sub.user_id,
          notification_type: 'grace_period_ending',
          message,
        });

        await supabase
          .from('user_subscriptions')
          .update({ grace_notified_at: now.toISOString() })
          .eq('user_id', sub.user_id);

        reminderCount++;
        logStep("Sent reminder notification", { userId: sub.user_id, daysRemaining, portfolioValue });
      }
    }

    logStep("Grace period check complete", { 
      expiredCount, 
      reminderCount, 
      totalFundContribution: totalFundContribution / 100 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        expired: expiredCount, 
        reminders: reminderCount,
        fundContributionCents: totalFundContribution
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
