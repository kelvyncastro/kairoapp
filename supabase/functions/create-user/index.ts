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
    const webhookSecret = req.headers.get("x-webhook-secret");
    const expectedSecret = Deno.env.get("WEBHOOK_SECRET");

    if (webhookSecret !== expectedSecret) {
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

    // 🔎 busca usuário por email (melhor que listUsers)
    const { data: userLookup } = await supabaseAdmin.auth.admin.getUserByEmail(email);

    let user = userLookup?.user;

    if (!user) {
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
    }

    // profile upsert
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

    // 🔗 gera magic link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: "https://kairoapp.lovable.app/primeiro-acesso",
      },
    });

    if (linkError) throw linkError;

    const magicLink = linkData.properties.action_link;

    // 📡 envia para n8n automaticamente (opcional)
    await fetch("https://n8n.arthurn8n.com.br/webhook/magic-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        magic_link: magicLink,
      }),
    });

    return new Response(
      JSON.stringify({
        success: true,
        email,
        magic_link: magicLink,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error(error);

    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
