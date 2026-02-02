import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Grace period duration in days
const GRACE_PERIOD_DAYS = 7;

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
        
        // Clear grace period if subscription becomes active again
        if (subscription.status === 'active') {
          await clearGracePeriod(supabaseClient, stripe, subscription);
        }
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.paused": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabaseClient, stripe, subscription);
        
        // Start grace period instead of immediately releasing visions
        if (subscription.status === 'canceled' || subscription.status === 'paused') {
          await startGracePeriod(supabaseClient, stripe, subscription);
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
          
          // Clear grace period on successful payment
          if (subscription.status === 'active') {
            await clearGracePeriod(supabaseClient, stripe, subscription);
          }
          
          // Record subscription revenue in financial system
          if (invoice.amount_paid > 0) {
            await recordSubscriptionRevenue(supabaseClient, stripe, invoice);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          await handleSubscriptionChange(supabaseClient, stripe, subscription);
          
          // Start grace period for unpaid/past_due status
          if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
            await startGracePeriod(supabaseClient, stripe, subscription);
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

  // Create notification for expiring subscription
  if (subscription.cancel_at_period_end) {
    const daysUntilExpiry = Math.ceil((currentPeriodEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    await supabase.from('subscription_notifications').insert({
      user_id: user.id,
      notification_type: 'expiring_soon',
      message: `Your subscription will expire in ${daysUntilExpiry} days. After a ${GRACE_PERIOD_DAYS}-day grace period, your visions will be released to the marketplace.`,
    });
    
    logStep("Created expiring subscription notification", { userId: user.id, daysUntilExpiry });
  }

  logStep("Subscription synced successfully", { 
    userId: user.id, 
    status,
    periodEnd: currentPeriodEnd.toISOString()
  });
}

// Start grace period for canceled/paused subscriptions
 
async function startGracePeriod(
  supabase: SupabaseClient<any, any, any>,
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  logStep("Starting grace period", { 
    subscriptionId: subscription.id, 
    status: subscription.status 
  });

  // Get customer to find user
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (customer.deleted) {
    logStep("Customer was deleted, skipping grace period");
    return;
  }

  const customerEmail = customer.email;
  if (!customerEmail) {
    logStep("No email on customer, skipping grace period");
    return;
  }

  // Find user by email
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    logStep("Error fetching users for grace period", { error: userError.message });
    return;
  }

  const user = users.users.find((u: { email?: string }) => u.email?.toLowerCase() === customerEmail.toLowerCase());
  if (!user) {
    logStep("No user found for email, skipping grace period", { email: customerEmail });
    return;
  }

  // Check if grace period already exists
  const { data: existing } = await supabase
    .from('user_subscriptions')
    .select('grace_period_end')
    .eq('user_id', user.id)
    .single();

  if (existing?.grace_period_end) {
    logStep("Grace period already active", { userId: user.id, gracePeriodEnd: existing.grace_period_end });
    return;
  }

  // Calculate grace period end date
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);

  // Set grace period
  const { error: updateError } = await supabase
    .from('user_subscriptions')
    .update({ 
      grace_period_end: gracePeriodEnd.toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id);

  if (updateError) {
    logStep("Error setting grace period", { error: updateError.message });
    return;
  }

  // Count user's visions
  const { count: visionCount } = await supabase
    .from('saved_visualizations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Create notification
  await supabase.from('subscription_notifications').insert({
    user_id: user.id,
    notification_type: 'grace_period_started',
    message: `Your subscription has ended. You have ${GRACE_PERIOD_DAYS} days to renew before your ${visionCount || 0} vision(s) are released to the marketplace. Grace period ends on ${gracePeriodEnd.toLocaleDateString()}.`,
  });

  logStep("Grace period started", { 
    userId: user.id, 
    gracePeriodEnd: gracePeriodEnd.toISOString(),
    visionCount: visionCount || 0
  });
}

// Clear grace period when subscription becomes active
 
async function clearGracePeriod(
  supabase: SupabaseClient<any, any, any>,
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  logStep("Clearing grace period for renewed subscription", { 
    subscriptionId: subscription.id 
  });

  // Get customer to find user
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (customer.deleted) return;

  const customerEmail = customer.email;
  if (!customerEmail) return;

  // Find user by email
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users.find((u: { email?: string }) => u.email?.toLowerCase() === customerEmail.toLowerCase());
  if (!user) return;

  // Check if there was a grace period
  const { data: existing } = await supabase
    .from('user_subscriptions')
    .select('grace_period_end')
    .eq('user_id', user.id)
    .single();

  if (!existing?.grace_period_end) {
    return; // No grace period to clear
  }

  // Clear grace period
  const { error: updateError } = await supabase
    .from('user_subscriptions')
    .update({ 
      grace_period_end: null,
      grace_notified_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', user.id);

  if (updateError) {
    logStep("Error clearing grace period", { error: updateError.message });
    return;
  }

  // Create notification
  await supabase.from('subscription_notifications').insert({
    user_id: user.id,
    notification_type: 'subscription_renewed',
    message: 'Welcome back! Your subscription has been renewed and your visions are safe.',
  });

  logStep("Grace period cleared", { userId: user.id });
}

// Record subscription revenue in financial tracking system
 
async function recordSubscriptionRevenue(
  supabase: SupabaseClient<any, any, any>,
  stripe: Stripe,
  invoice: Stripe.Invoice
) {
  logStep("Recording subscription revenue", { 
    invoiceId: invoice.id,
    amountPaid: invoice.amount_paid,
  });

  try {
    // Get customer to find user
    const customer = await stripe.customers.retrieve(invoice.customer as string);
    if (customer.deleted) return;

    const customerEmail = customer.email;
    if (!customerEmail) return;

    // Find user by email
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users.find((u: { email?: string }) => u.email?.toLowerCase() === customerEmail.toLowerCase());
    const userId = user?.id || null;

    // Calculate platform fees (Stripe takes ~2.9% + 30¢)
    const stripeFees = Math.round(invoice.amount_paid * 0.029 + 30);

    // Record the subscription payment in order_financials
    const { error } = await supabase.rpc('record_order_with_distribution', {
      p_order_type: 'subscription',
      p_order_reference: invoice.id,
      p_gross_revenue_cents: invoice.amount_paid,
      p_platform_fees_cents: stripeFees,
      p_fulfillment_costs_cents: 0, // No fulfillment for subscriptions
      p_user_id: userId,
      p_visualization_id: null,
      p_game_id: null,
      p_palette_id: null,
    });

    if (error) {
      logStep("ERROR: Failed to record subscription revenue", { error: error.message });
    } else {
      logStep("Subscription revenue recorded", { 
        userId, 
        amount: invoice.amount_paid,
        invoiceId: invoice.id 
      });
    }
  } catch (error) {
    logStep("ERROR: Exception recording subscription revenue", { 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}
