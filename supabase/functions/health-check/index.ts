import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheckResult {
  check_id: string;
  issues_found: number;
  issues_fixed: number;
  details: Record<string, number>;
  completed_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting automated health check...');

    // Run data integrity validation
    const { data: integrityResult, error: integrityError } = await supabase
      .rpc('validate_and_fix_data_integrity');

    if (integrityError) {
      console.error('Data integrity check error:', integrityError);
      throw integrityError;
    }

    console.log('Data integrity check completed:', integrityResult);

    // Additional health checks
    const healthChecks: Record<string, unknown> = {
      data_integrity: integrityResult,
    };

    // Check for stale realtime subscriptions (active games with no recent activity)
    const { data: staleGames, error: staleError } = await supabase
      .from('chess_games')
      .select('id')
      .eq('status', 'active')
      .lt('last_move_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!staleError && staleGames && staleGames.length > 0) {
      // Mark stale games as abandoned
      const { error: updateError } = await supabase
        .from('chess_games')
        .update({ status: 'abandoned', completed_at: new Date().toISOString() })
        .eq('status', 'active')
        .lt('last_move_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (!updateError) {
        healthChecks.stale_games_abandoned = staleGames.length;
      }
    }

    // Check for unread notifications older than 30 days
    const { data: oldNotifications, error: notifError } = await supabase
      .from('subscription_notifications')
      .delete()
      .is('read_at', null)
      .lt('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .select('id');

    if (!notifError && oldNotifications) {
      healthChecks.old_unread_notifications_cleaned = oldNotifications.length;
    }

    // Check for orphaned scan history (no user and old)
    const { data: orphanedScans, error: scanError } = await supabase
      .from('scan_history')
      .delete()
      .is('user_id', null)
      .lt('scanned_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .select('id');

    if (!scanError && orphanedScans) {
      healthChecks.orphaned_scans_cleaned = orphanedScans.length;
    }

    // Log to security audit
    await supabase.rpc('log_security_event', {
      p_action_type: 'automated_health_check',
      p_action_category: 'system',
      p_severity: 'info',
      p_metadata: healthChecks,
    });

    const totalIssuesFixed = (integrityResult as HealthCheckResult)?.issues_fixed || 0;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Health check completed successfully',
        issues_fixed: totalIssuesFixed,
        results: healthChecks,
        executed_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Health check failed:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        executed_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
