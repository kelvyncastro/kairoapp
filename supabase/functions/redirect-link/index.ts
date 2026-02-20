import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    // Extract code from path: /redirect-link/ABC123 or ?code=ABC123
    const pathParts = url.pathname.split("/").filter(Boolean);
    const code = pathParts[pathParts.length - 1] || url.searchParams.get("code");

    if (!code || code === "redirect-link") {
      console.error("redirect-link: No code provided");
      return new Response("Code is required", { status: 400 });
    }

    console.log(`redirect-link: Looking up code "${code}"`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("short_links")
      .select("original_url")
      .eq("code", code)
      .single();

    if (error || !data) {
      console.error("redirect-link: Link not found", error);
      return new Response("Link not found", { status: 404 });
    }

    console.log(`redirect-link: Redirecting ${code} -> ${data.original_url}`);

    return new Response(null, {
      status: 302,
      headers: { Location: data.original_url },
    });
  } catch (err) {
    console.error("redirect-link: Internal error", err);
    return new Response("Internal server error", { status: 500 });
  }
});
