import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CEO email - the only person who can be auto-granted admin
const CEO_EMAIL = 'alec@enpensent.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this is the CEO
    if (user.email?.toLowerCase() !== CEO_EMAIL.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'Only the CEO can use this endpoint', granted: false }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already admin
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (existingRole) {
      return new Response(
        JSON.stringify({ message: 'Already an admin', granted: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Grant admin role
    const { error: insertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: user.id,
        role: 'admin',
      });

    if (insertError) {
      throw insertError;
    }

    console.log(`Admin role granted to CEO: ${user.email}`);

    return new Response(
      JSON.stringify({ message: 'Admin role granted successfully', granted: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error granting admin:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
