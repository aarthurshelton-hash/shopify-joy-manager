import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting scheduled data maintenance...');

    // Call the maintenance function with default parameters
    const { data, error } = await supabase.rpc('perform_data_maintenance', {
      p_days_to_keep_interactions: 90,
      p_days_to_keep_expired_offers: 30,
      p_days_to_keep_notifications: 60,
    });

    if (error) {
      console.error('Maintenance error:', error);
      throw error;
    }

    console.log('Maintenance completed:', data);

    // Log to security audit
    await supabase.rpc('log_security_event', {
      p_action_type: 'data_maintenance_completed',
      p_action_category: 'system',
      p_severity: 'info',
      p_metadata: data,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Data maintenance completed successfully',
        results: data,
        executed_at: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Data maintenance failed:', errorMessage);

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
