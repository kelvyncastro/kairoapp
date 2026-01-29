import { CalendarEvent } from "@/types/calendar";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, MapPin, Users, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarEventCardProps {
  event: CalendarEvent;
  compact?: boolean;
}

const eventColors: Record<string, string> = {
  "1": "bg-blue-500/20 border-blue-500/50",
  "2": "bg-green-500/20 border-green-500/50",
  "3": "bg-purple-500/20 border-purple-500/50",
  "4": "bg-red-500/20 border-red-500/50",
  "5": "bg-yellow-500/20 border-yellow-500/50",
  "6": "bg-orange-500/20 border-orange-500/50",
  "7": "bg-cyan-500/20 border-cyan-500/50",
  "8": "bg-gray-500/20 border-gray-500/50",
  "9": "bg-indigo-500/20 border-indigo-500/50",
  "10": "bg-emerald-500/20 border-emerald-500/50",
  "11": "bg-rose-500/20 border-rose-500/50",
};

export function CalendarEventCard({ event, compact = false }: CalendarEventCardProps) {
  const startDate = parseISO(event.start);
  const endDate = parseISO(event.end);
  
  const getDateLabel = () => {
    if (isToday(startDate)) return "Hoje";
    if (isTomorrow(startDate)) return "Amanhã";
    return format(startDate, "EEEE, d 'de' MMM", { locale: ptBR });
  };

  const getTimeLabel = () => {
    if (event.allDay) return "Dia inteiro";
    return `${format(startDate, "HH:mm")} - ${format(endDate, "HH:mm")}`;
  };

  const colorClass = event.colorId ? eventColors[event.colorId] : "bg-primary/10 border-primary/30";

  if (compact) {
    return (
      <div
        className={cn(
          "p-3 rounded-lg border-l-4 transition-colors hover:bg-accent/50",
          colorClass
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{event.title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3 shrink-0" />
              <span>{getTimeLabel()}</span>
            </div>
          </div>
          {event.htmlLink && (
            <a
              href={event.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-colors hover:bg-accent/30",
        colorClass
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{event.title}</p>
          
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4 shrink-0" />
              <span>{getDateLabel()} • {getTimeLabel()}</span>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
            
            {event.attendees.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" />
                <span>{event.attendees.length} participante{event.attendees.length > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          {event.description && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
              {event.description}
            </p>
          )}
        </div>

        {event.htmlLink && (
          <a
            href={event.htmlLink}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            title="Abrir no Google Calendar"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}
