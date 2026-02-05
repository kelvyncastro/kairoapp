 import { useState, useMemo } from "react";
 import { useCalendarBlocks } from "@/hooks/useCalendarBlocks";
 import { CalendarHeader } from "@/components/calendario/CalendarHeader";
 import { CalendarDayView } from "@/components/calendario/CalendarDayView";
 import { CalendarWeekView } from "@/components/calendario/CalendarWeekView";
 import { CalendarMonthView } from "@/components/calendario/CalendarMonthView";
 import { BlockModal } from "@/components/calendario/BlockModal";
 import { Loader2 } from "lucide-react";
 import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, format } from "date-fns";
 import { ptBR } from "date-fns/locale";
 
 export type CalendarViewMode = "day" | "week" | "month";
 
 import { CalendarBlockData } from "@/hooks/useCalendarBlocks";
 
 export type CalendarBlock = CalendarBlockData;
 
 export default function Calendario() {
   const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
   const [currentDate, setCurrentDate] = useState(new Date());
   const [modalOpen, setModalOpen] = useState(false);
   const [editingBlock, setEditingBlock] = useState<CalendarBlock | null>(null);
   const [defaultStart, setDefaultStart] = useState<Date | null>(null);
   const [defaultEnd, setDefaultEnd] = useState<Date | null>(null);
 
   const dateRange = useMemo(() => {
     if (viewMode === "day") {
       return { start: currentDate, end: currentDate };
     } else if (viewMode === "week") {
       return {
         start: startOfWeek(currentDate, { weekStartsOn: 1 }),
         end: endOfWeek(currentDate, { weekStartsOn: 1 }),
       };
     } else {
       return {
         start: startOfMonth(currentDate),
         end: endOfMonth(currentDate),
       };
     }
   }, [viewMode, currentDate]);
 
   const { blocks, loading, createBlock, updateBlock, deleteBlock, refetch } = useCalendarBlocks(dateRange.start, dateRange.end);
 
   const handlePrev = () => {
     if (viewMode === "day") setCurrentDate(subDays(currentDate, 1));
     else if (viewMode === "week") setCurrentDate(subWeeks(currentDate, 1));
     else setCurrentDate(subMonths(currentDate, 1));
   };
 
   const handleNext = () => {
     if (viewMode === "day") setCurrentDate(addDays(currentDate, 1));
     else if (viewMode === "week") setCurrentDate(addWeeks(currentDate, 1));
     else setCurrentDate(addMonths(currentDate, 1));
   };
 
   const handleToday = () => setCurrentDate(new Date());
 
   const handleCreateBlock = (start: Date, end: Date) => {
     setEditingBlock(null);
     setDefaultStart(start);
     setDefaultEnd(end);
     setModalOpen(true);
   };
 
   const handleEditBlock = (block: CalendarBlock) => {
     setEditingBlock(block);
     setDefaultStart(null);
     setDefaultEnd(null);
     setModalOpen(true);
   };
 
   const handleSaveBlock = async (data: Partial<CalendarBlock>) => {
     if (editingBlock) {
       await updateBlock(editingBlock.id, data);
     } else {
       await createBlock(data);
     }
     setModalOpen(false);
   };
 
   const handleDeleteBlock = async (id: string) => {
     await deleteBlock(id);
     setModalOpen(false);
   };
 
   const handleMoveBlock = async (id: string, newStart: Date, newEnd: Date) => {
     await updateBlock(id, {
       start_time: newStart.toISOString(),
       end_time: newEnd.toISOString(),
     });
   };
 
   if (loading && blocks.length === 0) {
     return (
       <div className="h-full flex flex-col -m-4 md:-m-6 bg-background overflow-hidden">
         <div className="flex-1 flex items-center justify-center">
           <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         </div>
       </div>
     );
   }
 
   return (
     <div className="h-full flex flex-col -m-4 md:-m-6 bg-background overflow-hidden">
       <CalendarHeader
         viewMode={viewMode}
         currentDate={currentDate}
         onViewModeChange={setViewMode}
         onPrev={handlePrev}
         onNext={handleNext}
         onToday={handleToday}
       />
 
       <div className="flex-1 overflow-hidden">
         {viewMode === "day" && (
           <CalendarDayView
             date={currentDate}
             blocks={blocks}
             onCreateBlock={handleCreateBlock}
             onEditBlock={handleEditBlock}
             onMoveBlock={handleMoveBlock}
           />
         )}
         {viewMode === "week" && (
           <CalendarWeekView
             startDate={dateRange.start}
             blocks={blocks}
             onCreateBlock={handleCreateBlock}
             onEditBlock={handleEditBlock}
             onMoveBlock={handleMoveBlock}
           />
         )}
         {viewMode === "month" && (
           <CalendarMonthView
             month={currentDate}
             blocks={blocks}
             onCreateBlock={handleCreateBlock}
             onEditBlock={handleEditBlock}
             onMoveBlock={handleMoveBlock}
           />
         )}
       </div>
 
       <BlockModal
         open={modalOpen}
         onOpenChange={setModalOpen}
         block={editingBlock}
         defaultStart={defaultStart}
         defaultEnd={defaultEnd}
         onSave={handleSaveBlock}
         onDelete={handleDeleteBlock}
       />
     </div>
   );
 }