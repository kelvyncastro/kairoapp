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
import { format, parseISO, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter((event) => 
      isSameDay(parseISO(event.start), selectedDate)
    );
  }, [events, selectedDate]);

  const datesWithEvents = useMemo(() => {
    return new Set(Object.keys(eventsByDate));
  }, [eventsByDate]);

  const handleRefresh = () => {
    refetch();
  };

  if (needsConnection || needsReconnection) {
    return (
      <div className="h-full flex flex-col -m-4 md:-m-6 bg-background overflow-hidden">
        <div className="px-6 py-4 border-b border-border/30">
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground">Visualize seus eventos do Google Calendar</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="cave-card max-w-md w-full">
            <GoogleCalendarConnect onSuccess={handleRefresh} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col -m-4 md:-m-6 bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground">Seus eventos do Google Calendar</p>
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && events.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="px-6 py-5">
            <div className="cave-card p-6 text-center">
              <p className="text-destructive">{error}</p>
              <Button onClick={handleRefresh} variant="outline" className="mt-4">
                Tentar novamente
              </Button>
            </div>
          </div>
        ) : viewMode === "list" ? (
          <div className="px-6 py-5">
            <h2 className="text-xl font-bold text-foreground uppercase tracking-wider mb-4">
              Próximos Eventos
            </h2>
            {Object.entries(eventsByDate).length === 0 ? (
              <div className="cave-card p-12 text-center">
                <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Nenhum evento nos próximos 30 dias
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(eventsByDate)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, dayEvents]) => (
                    <div key={date}>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                        {format(parseISO(date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                      </h3>
                      <div className="space-y-2">
                        {dayEvents.map((event) => (
                          <CalendarEventCard key={event.id} event={event} />
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 py-5">
            <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
              {/* Calendar */}
              <div className="cave-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="font-bold uppercase tracking-wider text-sm">
                    {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
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
                <h3 className="font-bold uppercase tracking-wider text-sm mb-4">
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
          </div>
        )}
      </div>
    </div>
  );
}
