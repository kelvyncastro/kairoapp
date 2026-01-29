import { Link } from "react-router-dom";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { CalendarEventCard } from "./CalendarEventCard";
import { GoogleCalendarConnect } from "./GoogleCalendarConnect";
import { Calendar, ArrowRight, Loader2 } from "lucide-react";
import { isToday, isTomorrow, parseISO } from "date-fns";

export function CalendarWidget() {
  const { events, loading, error, needsConnection, refetch } = useGoogleCalendar({
    autoFetch: true,
    daysAhead: 3,
  });

  // Filter to show only today's and tomorrow's events
  const upcomingEvents = events
    .filter((event) => {
      const date = parseISO(event.start);
      return isToday(date) || isTomorrow(date);
    })
    .slice(0, 3);

  if (needsConnection) {
    return (
      <div className="cave-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Agenda</h2>
        </div>
        <div className="flex flex-col items-center py-6 text-center">
          <Calendar className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            Conecte seu Google Calendar
          </p>
          <Link
            to="/agenda"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            Conectar <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="cave-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Agenda</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cave-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Agenda</h2>
        </div>
        <p className="text-sm text-muted-foreground text-center py-6">
          Erro ao carregar eventos
        </p>
      </div>
    );
  }

  return (
    <div className="cave-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Próximos Eventos</h2>
        <Link
          to="/agenda"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          Ver agenda <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {upcomingEvents.length === 0 ? (
        <div className="flex flex-col items-center py-6 text-center">
          <Calendar className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            Nenhum evento hoje ou amanhã
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {upcomingEvents.map((event) => (
            <CalendarEventCard key={event.id} event={event} compact />
          ))}
        </div>
      )}
    </div>
  );
}
