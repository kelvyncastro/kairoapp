import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { items } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um especialista em organização de supermercado brasileiro. Categorize cada item na seção CORRETA do supermercado onde ele é encontrado fisicamente.

REGRAS IMPORTANTES:
- Seja PRECISO. Ovos NÃO são laticínios, vão em "Ovos e Matinais". Manteiga e queijo SÃO laticínios.
- Considere onde o item fica FISICAMENTE no supermercado brasileiro.
- Cada item deve aparecer em APENAS UMA categoria.
- Retorne apenas categorias que tenham pelo menos 1 item.
- Capitalize corretamente o nome de cada item (ex: "Banana", "Arroz integral").

Categorias disponíveis (use exatamente estes nomes):
- Frutas (banana, maçã, laranja, uva, melancia, etc.)
- Verduras e Legumes (alface, tomate, cebola, batata, cenoura, etc.)
- Carnes e Aves (frango, carne bovina, carne suína, linguiça fresca, etc.)
- Peixes e Frutos do Mar (salmão, tilápia, camarão, etc.)
- Laticínios (leite, queijo, iogurte, manteiga, requeijão, creme de leite, etc.)
- Ovos e Matinais (ovos, cereais matinais, granola, mel, geleia, etc.)
- Padaria (pão, bolo, torrada, croissant, etc.)
- Frios e Embutidos (presunto, mortadela, salame, peito de peru, etc.)
- Bebidas (água, suco, refrigerante, cerveja, vinho, café, chá, etc.)
- Grãos, Cereais e Massas (arroz, feijão, macarrão, farinha, aveia, lentilha, etc.)
- Óleos e Temperos (óleo, azeite, sal, pimenta, alho, orégano, vinagre, molho de soja, etc.)
- Enlatados e Conservas (milho, ervilha, atum, sardinha, molho de tomate, etc.)
- Higiene Pessoal (sabonete, shampoo, pasta de dente, desodorante, papel higiênico, etc.)
- Limpeza (detergente, desinfetante, água sanitária, esponja, saco de lixo, etc.)
- Congelados (pizza congelada, sorvete, legumes congelados, etc.)
- Doces e Snacks (chocolate, biscoito, salgadinho, bala, etc.)
- Produtos para Casa (pilha, lâmpada, fósforo, vela, etc.)
- Outros (qualquer item que não se encaixe nas categorias acima)

Responda usando tool calling.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Categorize estes itens de mercado: ${items}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "categorize_items",
              description: "Categoriza itens de mercado em setores do supermercado",
              parameters: {
                type: "object",
                properties: {
                  categories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Nome do setor" },
                        emoji: { type: "string", description: "Emoji representativo do setor" },
                        items: {
                          type: "array",
                          items: { type: "string" },
                          description: "Itens que pertencem a este setor",
                        },
                      },
                      required: ["name", "emoji", "items"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["categories"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "categorize_items" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) throw new Error("No tool call in response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("categorize-grocery error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
