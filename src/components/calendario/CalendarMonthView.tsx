 import { useMemo } from "react";
 import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from "date-fns";
 import { ptBR } from "date-fns/locale";
 import { CalendarBlock } from "@/pages/Calendario";
 import { cn } from "@/lib/utils";
 
 interface CalendarMonthViewProps {
   month: Date;
   blocks: CalendarBlock[];
   onCreateBlock: (start: Date, end: Date) => void;
   onEditBlock: (block: CalendarBlock) => void;
   onMoveBlock: (id: string, newStart: Date, newEnd: Date) => void;
 }
 
 export function CalendarMonthView({ month, blocks, onCreateBlock, onEditBlock, onMoveBlock }: CalendarMonthViewProps) {
   const weeks = useMemo(() => {
     const monthStart = startOfMonth(month);
     const monthEnd = endOfMonth(month);
     const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
     const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
 
     const rows: Date[][] = [];
     let current = calStart;
     while (current <= calEnd) {
       const week: Date[] = [];
       for (let i = 0; i < 7; i++) {
         week.push(current);
         current = addDays(current, 1);
       }
       rows.push(week);
     }
     return rows;
   }, [month]);
 
   const getBlocksForDay = (day: Date) => {
     return blocks.filter((b) => isSameDay(parseISO(b.start_time), day));
   };
 
   const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
 
   return (
     <div className="flex flex-col h-full p-4">
       {/* Weekday headers */}
       <div className="grid grid-cols-7 gap-1 mb-2">
         {weekDays.map((day) => (
           <div key={day} className="text-center text-xs font-medium text-muted-foreground uppercase py-2">
             {day}
           </div>
         ))}
       </div>
 
       {/* Calendar grid */}
       <div className="flex-1 grid grid-rows-6 gap-1">
         {weeks.map((week, wi) => (
           <div key={wi} className="grid grid-cols-7 gap-1">
             {week.map((day) => {
               const dayBlocks = getBlocksForDay(day);
               const isToday = isSameDay(day, new Date());
               const isCurrentMonth = isSameMonth(day, month);
 
               return (
                 <div
                   key={day.toISOString()}
                   className={cn(
                     "border border-border/30 rounded-md p-1 min-h-[80px] cursor-pointer hover:bg-muted/20 transition-colors",
                     !isCurrentMonth && "opacity-40",
                     isToday && "ring-2 ring-primary"
                   )}
                   onClick={() => {
                     const start = new Date(day.setHours(9, 0, 0, 0));
                     const end = new Date(day.setHours(10, 0, 0, 0));
                     onCreateBlock(start, end);
                   }}
                 >
                   <p className={cn("text-sm font-medium mb-1", isToday && "text-primary")}>
                     {format(day, "d")}
                   </p>
                   <div className="space-y-0.5 overflow-hidden">
                     {dayBlocks.slice(0, 3).map((block) => (
                       <div
                         key={block.id}
                         className="text-xs px-1 py-0.5 rounded truncate text-white"
                         style={{ backgroundColor: block.color || "#6366f1" }}
                         onClick={(e) => {
                           e.stopPropagation();
                           onEditBlock(block);
                         }}
                       >
                         {block.title}
                       </div>
                     ))}
                     {dayBlocks.length > 3 && (
                       <p className="text-xs text-muted-foreground">+{dayBlocks.length - 3} mais</p>
                     )}
                   </div>
                 </div>
               );
             })}
           </div>
         ))}
       </div>
     </div>
   );
 }