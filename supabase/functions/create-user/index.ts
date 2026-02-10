import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

interface CreateUserRequest {
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook secret (required)
    const webhookSecret = req.headers.get("x-webhook-secret");
    const expectedSecret = Deno.env.get("WEBHOOK_SECRET");
    
    if (!expectedSecret) {
      console.error("WEBHOOK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Server misconfiguration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (webhookSecret !== expectedSecret) {
      console.error("Invalid webhook secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { email, password, first_name, last_name, phone_number }: CreateUserRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Generate random password if not provided
    const userPassword = password || crypto.randomUUID().slice(0, 16);

    // Create user via Admin API
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: userPassword,
      email_confirm: true, // Auto-confirm email since they purchased
      user_metadata: {
        first_name,
        last_name,
        phone_number,
      },
    });

    if (userError) {
      console.error("Error creating user:", userError);
      return new Response(
        JSON.stringify({ error: userError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user profile
    if (userData.user) {
      const { error: profileError } = await supabaseAdmin
        .from("user_profiles")
        .upsert({
          user_id: userData.user.id,
          first_name: first_name || null,
          last_name: last_name || null,
          phone_number: phone_number || null,
          subscription_status: "active", // Mark as active since they purchased
        }, { onConflict: "user_id" });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        // Don't fail the request, user was created successfully
      }
    }

    console.log("User created successfully:", userData.user?.id);

    return new Response(
      JSON.stringify({
        success: true,
        user_id: userData.user?.id,
        email: userData.user?.email,
        // Only return password if it was auto-generated
        ...(password ? {} : { generated_password: userPassword }),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
