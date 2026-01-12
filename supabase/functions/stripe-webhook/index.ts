import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Webhook secret for verifying Stripe signatures
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

serve(async (req) => {
  // No CORS for webhooks - they're server-to-server
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 405 });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get the signature from the header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();
    
    // Verify the webhook signature
    let event: Stripe.Event;
    if (endpointSecret) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret);
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err instanceof Error ? err.message : String(err) });
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
      }
    } else {
      // For development without webhook secret
      logStep("WARNING: No webhook secret configured, skipping signature verification");
      event = JSON.parse(body);
    }

    logStep("Event type received", { type: event.type });

    // Initialize Supabase with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle subscription events
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.resumed": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabaseClient, stripe, subscription);
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.paused": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabaseClient, stripe, subscription);
        
        // If subscription is cancelled/paused, release user's visions
        if (subscription.status === 'canceled' || subscription.status === 'paused') {
          await handleSubscriptionCancellation(supabaseClient, stripe, subscription);
        }
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          await handleSubscriptionChange(supabaseClient, stripe, subscription);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await handleSubscriptionChange(supabaseClient, stripe, subscription);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await handleSubscriptionChange(supabaseClient, stripe, subscription);
          
          // After multiple failed payments, subscription may be past_due or canceled
          if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
            await handleSubscriptionCancellation(supabaseClient, stripe, subscription);
          }
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500 });
  }
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionChange(
  supabase: SupabaseClient<any, any, any>,
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  logStep("Processing subscription change", { 
    subscriptionId: subscription.id, 
    status: subscription.status,
    customerId: subscription.customer
  });

  // Get customer to find user email
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (customer.deleted) {
    logStep("Customer was deleted, skipping");
    return;
  }

  const customerEmail = customer.email;
  if (!customerEmail) {
    logStep("No email on customer, skipping");
    return;
  }

  // Find user by email in Supabase
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    logStep("Error fetching users", { error: userError.message });
    return;
  }

  const user = users.users.find((u: { email?: string }) => u.email?.toLowerCase() === customerEmail.toLowerCase());
  if (!user) {
    logStep("No user found for email", { email: customerEmail });
    return;
  }

  logStep("Found user", { userId: user.id, email: customerEmail });

  // Get subscription item details
  const subscriptionItem = subscription.items.data[0];
  const priceId = subscriptionItem?.price?.id;
  const productId = subscriptionItem?.price?.product as string;

  // Map subscription status
  const status = subscription.status;
  const currentPeriodStart = new Date(subscription.current_period_start * 1000);
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

  // Upsert subscription record
  const { error: upsertError } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: user.id,
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      subscription_status: status,
      product_id: productId,
      price_id: priceId,
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (upsertError) {
    logStep("Error upserting subscription", { error: upsertError.message });
    return;
  }

  logStep("Subscription synced successfully", { 
    userId: user.id, 
    status,
    periodEnd: currentPeriodEnd.toISOString()
  });
}

// Handle subscription cancellation - release all user's visions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCancellation(
  supabase: SupabaseClient<any, any, any>,
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  logStep("Processing subscription cancellation - releasing visions", { 
    subscriptionId: subscription.id, 
    status: subscription.status 
  });

  // Get customer to find user
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (customer.deleted) {
    logStep("Customer was deleted, skipping vision release");
    return;
  }

  const customerEmail = customer.email;
  if (!customerEmail) {
    logStep("No email on customer, skipping vision release");
    return;
  }

  // Find user by email
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    logStep("Error fetching users for vision release", { error: userError.message });
    return;
  }

  const user = users.users.find((u: { email?: string }) => u.email?.toLowerCase() === customerEmail.toLowerCase());
  if (!user) {
    logStep("No user found for email, skipping vision release", { email: customerEmail });
    return;
  }

  // Release all visions owned by this user
  const { data: releasedCount, error: releaseError } = await supabase
    .rpc('release_user_visions', { p_user_id: user.id });

  if (releaseError) {
    logStep("Error releasing user visions", { error: releaseError.message, userId: user.id });
    return;
  }

  logStep("Visions released due to subscription cancellation", { 
    userId: user.id, 
    releasedCount: releasedCount || 0 
  });
}
