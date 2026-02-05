 import { useMemo, useRef, useState, useCallback } from "react";
 import { format, parseISO, addDays, isSameDay, setHours, setMinutes, differenceInMinutes } from "date-fns";
 import { ptBR } from "date-fns/locale";
 import { CalendarBlock } from "@/pages/Calendario";
 import { cn } from "@/lib/utils";
 
 interface CalendarWeekViewProps {
   startDate: Date;
   blocks: CalendarBlock[];
   onCreateBlock: (start: Date, end: Date) => void;
   onEditBlock: (block: CalendarBlock) => void;
   onMoveBlock: (id: string, newStart: Date, newEnd: Date) => void;
 }
 
 const HOUR_HEIGHT = 48;
 const SNAP_MINUTES = 15;
 
 function snapToQuarter(minutes: number): number {
   return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
 }
 
 export function CalendarWeekView({ startDate, blocks, onCreateBlock, onEditBlock, onMoveBlock }: CalendarWeekViewProps) {
   const containerRef = useRef<HTMLDivElement>(null);
   const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
   const hours = Array.from({ length: 24 }, (_, i) => i);
 
   const getBlocksByDay = useMemo(() => {
     const map = new Map<string, CalendarBlock[]>();
     days.forEach((d) => {
       const key = format(d, "yyyy-MM-dd");
       map.set(key, blocks.filter((b) => isSameDay(parseISO(b.start_time), d)));
     });
     return map;
   }, [blocks, days]);
 
   const getBlockStyle = (block: CalendarBlock) => {
     const start = parseISO(block.start_time);
     const end = parseISO(block.end_time);
     const startMinutes = start.getHours() * 60 + start.getMinutes();
     const duration = differenceInMinutes(end, start);
     return {
       top: `${(startMinutes / 60) * HOUR_HEIGHT}px`,
       height: `${Math.max((duration / 60) * HOUR_HEIGHT, 20)}px`,
       backgroundColor: block.color || "#6366f1",
     };
   };
 
   return (
     <div className="flex flex-col h-full overflow-hidden">
       {/* Day headers */}
       <div className="flex border-b border-border/30 flex-shrink-0">
         <div className="w-16 flex-shrink-0" />
         {days.map((day) => (
           <div
             key={day.toISOString()}
             className={cn(
               "flex-1 text-center py-2 border-l border-border/30",
               isSameDay(day, new Date()) && "bg-primary/10"
             )}
           >
             <p className="text-xs text-muted-foreground uppercase">
               {format(day, "EEE", { locale: ptBR })}
             </p>
             <p className={cn("text-lg font-bold", isSameDay(day, new Date()) && "text-primary")}>
               {format(day, "d")}
             </p>
           </div>
         ))}
       </div>
 
       {/* Grid */}
       <div ref={containerRef} className="flex-1 overflow-y-auto">
         <div className="relative flex" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
           {/* Hour labels */}
           <div className="w-16 flex-shrink-0">
             {hours.map((hour) => (
               <div
                 key={hour}
                 className="text-xs text-muted-foreground text-right pr-2"
                 style={{ height: `${HOUR_HEIGHT}px`, paddingTop: "2px" }}
               >
                 {format(setHours(new Date(), hour), "HH:00")}
               </div>
             ))}
           </div>
 
           {/* Day columns */}
           {days.map((day) => {
             const key = format(day, "yyyy-MM-dd");
             const dayBlocks = getBlocksByDay.get(key) || [];
             return (
               <div
                 key={key}
                 className="flex-1 border-l border-border/30 relative"
                 onClick={(e) => {
                   const rect = e.currentTarget.getBoundingClientRect();
                   const y = e.clientY - rect.top;
                   const totalMinutes = (y / HOUR_HEIGHT) * 60;
                   const snapped = snapToQuarter(totalMinutes);
                   const start = setMinutes(setHours(new Date(day), Math.floor(snapped / 60)), snapped % 60);
                   const end = new Date(start.getTime() + 60 * 60 * 1000);
                   onCreateBlock(start, end);
                 }}
               >
                 {/* Hour lines */}
                 {hours.map((hour) => (
                   <div
                     key={hour}
                     className="absolute w-full border-t border-border/20"
                     style={{ top: `${hour * HOUR_HEIGHT}px` }}
                   />
                 ))}
 
                 {/* Blocks */}
                 {dayBlocks.map((block) => (
                   <div
                     key={block.id}
                     className="absolute left-1 right-1 rounded px-1 py-0.5 text-white text-xs cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
                     style={getBlockStyle(block)}
                     onClick={(e) => {
                       e.stopPropagation();
                       onEditBlock(block);
                     }}
                   >
                     <p className="font-medium truncate">{block.title}</p>
                   </div>
                 ))}
               </div>
             );
           })}
         </div>
       </div>
     </div>
   );
 }