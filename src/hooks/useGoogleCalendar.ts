import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CalendarEvent, CalendarResponse } from "@/types/calendar";
import { useToast } from "@/hooks/use-toast";

interface UseGoogleCalendarOptions {
  autoFetch?: boolean;
  daysAhead?: number;
}

export function useGoogleCalendar(options: UseGoogleCalendarOptions = {}) {
  const { autoFetch = true, daysAhead = 7 } = options;
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConnection, setNeedsConnection] = useState(false);
  const [needsReconnection, setNeedsReconnection] = useState(false);
  const { toast } = useToast();

  const fetchEvents = useCallback(async (timeMin?: Date, timeMax?: Date) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("Você precisa estar logado");
        setLoading(false);
        return;
      }

      const now = timeMin || new Date();
      const endDate = timeMax || new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

      const response = await supabase.functions.invoke<CalendarResponse>("google-calendar", {
        body: {
          timeMin: now.toISOString(),
          timeMax: endDate.toISOString(),
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;

      if (data?.needsConnection) {
        setNeedsConnection(true);
        setEvents([]);
        return;
      }

      if (data?.needsReconnection) {
        setNeedsReconnection(true);
        setEvents([]);
        toast({
          title: "Conexão expirada",
          description: "Faça login novamente com o Google para acessar sua agenda",
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setEvents(data?.events || []);
      setNeedsConnection(false);
      setNeedsReconnection(false);

    } catch (err) {
      console.error("Error fetching calendar events:", err);
      setError(err instanceof Error ? err.message : "Erro ao buscar eventos");
    } finally {
      setLoading(false);
    }
  }, [daysAhead, toast]);

  useEffect(() => {
    if (autoFetch) {
      fetchEvents();
    }
  }, [autoFetch, fetchEvents]);

  return {
    events,
    loading,
    error,
    needsConnection,
    needsReconnection,
    refetch: fetchEvents,
  };
}
