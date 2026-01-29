import { useState, useMemo } from "react";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { CalendarEventCard } from "@/components/calendar/CalendarEventCard";
import { GoogleCalendarConnect } from "@/components/calendar/GoogleCalendarConnect";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  Calendar as CalendarIcon, 
  RefreshCw, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  List,
  LayoutGrid,
} from "lucide-react";
import { format, parseISO, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

type ViewMode = "list" | "calendar";

export default function Agenda() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { 
    events, 
    loading, 
    error, 
    needsConnection, 
    needsReconnection,
    refetch 
  } = useGoogleCalendar({
    autoFetch: true,
    daysAhead: 30,
  });

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, typeof events> = {};
    
    events.forEach((event) => {
      const dateKey = format(parseISO(event.start), "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return grouped;
  }, [events]);

  // Events for selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((event) => 
      isSameDay(parseISO(event.start), selectedDate)
    );
  }, [events, selectedDate]);

  // Dates that have events (for calendar highlighting)
  const datesWithEvents = useMemo(() => {
    return new Set(Object.keys(eventsByDate));
  }, [eventsByDate]);

  const handleRefresh = () => {
    refetch();
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  if (needsConnection || needsReconnection) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Agenda</h1>
          <p className="text-muted-foreground">
            Visualize seus eventos do Google Calendar
          </p>
        </div>

        <div className="cave-card">
          <GoogleCalendarConnect onSuccess={handleRefresh} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agenda</h1>
          <p className="text-muted-foreground">
            Seus eventos do Google Calendar
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-muted/30 rounded-md p-0.5">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4 mr-1.5" />
              Lista
            </Button>
            <Button
              variant={viewMode === "calendar" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode("calendar")}
            >
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              Calendário
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {loading && events.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="cave-card p-6 text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={handleRefresh} variant="outline" className="mt-4">
            Tentar novamente
          </Button>
        </div>
      ) : viewMode === "list" ? (
        /* List View */
        <div className="space-y-6">
          {Object.entries(eventsByDate).length === 0 ? (
            <div className="cave-card p-12 text-center">
              <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhum evento nos próximos 30 dias
              </p>
            </div>
          ) : (
            Object.entries(eventsByDate)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([date, dayEvents]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                    {format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </h3>
                  <div className="space-y-2">
                    {dayEvents.map((event) => (
                      <CalendarEventCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>
      ) : (
        /* Calendar View */
        <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
          {/* Calendar */}
          <div className="cave-card p-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-medium">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </h3>
              <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              locale={ptBR}
              className="rounded-md"
              modifiers={{
                hasEvents: (date) => datesWithEvents.has(format(date, "yyyy-MM-dd")),
              }}
              modifiersStyles={{
                hasEvents: {
                  fontWeight: "bold",
                  textDecoration: "underline",
                  textUnderlineOffset: "4px",
                },
              }}
            />
          </div>

          {/* Selected Day Events */}
          <div className="cave-card p-6">
            <h3 className="font-semibold mb-4">
              {selectedDate
                ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })
                : "Selecione uma data"}
            </h3>

            {selectedDateEvents.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <CalendarIcon className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">
                  Nenhum evento neste dia
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateEvents.map((event) => (
                  <CalendarEventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
