import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the user's Google OAuth provider token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: "No active session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const providerToken = session.provider_token;
    
    if (!providerToken) {
      return new Response(
        JSON.stringify({ 
          error: "Google Calendar not connected",
          needsConnection: true,
          message: "Você precisa conectar sua conta Google com permissão para o Calendar"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body for date range
    const body = await req.json().catch(() => ({}));
    const { 
      timeMin = new Date().toISOString(),
      timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      maxResults = 50,
    } = body;

    // Fetch events from Google Calendar API
    const calendarUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    calendarUrl.searchParams.set("timeMin", timeMin);
    calendarUrl.searchParams.set("timeMax", timeMax);
    calendarUrl.searchParams.set("maxResults", String(maxResults));
    calendarUrl.searchParams.set("singleEvents", "true");
    calendarUrl.searchParams.set("orderBy", "startTime");

    const calendarResponse = await fetch(calendarUrl.toString(), {
      headers: {
        Authorization: `Bearer ${providerToken}`,
      },
    });

    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.json();
      console.error("Google Calendar API error:", errorData);
      
      // Check if token expired
      if (calendarResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: "Token expired",
            needsReconnection: true,
            message: "Sua conexão com o Google expirou. Por favor, faça login novamente."
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to fetch calendar events", details: errorData }),
        { status: calendarResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const calendarData = await calendarResponse.json();
    
    // Transform events to a simpler format
    const events = (calendarData.items || []).map((event: any) => ({
      id: event.id,
      title: event.summary || "Sem título",
      description: event.description || null,
      location: event.location || null,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      allDay: !event.start?.dateTime,
      htmlLink: event.htmlLink,
      status: event.status,
      organizer: event.organizer?.email,
      attendees: event.attendees?.map((a: any) => ({
        email: a.email,
        responseStatus: a.responseStatus,
      })) || [],
      colorId: event.colorId,
    }));

    return new Response(
      JSON.stringify({ 
        events,
        summary: calendarData.summary,
        timeZone: calendarData.timeZone,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in google-calendar function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
