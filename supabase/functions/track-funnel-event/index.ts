import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Valid event types
const VALID_EVENT_TYPES = [
  'modal_view',
  'modal_dismiss', 
  'cta_click',
  'signup_started',
  'signup_completed',
  'free_account_created',
  'checkout_started',
  'subscription_active',
  'free_to_premium',
  'feature_hover'
] as const;

// Rate limiting: max events per IP per minute
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

// In-memory rate limit store (resets on function cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  entry.count++;
  return true;
}

function generateIpHash(ip: string, userAgent: string): string {
  const fingerprint = `${ip}|${userAgent}`;
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client for service role insert
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const { event_type, session_id, trigger_source, metadata } = body;

    // Validate event type
    if (!event_type || !VALID_EVENT_TYPES.includes(event_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid event type' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate session_id format
    if (!session_id || typeof session_id !== 'string' || session_id.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid session ID' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check for authenticated user
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id || null;
    }

    // Generate IP hash for anonymous users only
    const ipHash = userId ? null : generateIpHash(ip, userAgent);

    // Sanitize metadata
    let sanitizedMetadata: string | null = null;
    if (metadata && typeof metadata === 'object') {
      // Only keep allowed metadata fields
      const allowedFields = ['trigger_source', 'feature_id', 'time_on_modal_ms', 'features_viewed'];
      const filtered: Record<string, unknown> = {};
      for (const key of allowedFields) {
        if (key in metadata) {
          filtered[key] = metadata[key];
        }
      }
      sanitizedMetadata = Object.keys(filtered).length > 0 ? JSON.stringify(filtered) : null;
    }

    // Insert event using service role
    const { error } = await supabaseAdmin
      .from('membership_funnel_events')
      .insert({
        event_type,
        user_id: userId,
        session_id: session_id.slice(0, 100), // Ensure max length
        trigger_source: trigger_source?.slice(0, 50) || null,
        ip_hash: ipHash,
        metadata: sanitizedMetadata,
        converted_to_signup: event_type === 'signup_completed',
        converted_to_premium: event_type === 'subscription_active',
      });

    if (error) {
      console.error('Error inserting funnel event:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to record event' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in track-funnel-event:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
