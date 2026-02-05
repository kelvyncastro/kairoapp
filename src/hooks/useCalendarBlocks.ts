 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 import { useToast } from "@/hooks/use-toast";
 import { format } from "date-fns";
 
 export interface CalendarBlockData {
   id: string;
   title: string;
   description?: string;
   start_time: string;
   end_time: string;
   color: string;
   status: string;
   priority: string;
   recurrence_type: string;
   recurrence_parent_id?: string;
   is_recurrence_paused?: boolean;
 }
 
 export function useCalendarBlocks(startDate: Date, endDate: Date) {
   const { user } = useAuth();
   const { toast } = useToast();
   const [blocks, setBlocks] = useState<CalendarBlockData[]>([]);
   const [loading, setLoading] = useState(true);
 
   const fetchBlocks = useCallback(async () => {
     if (!user) return;
     setLoading(true);
 
     const startISO = new Date(startDate.setHours(0, 0, 0, 0)).toISOString();
     const endISO = new Date(endDate.setHours(23, 59, 59, 999)).toISOString();
 
     const { data, error } = await supabase
       .from("calendar_blocks")
       .select("*")
       .gte("start_time", startISO)
       .lte("start_time", endISO)
       .order("start_time", { ascending: true });
 
     if (error) {
       console.error("Error fetching blocks:", error);
       toast({ title: "Erro ao carregar blocos", variant: "destructive" });
     } else {
       setBlocks(data || []);
     }
     setLoading(false);
   }, [user, startDate, endDate, toast]);
 
   useEffect(() => {
     fetchBlocks();
   }, [fetchBlocks]);
 
   const createBlock = async (blockData: Partial<CalendarBlockData>) => {
     if (!user) return;
 
     const { error } = await supabase.from("calendar_blocks").insert({
       user_id: user.id,
       title: blockData.title || "Novo Bloco",
       description: blockData.description,
       start_time: blockData.start_time,
       end_time: blockData.end_time,
       color: blockData.color || "#6366f1",
       status: blockData.status || "pending",
       priority: blockData.priority || "medium",
       recurrence_type: blockData.recurrence_type || "none",
     });
 
     if (error) {
       console.error("Error creating block:", error);
       toast({ title: "Erro ao criar bloco", variant: "destructive" });
     } else {
       toast({ title: "Bloco criado" });
       fetchBlocks();
     }
   };
 
   const updateBlock = async (id: string, updates: Partial<CalendarBlockData>) => {
     const { error } = await supabase
       .from("calendar_blocks")
       .update(updates)
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