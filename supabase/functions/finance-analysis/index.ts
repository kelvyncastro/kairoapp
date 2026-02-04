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
    // Validate JWT authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Não autorizado. Faça login para continuar." 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with auth header
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Validate JWT and get user ID from claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Token inválido. Faça login novamente." 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use userId from validated JWT claims, NOT from request body
    const userId = claimsData.claims.sub;
    
    if (!userId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Usuário não identificado." 
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get request body for other data (transactions, sectors, etc.)
    const { transactions, sectors, income, expenses, balance } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Build transaction summary for AI
    const transactionSummary = transactions?.length > 0
      ? transactions.map((t: any) => {
          const sector = sectors?.find((s: any) => s.id === t.sector_id);
          return `- ${t.name}: R$${Math.abs(t.value).toFixed(2)} (${t.value > 0 ? 'receita' : 'despesa'}${sector ? `, setor: ${sector.name}` : ''})`;
        }).join("\n")
      : "Nenhuma transação registrada este mês.";

    // Build sector spending summary
    const sectorSpending = sectors?.map((s: any) => {
      const total = transactions
        ?.filter((t: any) => t.sector_id === s.id && t.value < 0)
        .reduce((sum: number, t: any) => sum + Math.abs(t.value), 0) || 0;
      return { name: s.name, total };
    }).filter((s: any) => s.total > 0)
      .sort((a: any, b: any) => b.total - a.total)
      .map((s: any) => `- ${s.name}: R$${s.total.toFixed(2)}`)
      .join("\n") || "Nenhum gasto por setor registrado.";

    const systemPrompt = `Você é um consultor financeiro pessoal experiente e amigável. Sua tarefa é analisar os dados financeiros do usuário e fornecer conselhos práticos e personalizados.

DADOS FINANCEIROS DO USUÁRIO (mês atual):
- Receita total: R$${income?.toFixed(2) || '0.00'}
- Despesas totais: R$${Math.abs(expenses || 0).toFixed(2)}
- Saldo: R$${balance?.toFixed(2) || '0.00'}

GASTOS POR CATEGORIA:
${sectorSpending}

TRANSAÇÕES RECENTES:
${transactionSummary}

INSTRUÇÕES:
1. Analise os padrões de gastos do usuário
2. Identifique áreas onde pode haver economia
3. Sugira hábitos financeiros saudáveis
4. Seja motivador e prático
5. Use linguagem simples e direta
6. Formate sua resposta em tópicos claros
7. Inclua pelo menos 3-5 dicas específicas baseadas nos dados
8. Se os dados estiverem vazios ou escassos, incentive o usuário a registrar mais transações

FORMATO DE RESPOSTA:
Responda em português brasileiro, de forma clara e organizada com markdown para formatação.`;

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
          { role: "user", content: "Por favor, analise meus dados financeiros e me dê conselhos personalizados para melhorar minha saúde financeira." }
        ],
        temperature: 0.7,
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: aiContent
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Finance analysis error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Ocorreu um erro ao gerar a análise. Tente novamente." 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
