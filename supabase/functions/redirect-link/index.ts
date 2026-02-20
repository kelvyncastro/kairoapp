import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.pathname.split("/").pop();

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data, error } = await supabase.from("short_links").select("original_url").eq("code", code).single();

    if (error || !data) {
      return new Response("Link not found", { status: 404 });
    }

    return Response.redirect(data.original_url, 302);
  } catch (err) {
    console.error(err);
    return new Response("Internal error", { status: 500 });
  }
});
