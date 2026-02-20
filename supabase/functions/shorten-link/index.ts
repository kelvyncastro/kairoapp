import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { nanoid } from "https://esm.sh/nanoid";

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const { url } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "URL required" }), { status: 400 });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const code = nanoid(8);

    const { error } = await supabase.from("short_links").insert({
      code,
      original_url: url,
    });

    if (error) throw error;

    const shortUrl = `${Deno.env.get("APP_URL")}/l/${code}`;

    return new Response(JSON.stringify({ short_url: shortUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});
