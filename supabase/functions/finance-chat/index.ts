import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate Authorization header and extract user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, message: "Não autorizado. Faça login novamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, message: "Sessão inválida. Faça login novamente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: "Usuário não identificado." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { message, sectors, conversationHistory, audioBase64, imageBase64 } = await req.json();
    
    // Must have at least one input
    if (!message && !audioBase64 && !imageBase64) {
      return new Response(
        JSON.stringify({ success: false, message: "Mensagem não fornecida." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Create Supabase client with service role for queries
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // --- Handle audio transcription via ElevenLabs Scribe ---
    let audioTranscription: string | null = null;
    if (audioBase64) {
      console.log("Processing audio input, base64 length:", audioBase64.length);
      
      const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
      if (!ELEVENLABS_API_KEY) {
        console.error("ELEVENLABS_API_KEY not configured");
        return new Response(
          JSON.stringify({ success: false, message: "Serviço de transcrição não configurado." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      try {
        // Decode base64 to binary
        const binaryString = atob(audioBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const audioBlob = new Blob([bytes], { type: "audio/webm" });

        const formData = new FormData();
        formData.append("file", audioBlob, "audio.webm");
        formData.append("model_id", "scribe_v2");
        formData.append("language_code", "por");

        const transcribeResponse = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: formData,
        });

        if (transcribeResponse.ok) {
          const transcribeData = await transcribeResponse.json();
          audioTranscription = transcribeData.text?.trim() || null;
          console.log("Audio transcription:", audioTranscription);
        } else {
          const errText = await transcribeResponse.text();
          console.error("ElevenLabs transcription error:", transcribeResponse.status, errText);
          audioTranscription = null;
        }
      } catch (e) {
        console.error("Transcription processing error:", e);
        audioTranscription = null;
      }

      if (!audioTranscription) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Não consegui entender o áudio. Tente novamente falando mais alto e claramente.",
            audioTranscription: null,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // --- Handle image processing ---
    let imageDescription: string | null = null;
    if (imageBase64) {
      console.log("Processing image input, base64 length:", imageBase64.length);
      
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "Você analisa imagens de recibos, comprovantes e notificações bancárias. Extraia: valor, descrição/estabelecimento, data (se visível), e tipo (gasto ou receita). Retorne em formato natural, ex: 'Gasto de R$50,00 no Mercado Extra em 10/02/2026'."
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
                {
                  type: "text",
                  text: message || "Analise esta imagem e extraia as informações financeiras.",
                },
              ],
            },
          ],
          temperature: 0.2,
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        imageDescription = imageData.choices?.[0]?.message?.content?.trim();
        console.log("Image description:", imageDescription);
      } else {
        const errText = await imageResponse.text();
        console.error("Image analysis error:", imageResponse.status, errText);
      }
    }

    // Determine the effective user message for the finance AI
    const effectiveMessage = audioTranscription || imageDescription || message;

    // Fetch user's financial data for context
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const oneYearAgo = new Date(currentDate);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const { data: transactions } = await supabase
      .from("finance_transactions")
      .select("*")
      .eq("user_id", userId)
      .gte("date", oneYearAgo.toISOString().split("T")[0])
      .order("date", { ascending: false });

    const { data: userSectors } = await supabase
      .from("finance_sectors")
      .select("*")
      .eq("user_id", userId);

    // Build financial summary by month
    const monthlyData: Record<string, { income: number; expenses: number; bySector: Record<string, number> }> = {};
    
    transactions?.forEach((t: any) => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0, bySector: {} };
      }
      
      if (t.value > 0) {
        monthlyData[monthKey].income += t.value;
      } else {
        monthlyData[monthKey].expenses += Math.abs(t.value);
        const sector = userSectors?.find((s: any) => s.id === t.sector_id);
        const sectorName = sector?.name || "Sem categoria";
        monthlyData[monthKey].bySector[sectorName] = (monthlyData[monthKey].bySector[sectorName] || 0) + Math.abs(t.value);
      }
    });

    const sectorsContext = userSectors && userSectors.length > 0 
      ? `Setores disponíveis: ${userSectors.map((s: any) => `"${s.name}" (id: ${s.id})`).join(", ")}`
      : "O usuário não tem setores cadastrados ainda.";

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    
    let financialContext = "DADOS FINANCEIROS DO USUÁRIO:\n\n";
    const sortedMonths = Object.keys(monthlyData).sort().reverse().slice(0, 12);
    
    sortedMonths.forEach(monthKey => {
      const [year, month] = monthKey.split('-');
      const monthName = monthNames[parseInt(month) - 1];
      const data = monthlyData[monthKey];
      const balance = data.income - data.expenses;
      
      financialContext += `📅 ${monthName}/${year}:\n`;
      financialContext += `  • Receitas: R$${data.income.toFixed(2)}\n`;
      financialContext += `  • Despesas: R$${data.expenses.toFixed(2)}\n`;
      financialContext += `  • Saldo: R$${balance.toFixed(2)}\n`;
      
      if (Object.keys(data.bySector).length > 0) {
        financialContext += `  • Gastos por categoria:\n`;
        Object.entries(data.bySector)
          .sort((a, b) => b[1] - a[1])
          .forEach(([sector, value]) => {
            financialContext += `    - ${sector}: R$${value.toFixed(2)}\n`;
          });
      }
      financialContext += "\n";
    });

    if (transactions && transactions.length > 0) {
      financialContext += "TRANSAÇÕES RECENTES (últimas 20):\n";
      transactions.slice(0, 20).forEach((t: any) => {
        const sector = userSectors?.find((s: any) => s.id === t.sector_id);
        const sectorName = sector ? ` [${sector.name}]` : "";
        const type = t.value > 0 ? "💰" : "💸";
        financialContext += `${type} ${t.date}: ${t.name} - R$${Math.abs(t.value).toFixed(2)}${sectorName}\n`;
      });
    }

    const systemPrompt = `Você é um assistente financeiro pessoal inteligente e amigável. Você tem DUAS funções principais:

1. REGISTRAR TRANSAÇÕES: Quando o usuário mencionar um gasto ou receita
2. CONSULTAR E ANALISAR: Quando o usuário perguntar sobre suas finanças

${sectorsContext}

${financialContext}

DATA ATUAL: ${currentDate.toLocaleDateString('pt-BR')} (${monthNames[currentMonth - 1]}/${currentYear})

INSTRUÇÕES:

Para REGISTRAR transações (ex: "gastei 50 no mercado", "recebi 3000 de salário"):
- Extraia valor, tipo (expense/income), descrição e setor
- Responda com JSON: {"action": "register", "success": true, "value": número, "type": "expense/income", "description": "...", "sector_id": "uuid ou null", "sector_name": "nome ou null"}

Para CONSULTAS e ANÁLISES (ex: "quanto gastei?", "como estão minhas finanças?", "gastos de mercado em janeiro"):
- Use os dados financeiros acima para responder
- Seja específico com números e períodos
- Formate valores em R$ brasileiro
- Se perguntar sobre um mês específico, use os dados daquele mês
- Responda com JSON: {"action": "query", "response": "sua resposta em texto formatado com markdown"}

REGRAS:
- Palavras como "gastei", "paguei", "comprei" = expense
- Palavras como "recebi", "ganhei", "salário" = income
- Para consultas, use markdown para formatar (negrito, listas, etc)
- Sempre responda em português brasileiro
- Se não tiver dados para responder, informe educadamente
- Para relatórios completos, inclua: receitas, despesas, saldo, maiores gastos por categoria

Responda APENAS em JSON válido.`;

    // Build messages array with conversation history
    const messages: Array<{role: string, content: string}> = [
      { role: "system", content: systemPrompt }
    ];

    if (conversationHistory && Array.isArray(conversationHistory)) {
      const recentHistory = conversationHistory.slice(-10);
      recentHistory.forEach((msg: any) => {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      });
    }

    messages.push({ role: "user", content: effectiveMessage });

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, message: "Muitas requisições. Aguarde um momento e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, message: "Créditos de IA esgotados. Entre em contato com o suporte." }),
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
      const cleanContent = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleanContent);
    } catch (e) {
      console.error("Failed to parse AI response:", aiContent);
      return new Response(
        JSON.stringify({ success: false, message: "Não consegui processar sua mensagem. Tente reformular.", audioTranscription }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle query action
    if (parsed.action === "query") {
      return new Response(
        JSON.stringify({ success: true, message: parsed.response, isQuery: true, audioTranscription }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle register action
    if (parsed.action === "register" && parsed.success && parsed.value && parsed.type) {
      const finalValue = parsed.type === "expense" ? -Math.abs(parsed.value) : Math.abs(parsed.value);
      const status = parsed.type === "income" ? "received" : "paid";

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

      const formattedValue = Math.abs(parsed.value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      
      const typeLabel = parsed.type === "expense" ? "💸 Despesa" : "💰 Receita";
      const sectorLabel = parsed.sector_name ? ` em **${parsed.sector_name}**` : "";
      
      const successMessage = `${typeLabel} registrada!\n\n**${parsed.description}**\n${formattedValue}${sectorLabel}`;

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: successMessage,
          audioTranscription,
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
    }

    // Fallback
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: parsed.error_message || parsed.response || "Não consegui entender sua mensagem. Tente algo como:\n• \"Gastei R$50 com mercado\"\n• \"Quanto gastei esse mês?\"\n• \"Como estão minhas finanças?\"",
        audioTranscription,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Finance chat error:", error);
    return new Response(
      JSON.stringify({ success: false, message: "Ocorreu um erro ao processar sua mensagem. Tente novamente." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
