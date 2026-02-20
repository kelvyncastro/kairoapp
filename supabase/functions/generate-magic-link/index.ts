import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    console.log("🔗 generate-magic-link called");

    // 🔐 segurança
    const secret = req.headers.get("x-webhook-secret");
    const expected = Deno.env.get("WEBHOOK_SECRET");

    if (secret !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), {
        status: 400,
      });
    }

    // 🔑 cliente admin
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 🌐 redirect correto
    const redirectTo = `https://kairoapp.com.br/primeiro-acesso?email=${encodeURIComponent(email)}`;

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        email,
        magic_link: data.properties.action_link,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("🔥 Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
    });
  }
});
