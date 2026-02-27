import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found");

      // Check if user was provisioned externally (e.g. Kirvano) with active status
      const { data: profileData } = await supabaseClient
        .from("user_profiles")
        .select("subscription_status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData?.subscription_status === "active") {
        logStep("User has active status from external provisioning, keeping access");
        return new Response(
          JSON.stringify({ subscribed: true, status: "active", source: "external" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      return new Response(
        JSON.stringify({ subscribed: false, status: "no_customer" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active or trialing subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    });

    const activeSub = subscriptions.data.find(
      (s) => s.status === "active" || s.status === "trialing"
    );

    if (activeSub) {
      const subscriptionEnd = new Date(activeSub.current_period_end * 1000).toISOString();
      const trialEnd = activeSub.trial_end
        ? new Date(activeSub.trial_end * 1000).toISOString()
        : null;

      logStep("Active/trialing subscription found", {
        subscriptionId: activeSub.id,
        status: activeSub.status,
        endDate: subscriptionEnd,
        trialEnd,
      });

      // Update profile to active
      await supabaseClient
        .from("user_profiles")
        .update({ subscription_status: "active" })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({
          subscribed: true,
          status: activeSub.status,
          subscription_end: subscriptionEnd,
          trial_end: trialEnd,
          is_trial: activeSub.status === "trialing",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Check for past_due (failed payment after trial)
    const pastDueSub = subscriptions.data.find((s) => s.status === "past_due");
    if (pastDueSub) {
      logStep("Past due subscription found", { subscriptionId: pastDueSub.id });

      await supabaseClient
        .from("user_profiles")
        .update({ subscription_status: "inactive" })
        .eq("user_id", user.id);

      return new Response(
        JSON.stringify({
          subscribed: false,
          status: "past_due",
          message: "Pagamento pendente. Atualize seu método de pagamento.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("No active subscription");

    await supabaseClient
      .from("user_profiles")
      .update({ subscription_status: "inactive" })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({ subscribed: false, status: "inactive" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
