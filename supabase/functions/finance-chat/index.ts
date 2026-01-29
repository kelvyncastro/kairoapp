import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userId, sectors } = await req.json();
    
    if (!message || !userId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Mensagem ou usuário não fornecidos." 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Build sectors context for AI
    const sectorsContext = sectors?.length > 0 
      ? `Setores disponíveis do usuário: ${sectors.map((s: any) => `"${s.name}" (id: ${s.id})`).join(", ")}`
      : "O usuário não tem setores cadastrados ainda.";

    const systemPrompt = `Você é um assistente financeiro que extrai informações de transações a partir de mensagens em linguagem natural.

${sectorsContext}

Sua tarefa é analisar a mensagem do usuário e extrair:
1. O valor da transação (sempre positivo, sem símbolos)
2. O tipo: "expense" (gasto/despesa) ou "income" (ganho/receita)
3. Uma descrição curta da transação
4. O ID do setor mais adequado da lista acima (se houver setores disponíveis)

REGRAS IMPORTANTES:
- Palavras como "gastei", "paguei", "comprei", "despesa" indicam EXPENSE
- Palavras como "recebi", "ganhei", "entrou", "salário", "vendi" indicam INCOME
- Se não conseguir determinar o valor ou tipo, retorne success: false
- Procure o setor mais semanticamente similar. Ex: "mercado" casa com "Mercado", "uber" casa com "Transporte"
- Se nenhum setor for adequado, use null para sector_id

Responda APENAS em JSON válido no formato:
{
  "success": true/false,
  "value": número ou null,
  "type": "expense" ou "income" ou null,
  "description": "descrição curta" ou null,
  "sector_id": "uuid do setor" ou null,
  "sector_name": "nome do setor escolhido" ou null,
  "error_message": "mensagem de erro se success=false" ou null
}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Muitas requisições. Aguarde um momento e tente novamente." 
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Créditos de IA esgotados. Entre em contato com o suporte." 
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content;
    
    if (!aiContent) {
      throw new Error("Resposta da IA vazia");
    }

    // Parse AI response
    let parsed;
    try {
      // Remove markdown code blocks if present
      const cleanContent = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleanContent);
    } catch (e) {
      console.error("Failed to parse AI response:", aiContent);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Não consegui entender sua mensagem. Tente algo como:\n• \"Gastei R$50 com mercado\"\n• \"Recebi R$3000 de salário\"\n• \"Paguei R$150 de luz\"" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!parsed.success || !parsed.value || !parsed.type) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: parsed.error_message || "Não consegui entender sua mensagem. Tente algo como:\n• \"Gastei R$50 com mercado\"\n• \"Recebi R$3000 de salário\"\n• \"Paguei R$150 de luz\"" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate final value (negative for expenses, positive for income)
    const finalValue = parsed.type === "expense" ? -Math.abs(parsed.value) : Math.abs(parsed.value);
    
    // Determine status based on type
    const status = parsed.type === "income" ? "received" : "paid";

    // Insert transaction
    const { data: transaction, error: insertError } = await supabase
      .from("finance_transactions")
      .insert({
        user_id: userId,
        name: parsed.description || "Transação via chat",
        value: finalValue,
        date: new Date().toISOString().split("T")[0],
        sector_id: parsed.sector_id || null,
        status: status,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Falha ao salvar transação");
    }

    // Build success message
    const formattedValue = Math.abs(parsed.value).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    
    const typeLabel = parsed.type === "expense" ? "💸 Despesa" : "💰 Receita";
    const sectorLabel = parsed.sector_name ? ` em ${parsed.sector_name}` : "";
    
    const successMessage = `${typeLabel} registrada!\n\n**${parsed.description}**\n${formattedValue}${sectorLabel}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: successMessage,
        transaction: {
          id: transaction.id,
          value: finalValue,
          description: parsed.description,
          sector: parsed.sector_name,
          type: parsed.type,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Finance chat error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Ocorreu um erro ao processar sua mensagem. Tente novamente." 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
