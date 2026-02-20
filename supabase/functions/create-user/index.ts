import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

interface CreateUserRequest {
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("➡️ create-user called");

    const webhookSecret = req.headers.get("x-webhook-secret");
    const expectedSecret = Deno.env.get("WEBHOOK_SECRET");

    if (webhookSecret !== expectedSecret) {
      console.log("❌ Unauthorized webhook");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, first_name, last_name, phone_number }: CreateUserRequest = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    console.log("🔎 Checking if user exists");

    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers();

    let user = usersList.users.find((u) => u.email === email);

    if (!user) {
      console.log("👤 Creating new user");

      const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          first_name,
          last_name,
          phone_number,
        },
      });

      if (error) throw error;

      user = newUser.user;
    } else {
      console.log("♻️ User already exists");
    }

    console.log("🧾 Upserting profile");

    await supabaseAdmin.from("user_profiles").upsert(
      {
        user_id: user?.id,
        first_name,
        last_name,
        phone_number,
        subscription_status: "active",
        onboarding_completed: false,
      },
      { onConflict: "user_id" },
    );

    console.log("🔗 Generating magic link");

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: "https://kairoapp.lovable.app/primeiro-acesso",
      },
    });

    if (linkError) throw linkError;

    const magicLink = linkData.properties.action_link;

    console.log("✅ Magic link generated");

    return new Response(
      JSON.stringify({
        success: true,
        user_id: user?.id,
        email,
        magic_link: magicLink,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("🔥 Error:", error);

    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
