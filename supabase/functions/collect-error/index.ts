import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ErrorReport {
  message: string;
  stack?: string;
  componentName?: string;
  errorType?: string;
  url?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Use auth from request if available
    const authHeader = req.headers.get('Authorization');
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    const body: ErrorReport = await req.json();

    if (!body.message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Error message required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Report the error using the database function
    const { data, error } = await supabase.rpc('report_client_error', {
      p_error_message: body.message,
      p_error_stack: body.stack || null,
      p_component_name: body.componentName || null,
      p_error_type: body.errorType || 'runtime',
      p_url: body.url || null,
      p_user_agent: body.userAgent || null,
      p_metadata: body.metadata || {},
    });

    if (error) {
      console.error('Error reporting failed:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        error_id: data,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Error collection failed:', errorMessage);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
