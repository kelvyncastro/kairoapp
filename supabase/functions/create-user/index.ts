import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-webhook-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🔥 create-user v1");

    const secret = req.headers.get("x-webhook-secret");
    const expected = Deno.env.get("WEBHOOK_SECRET");

    if (secret !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const { email, first_name, last_name, phone_number, password } = await req.json();

    if (!email) throw new Error("Email required");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: users } = await supabase.auth.admin.listUsers();

    let user = users.users.find((u) => u.email === email);

    if (!user) {
      console.log("👤 Creating user");

      const createOptions: any = {
        email,
        email_confirm: true,
      };
      if (password) {
        createOptions.password = password;
      }

      const { data, error } = await supabase.auth.admin.createUser(createOptions);

      if (error) throw error;

      user = data.user;
    }

    console.log("🧾 Upserting profile");

    await supabase.from("user_profiles").upsert(
      {
        user_id: user.id,
        first_name,
        last_name,
        phone_number,
        subscription_status: "active",
        onboarding_completed: false,
        account_status: "first_access_pending",
      },
      { onConflict: "user_id" },
    );

    return new Response(
      JSON.stringify({
        success: true,
        user_id: user.id,
        email,
      }),
      { headers: corsHeaders },
    );
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});
