import { BookOpen, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const chapters = [
  {
    id: "alimentacao",
    title: "Alimentação Correta",
    content: `# Como se alimentar de forma correta

A alimentação é a base de tudo. Sem combustível adequado, não existe performance.

## Princípios fundamentais

1. **Proteína em todas as refeições** - Mínimo 1.6g por kg de peso corporal
2. **Carboidratos como energia** - Ajuste conforme sua atividade
3. **Gorduras saudáveis** - Essenciais para hormônios
4. **Hidratação** - 35ml por kg de peso

## Regra 80/20

80% do tempo, coma limpo. 20% do tempo, viva.

> "Você não precisa ser perfeito. Precisa ser consistente."
`,
  },
  {
    id: "forca-vontade",
    title: "Por que Força de Vontade Falha",
    content: `# Por que Força de Vontade Falha

Força de vontade é um recurso limitado. Ela acaba.

## O problema

- Você acorda com X de força de vontade
- Cada decisão gasta um pouco
- No final do dia, o tanque está vazio

## A solução

**Sistemas, não metas.**

- Automatize decisões
- Prepare o ambiente
- Reduza fricção para bons hábitos
- Aumente fricção para maus hábitos

> "Você não sobe ao nível das suas metas. Você cai ao nível dos seus sistemas."
`,
  },
  {
    id: "constancia",
    title: "Como Manter Constância",
    content: `# Como Manter Constância na Rotina

Constância vence talento sem rotina. Sempre.

## A regra dos 2 minutos

Se algo demora menos de 2 minutos, faça agora.

## Nunca quebre a corrente

Marque um X no calendário todo dia que completar sua rotina. Sua única meta: não quebrar a corrente.

## Dias ruins contam

Aparecer no dia ruim vale mais que brilhar no dia bom.

- Dia bom: treino completo
- Dia ruim: 10 minutos de caminhada

**Os dois contam.**

> "Hoje você apareceu?"
`,
  },
  {
    id: "habitos",
    title: "Como Criar Bons Hábitos",
    content: `# Como Criar Bons Hábitos

Hábitos são a arquitetura invisível da sua vida.

## O loop do hábito

1. **Gatilho** - O que dispara o comportamento
2. **Rotina** - O comportamento em si
3. **Recompensa** - O que você ganha

## As 4 leis

1. Torne óbvio (gatilho visível)
2. Torne atraente (associe prazer)
3. Torne fácil (reduza fricção)
4. Torne satisfatório (recompense-se)

## Empilhamento de hábitos

"Depois de [HÁBITO ATUAL], vou [NOVO HÁBITO]."

Exemplo: "Depois de escovar os dentes, vou fazer 10 flexões."

> "Pequenas ações, repetidas consistentemente, criam resultados extraordinários."
`,
  },
];

export default function Ebook() {
  const [activeChapter, setActiveChapter] = useState(chapters[0].id);
  const [search, setSearch] = useState("");

  const currentChapter = chapters.find((c) => c.id === activeChapter);

  const filteredChapters = chapters.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold">Ebook</h1>
        <p className="text-muted-foreground">Conhecimento é poder.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar */}
        <div className="cave-card p-4 lg:col-span-1">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <nav className="space-y-1">
            {filteredChapters.map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => setActiveChapter(chapter.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  activeChapter === chapter.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {chapter.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="cave-card p-6 lg:col-span-3">
          {currentChapter ? (
            <article className="prose prose-invert prose-sm max-w-none">
              {currentChapter.content.split("\n").map((line, i) => {
                if (line.startsWith("# ")) {
                  return <h1 key={i} className="text-2xl font-bold mb-4">{line.slice(2)}</h1>;
                }
                if (line.startsWith("## ")) {
                  return <h2 key={i} className="text-xl font-semibold mt-6 mb-3">{line.slice(3)}</h2>;
                }
                if (line.startsWith("> ")) {
                  return <blockquote key={i} className="border-l-2 border-primary pl-4 italic text-muted-foreground my-4">{line.slice(2)}</blockquote>;
                }
                if (line.startsWith("- ")) {
                  return <li key={i} className="ml-4">{line.slice(2)}</li>;
                }
                if (line.match(/^\d+\./)) {
                  return <li key={i} className="ml-4">{line}</li>;
                }
                if (line.trim() === "") {
                  return <br key={i} />;
                }
                return <p key={i} className="my-2">{line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>;
              })}
            </article>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Selecione um capítulo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
