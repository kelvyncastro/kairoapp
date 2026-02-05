 import { Button } from "@/components/ui/button";
 import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
 import { format, getWeekOfMonth } from "date-fns";
 import { ptBR } from "date-fns/locale";
 import { CalendarViewMode } from "@/pages/Calendario";
 
 interface CalendarHeaderProps {
   viewMode: CalendarViewMode;
   currentDate: Date;
   onViewModeChange: (mode: CalendarViewMode) => void;
   onPrev: () => void;
   onNext: () => void;
   onToday: () => void;
 }
 
 export function CalendarHeader({
   viewMode,
   currentDate,
   onViewModeChange,
   onPrev,
   onNext,
   onToday,
 }: CalendarHeaderProps) {
   const getTitle = () => {
     if (viewMode === "day") {
       return format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR });
     } else if (viewMode === "week") {
       const weekNum = getWeekOfMonth(currentDate, { weekStartsOn: 1 });
       const monthName = format(currentDate, "MMMM", { locale: ptBR });
       return `${weekNum}ª Semana de ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
     } else {
       return format(currentDate, "MMMM yyyy", { locale: ptBR });
     }
   };
 
   return (
     <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border/30 flex-shrink-0">
       <div className="flex items-center gap-3">
         <CalendarIcon className="h-5 w-5 text-primary" />
         <div>
           <h1 className="text-xl md:text-2xl font-bold capitalize">{getTitle()}</h1>
         </div>
       </div>
 
       <div className="flex items-center gap-2">
         {/* View Toggle */}
         <div className="flex items-center gap-1 bg-muted/30 rounded-md p-0.5">
           {(["day", "week", "month"] as CalendarViewMode[]).map((mode) => (
             <Button
               key={mode}
               variant={viewMode === mode ? "secondary" : "ghost"}
               size="sm"
               className="h-8 px-3"
               onClick={() => onViewModeChange(mode)}
             >
               {mode === "day" ? "Dia" : mode === "week" ? "Semana" : "Mês"}
             </Button>
           ))}
         </div>
 
         <div className="h-4 w-px bg-border/50" />
 
         {/* Navigation */}
         <Button variant="outline" size="sm" onClick={onToday}>
           Hoje
         </Button>
         <Button variant="ghost" size="icon" onClick={onPrev}>
           <ChevronLeft className="h-4 w-4" />
         </Button>
         <Button variant="ghost" size="icon" onClick={onNext}>
           <ChevronRight className="h-4 w-4" />
         </Button>
       </div>
     </div>
   );
 }