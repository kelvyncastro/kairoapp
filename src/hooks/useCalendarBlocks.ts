 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { useToast } from "@/hooks/use-toast";
 import { Database } from "@/integrations/supabase/types";
 
 type CalendarBlockRow = Database["public"]["Tables"]["calendar_blocks"]["Row"];
 type CalendarBlockInsert = Database["public"]["Tables"]["calendar_blocks"]["Insert"];
 type CalendarBlockUpdate = Database["public"]["Tables"]["calendar_blocks"]["Update"];
 type Priority = Database["public"]["Enums"]["calendar_priority"];
 type Status = Database["public"]["Enums"]["calendar_block_status"];
 type RecurrenceType = Database["public"]["Enums"]["calendar_recurrence_type"];
 
 export interface CalendarBlockData {
   id: string;
   title: string;
   description?: string | null;
   start_time: string;
   end_time: string;
   color: string;
   status: Status;
   priority: Priority;
   recurrence_type: RecurrenceType;
   recurrence_parent_id?: string | null;
   is_recurrence_paused?: boolean | null;
 }
 
 export function useCalendarBlocks(startDate: Date, endDate: Date) {
   const { user } = useAuth();
   const { toast } = useToast();
   const [blocks, setBlocks] = useState<CalendarBlockData[]>([]);
   const [loading, setLoading] = useState(true);
 
   const fetchBlocks = useCallback(async () => {
     if (!user) return;
     setLoading(true);
 
     const startCopy = new Date(startDate);
     startCopy.setHours(0, 0, 0, 0);
     const endCopy = new Date(endDate);
     endCopy.setHours(23, 59, 59, 999);
 
     const { data, error } = await supabase
       .from("calendar_blocks")
       .select("*")
       .gte("start_time", startCopy.toISOString())
       .lte("start_time", endCopy.toISOString())
       .order("start_time", { ascending: true });
 
     if (error) {
       console.error("Error fetching blocks:", error);
       toast({ title: "Erro ao carregar blocos", variant: "destructive" });
     } else {
       setBlocks(
         (data || []).map((row) => ({
           id: row.id,
           title: row.title,
           description: row.description,
           start_time: row.start_time,
           end_time: row.end_time,
           color: row.color || "#6366f1",
           status: row.status,
           priority: row.priority,
           recurrence_type: row.recurrence_type,
           recurrence_parent_id: row.recurrence_parent_id,
           is_recurrence_paused: row.is_recurrence_paused,
         }))
       );
     }
     setLoading(false);
   }, [user, startDate, endDate, toast]);
 
   useEffect(() => {
     fetchBlocks();
   }, [fetchBlocks]);
 
   const createBlock = async (blockData: Partial<CalendarBlockData>) => {
     if (!user) return;
 
     const insertData: CalendarBlockInsert = {
       user_id: user.id,
       title: blockData.title || "Novo Bloco",
       description: blockData.description ?? null,
       start_time: blockData.start_time!,
       end_time: blockData.end_time!,
       color: blockData.color || "#6366f1",
       status: (blockData.status as Status) || "pending",
       priority: (blockData.priority as Priority) || "medium",
       recurrence_type: (blockData.recurrence_type as RecurrenceType) || "none",
     };
 
     const { error } = await supabase.from("calendar_blocks").insert(insertData);
 
     if (error) {
       console.error("Error creating block:", error);
       toast({ title: "Erro ao criar bloco", variant: "destructive" });
     } else {
       toast({ title: "Bloco criado" });
       fetchBlocks();
     }
   };
 
   const updateBlock = async (id: string, updates: Partial<CalendarBlockData>) => {
     const updateData: CalendarBlockUpdate = {};
     if (updates.title !== undefined) updateData.title = updates.title;
     if (updates.description !== undefined) updateData.description = updates.description;
     if (updates.start_time !== undefined) updateData.start_time = updates.start_time;
     if (updates.end_time !== undefined) updateData.end_time = updates.end_time;
     if (updates.color !== undefined) updateData.color = updates.color;
     if (updates.status !== undefined) updateData.status = updates.status;
     if (updates.priority !== undefined) updateData.priority = updates.priority;
     if (updates.recurrence_type !== undefined) updateData.recurrence_type = updates.recurrence_type;
 
     const { error } = await supabase
       .from("calendar_blocks")
       .update(updateData)
       .eq("id", id);
 
     if (error) {
       console.error("Error updating block:", error);
       toast({ title: "Erro ao atualizar bloco", variant: "destructive" });
     } else {
       fetchBlocks();
     }
   };
 
   const deleteBlock = async (id: string) => {
     const { error } = await supabase.from("calendar_blocks").delete().eq("id", id);
 
     if (error) {
       console.error("Error deleting block:", error);
       toast({ title: "Erro ao deletar bloco", variant: "destructive" });
     } else {
       toast({ title: "Bloco removido" });
       fetchBlocks();
     }
   };
 
   return { blocks, loading, createBlock, updateBlock, deleteBlock, refetch: fetchBlocks };
 }