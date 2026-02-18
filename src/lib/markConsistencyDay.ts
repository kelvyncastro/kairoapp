import { supabase } from "@/integrations/supabase/client";

/**
 * Marca o dia de hoje como ativo no streak de consistência.
 * @param userId - ID do usuário autenticado
 * @param reason - Motivo do registro ('task' | 'habit' | 'finance' | 'ai_chat' | 'workout' | 'diet')
 */
export async function markConsistencyDay(userId: string, reason: string) {
  const today = new Date().toISOString().split("T")[0];
  await supabase
    .from("consistency_days")
    .upsert(
      { user_id: userId, date: today, is_active: true, reason },
      { onConflict: "user_id,date" }
    );
}
