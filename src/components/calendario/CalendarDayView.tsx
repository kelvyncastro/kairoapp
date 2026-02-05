 import { useMemo, useRef, useState, useCallback } from "react";
 import { format, parseISO, setHours, setMinutes, differenceInMinutes, isSameDay } from "date-fns";
 import { CalendarBlock } from "@/pages/Calendario";
 import { cn } from "@/lib/utils";
 
 interface CalendarDayViewProps {
   date: Date;
   blocks: CalendarBlock[];
   onCreateBlock: (start: Date, end: Date) => void;
   onEditBlock: (block: CalendarBlock) => void;
   onMoveBlock: (id: string, newStart: Date, newEnd: Date) => void;
 }
 
 const HOUR_HEIGHT = 60;
 const SNAP_MINUTES = 15;
 
 function snapToQuarter(minutes: number): number {
   return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
 }
 
 export function CalendarDayView({ date, blocks, onCreateBlock, onEditBlock, onMoveBlock }: CalendarDayViewProps) {
   const containerRef = useRef<HTMLDivElement>(null);
   const [dragStart, setDragStart] = useState<{ y: number; time: Date } | null>(null);
   const [dragEnd, setDragEnd] = useState<Date | null>(null);
 
   const hours = Array.from({ length: 24 }, (_, i) => i);
 
   const dayBlocks = useMemo(() => {
     return blocks.filter((b) => isSameDay(parseISO(b.start_time), date));
   }, [blocks, date]);
 
   const getTimeFromY = useCallback((y: number): Date => {
     const totalMinutes = (y / HOUR_HEIGHT) * 60;
     const snapped = snapToQuarter(totalMinutes);
     const hours = Math.floor(snapped / 60);
     const mins = snapped % 60;
     return setMinutes(setHours(new Date(date), hours), mins);
   }, [date]);
 
   const handleMouseDown = (e: React.MouseEvent) => {
     if (e.target !== e.currentTarget) return;
     const rect = containerRef.current?.getBoundingClientRect();
     if (!rect) return;
     const y = e.clientY - rect.top + (containerRef.current?.scrollTop || 0);
     const time = getTimeFromY(y);
     setDragStart({ y, time });
     setDragEnd(time);
   };
 
   const handleMouseMove = (e: React.MouseEvent) => {
     if (!dragStart) return;
     const rect = containerRef.current?.getBoundingClientRect();
     if (!rect) return;
     const y = e.clientY - rect.top + (containerRef.current?.scrollTop || 0);
     setDragEnd(getTimeFromY(y));
   };
 
   const handleMouseUp = () => {
     if (dragStart && dragEnd) {
       const start = dragStart.time < dragEnd ? dragStart.time : dragEnd;
       const end = dragStart.time < dragEnd ? dragEnd : dragStart.time;
       if (differenceInMinutes(end, start) >= 15) {
         onCreateBlock(start, end);
       }
     }
     setDragStart(null);
     setDragEnd(null);
   };
 
   const getBlockStyle = (block: CalendarBlock) => {
     const start = parseISO(block.start_time);
     const end = parseISO(block.end_time);
     const startMinutes = start.getHours() * 60 + start.getMinutes();
     const duration = differenceInMinutes(end, start);
     return {
       top: `${(startMinutes / 60) * HOUR_HEIGHT}px`,
       height: `${(duration / 60) * HOUR_HEIGHT}px`,
       backgroundColor: block.color || "#6366f1",
     };
   };
 
   return (
     <div
       ref={containerRef}
       className="flex-1 overflow-y-auto relative"
       onMouseDown={handleMouseDown}
       onMouseMove={handleMouseMove}
       onMouseUp={handleMouseUp}
       onMouseLeave={handleMouseUp}
     >
       <div className="relative" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
         {/* Hour lines */}
         {hours.map((hour) => (
           <div
             key={hour}
             className="absolute w-full border-t border-border/30 flex"
             style={{ top: `${hour * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
           >
             <div className="w-16 text-xs text-muted-foreground pr-2 text-right pt-1">
               {format(setHours(new Date(), hour), "HH:00")}
             </div>
           </div>
         ))}
 
         {/* Blocks */}
         <div className="absolute left-16 right-4">
           {dayBlocks.map((block) => (
             <div
               key={block.id}
               className="absolute left-0 right-0 rounded-md px-2 py-1 text-white text-sm cursor-pointer hover:opacity-90 transition-opacity overflow-hidden"
               style={getBlockStyle(block)}
               onClick={(e) => {
                 e.stopPropagation();
                 onEditBlock(block);
               }}
             >
               <p className="font-medium truncate">{block.title}</p>
               <p className="text-xs opacity-80">
                 {format(parseISO(block.start_time), "HH:mm")} - {format(parseISO(block.end_time), "HH:mm")}
               </p>
             </div>
           ))}
 
           {/* Drag preview */}
           {dragStart && dragEnd && (
             <div
               className="absolute left-0 right-0 bg-primary/30 border-2 border-primary border-dashed rounded-md"
               style={{
                 top: `${(Math.min(dragStart.time.getHours() * 60 + dragStart.time.getMinutes(), dragEnd.getHours() * 60 + dragEnd.getMinutes()) / 60) * HOUR_HEIGHT}px`,
                 height: `${(Math.abs(differenceInMinutes(dragEnd, dragStart.time)) / 60) * HOUR_HEIGHT}px`,
               }}
             />
           )}
         </div>
       </div>
     </div>
   );
 }