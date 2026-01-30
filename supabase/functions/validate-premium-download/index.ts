import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VALIDATE-PREMIUM-DOWNLOAD] ${step}${detailsStr}`);
};

// Hardcoded visionary emails with permanent premium access
const VISIONARY_EMAILS = [
  'a.arthur.shelton@gmail.com',
  'info@mawuli.xyz',
  'opecoreug@gmail.com', // Product Specialist Analyst - overseas marketplace testing
];

// Validate authorization header format
const validateAuthHeader = (authHeader: string | null): string => {
  if (!authHeader) {
    throw new Error("No authorization header provided");
  }
  
  // Must start with "Bearer " followed by a non-empty token
  if (!authHeader.startsWith("Bearer ") || authHeader.length < 8) {
    throw new Error("Invalid authorization header format");
  }
  
  const token = authHeader.substring(7); // Remove "Bearer "
  
  // Basic JWT format validation (3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some(part => part.length === 0)) {
    throw new Error("Invalid token format");
  }
  
  return token;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client with service role for database access
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Validate and extract token from authorization header
    const authHeader = req.headers.get("Authorization");
    const token = validateAuthHeader(authHeader);

    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user is a visionary (permanent premium)
    if (VISIONARY_EMAILS.includes(user.email.toLowerCase())) {
      logStep("User is a Visionary member", { email: user.email });
      return new Response(JSON.stringify({ 
        allowed: true, 
        reason: "visionary",
        message: "Visionary member - unlimited access"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check subscription status in database
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      logStep("Error fetching subscription", { error: subError.message });
    }

    // Check if subscription is active
    if (subscription) {
      const isActive = subscription.subscription_status === 'active';
      const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
      const isValid = isActive && (!periodEnd || periodEnd > new Date());

      if (isValid) {
        logStep("User has active subscription", { 
          status: subscription.subscription_status,
          periodEnd: periodEnd?.toISOString()
        });
        return new Response(JSON.stringify({ 
          allowed: true, 
          reason: "subscription",
          subscription_end: periodEnd?.toISOString()
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    }

    // No valid subscription found
    logStep("User does not have premium access");
    return new Response(JSON.stringify({ 
      allowed: false, 
      reason: "no_subscription",
      message: "Premium subscription required for HD downloads"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in validate-premium-download", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage, allowed: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
