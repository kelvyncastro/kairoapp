import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Check, ChevronLeft, Star, CheckCircle2, Target, Flame, Wallet, Calendar, BarChart3, Clock, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";
import kairoLogo from "@/assets/kairo-penguin.png";
import { Link } from "react-router-dom";

// ── Animated Background ────────────────────────────────────

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary/[0.03]"
          style={{
            width: `${100 + i * 50}px`,
            height: `${100 + i * 50}px`,
            left: `${(i * 23) % 80}%`,
            top: `${(i * 31) % 80}%`,
          }}
          animate={{
            x: [0, 20 * (i % 2 === 0 ? 1 : -1), 0],
            y: [0, 15 * (i % 2 === 0 ? -1 : 1), 0],
            scale: [1, 1.08, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10 + i * 2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
        />
      ))}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute top-[-30%] left-1/2 -translate-x-1/2 w-[100vw] h-[50vh] rounded-full bg-primary/[0.05] blur-[100px]" />
    </div>
  );
}

// ── Quiz Data ──────────────────────────────────────────────

interface FeedbackData {
  title: string;
  insight: string;
  steps: string[];
  stepsLabel?: string;
  kairoTip: string;
}

interface QuizOption {
  icon: string;
  label: string;
  description?: string;
  feedback: FeedbackData;
}

interface QuizQuestion {
  question: string;
  subtitle?: string;
  multiSelect?: boolean;
  options: QuizOption[];
}

const questions: QuizQuestion[] = [
  {
    question: "Pergunta 1: Seu Maior Desafio",
    subtitle: "Qual é seu maior desafio no dia a dia?",
    options: [
      {
        icon: "📋",
        label: "Organizar todas as minhas tarefas",
        description: "Tenho muitas coisas para fazer e não consigo priorizar",
        feedback: {
          title: "Você sofre com Sobrecarga Cognitiva",
          insight: "Seu cérebro gasta energia tentando lembrar de tudo em vez de executar. Resultado: 40% menos produtividade.",
          stepsLabel: "Faça AGORA",
          steps: [
            "Escreva tudo que está na sua cabeça (brain dump)",
            "Organize em 3 grupos: Hoje, Esta Semana, Este Mês",
            "Escolha apenas 3 tarefas para hoje",
            "Revise 5 minutos toda noite",
          ],
          kairoTip: "O módulo de Tarefas organiza automaticamente. Você vê apenas as 3 prioritárias no dashboard.",
        },
      },
      {
        icon: "🎯",
        label: "Manter consistência com meus objetivos",
        description: "Defino metas mas não consigo acompanhar o progresso",
        feedback: {
          title: "Você sofre com Falta de Accountability Visual",
          insight: "Objetivos sem acompanhamento visual são apenas desejos. Pessoas que rastreiam metas têm 3x mais chances de alcançá-las.",
          stepsLabel: "Faça AGORA",
          steps: [
            "Defina 1 meta clara (não 10)",
            "Crie marcos intermediários",
            "Escolha um rastreador visual",
            "Revise toda semana",
          ],
          kairoTip: "Metas com marcos automáticos + Streaks (não quebrar a corrente) = motivação garantida.",
        },
      },
      {
        icon: "💰",
        label: "Controlar minhas finanças",
        description: "Não tenho visibilidade sobre meus gastos e receitas",
        feedback: {
          title: "Você sofre com Falta de Visibilidade",
          insight: "78% das pessoas não sabem para onde seu dinheiro vai. Quem rastreia economiza 20%.",
          stepsLabel: "Faça AGORA",
          steps: [
            "Categorize seus últimos 3 meses de gastos",
            "Identifique \"vazamentos\" (café, apps, assinaturas)",
            "Crie uma meta: \"Economizar R$500/mês\"",
            "Rastreie diariamente",
          ],
          kairoTip: "Rastreamento automático + IA que identifica padrões + gráficos em tempo real.",
        },
      },
      {
        icon: "⏰",
        label: "Gerenciar meu tempo",
        description: "Sinto que o tempo passa rápido e não consigo fazer tudo",
        feedback: {
          title: "Você sofre com Falta de Estrutura Temporal",
          insight: "Sem estrutura, o tempo desaparece. Pessoas que estruturam ganham 2-3 horas produtivas por dia.",
          stepsLabel: "Faça AGORA",
          steps: [
            "Identifique seus \"energy peaks\" (quando você é mais produtivo)",
            "Trabalhe em blocos de 90 minutos + 15 min pausa",
            "Diga \"não\" a reuniões desnecessárias",
            "Revise semanalmente como gastou seu tempo",
          ],
          kairoTip: "Calendário integrado + timer para blocos focados + sincronização em tempo real.",
        },
      },
      {
        icon: "🧠",
        label: "Manter foco e evitar distrações",
        description: "Tenho dificuldade em manter a concentração",
        feedback: {
          title: "Você sofre com Fragmentação de Atenção",
          insight: "Cada mudança de contexto leva 15-25 min para recuperar foco. 5 interrupções = 2 horas perdidas.",
          stepsLabel: "Faça AGORA",
          steps: [
            "Crie \"blocos de foco\" de 90 minutos sem interrupções",
            "Defina 2-3 horários específicos para email/Slack",
            "Use Pomodoro: 25 min foco + 5 min pausa",
            "Elimine distrações físicas (telefone longe)",
          ],
          kairoTip: "Dashboard limpo (sem ruído) + timer integrado + Streaks para manter consistência.",
        },
      },
    ],
  },
  {
    question: "Pergunta 2: Seu Estilo de Trabalho",
    subtitle: "Como você naturalmente prefere trabalhar?",
    options: [
      {
        icon: "📊",
        label: "Vejo tudo em um dashboard centralizado",
        description: "Prefiro ter uma visão geral de tudo em um único lugar",
        feedback: {
          title: "Você é um Visual Integrador",
          insight: "Você precisa ver o quadro geral. Pessoas que veem contexto completo tomam melhores decisões.",
          stepsLabel: "Recomendação",
          steps: [
            "Crie um \"dashboard mental\" toda segunda",
            "Use regra 80/20: foque nos 20% que geram 80% dos resultados",
            "Mantenha um scorecard pessoal (5-7 métricas)",
          ],
          kairoTip: "Dashboard que mostra tudo: tarefas, metas, hábitos, finanças. Tudo em um lugar.",
        },
      },
      {
        icon: "✅",
        label: "Prefiro listas simples e diretas",
        description: "Gosto de marcar tarefas conforme as completo",
        feedback: {
          title: "Você é um Executor Focado",
          insight: "Você quer clareza e ação. Pessoas que usam listas completam 30% mais tarefas.",
          stepsLabel: "Recomendação",
          steps: [
            "Regra \"3 tarefas por dia\" (seu cérebro não foca em mais)",
            "Crie listas por contexto (Trabalho, Casa, Pessoal)",
            "Revise toda noite (5 minutos)",
          ],
          kairoTip: "Tarefas simples e diretas. Sem complicação. Marque como feito e pronto.",
        },
      },
      {
        icon: "📅",
        label: "Gosto de visualizar em calendário",
        description: "Prefiro ver minhas atividades distribuídas no tempo",
        feedback: {
          title: "Você é um Planejador Temporal",
          insight: "Você pensa em termos de tempo. Pessoas que planejam temporalmente têm 50% menos estresse.",
          stepsLabel: "Recomendação",
          steps: [
            "Planeje sua semana todo domingo",
            "Use \"time blocking\": 9-11h = Projeto A, 14-16h = Reuniões",
            "Deixe 20% do tempo livre para o inesperado",
          ],
          kairoTip: "Calendário integrado que mostra tudo distribuído no tempo.",
        },
      },
      {
        icon: "🎨",
        label: "Preciso de um visual limpo e minimalista",
        description: "Design clean e sem poluição visual é essencial",
        feedback: {
          title: "Você é um Minimalista Focado",
          insight: "Poluição visual = poluição mental. Pessoas em ambientes minimalistas têm 30% mais foco.",
          stepsLabel: "Recomendação",
          steps: [
            "Dashboard deve ter apenas o essencial",
            "Remova tudo que não é crítico",
            "Revise mensalmente: \"Isso ainda é essencial?\"",
          ],
          kairoTip: "Design minimalista por padrão. Sem ruído, sem distração.",
        },
      },
      {
        icon: "🔄",
        label: "Gosto de acompanhar progresso visual",
        description: "Preciso ver meu progresso em gráficos e estatísticas",
        feedback: {
          title: "Você é um Motivado Visual",
          insight: "Você precisa VER o progresso. Pessoas motivadas visualmente têm 5x mais consistência.",
          stepsLabel: "Recomendação",
          steps: [
            "Crie métricas visuais (não \"fazer exercício\", mas \"20 exercícios/semana\")",
            "Use gráficos e acompanhe tendências",
            "Celebre marcos visuais de progresso",
          ],
          kairoTip: "Gráficos detalhados de progresso em hábitos, metas e finanças.",
        },
      },
    ],
  },
  {
    question: "Pergunta 3: Frequência de Acompanhamento",
    subtitle: "Com que frequência você acompanha suas atividades?",
    options: [
      {
        icon: "⚡",
        label: "Diariamente, várias vezes ao dia",
        description: "Preciso revisar e atualizar constantemente",
        feedback: {
          title: "Você é um Otimizador Contínuo",
          insight: "Você quer estar sempre ajustando. Ótimo para crescimento, mas cuidado com obsessão.",
          stepsLabel: "Recomendação",
          steps: [
            "Defina \"horários de revisão\" (9h, 14h, 18h) em vez de revisar constantemente",
            "Diferencie: revisão rápida (2 min) vs análise profunda (30 min, 1x/semana)",
            "Nem tudo precisa ser otimizado",
          ],
          kairoTip: "Sincronização instantânea + notificações inteligentes (sem obsessão).",
        },
      },
      {
        icon: "📅",
        label: "Diariamente, uma vez ao dia",
        description: "Faço uma revisão diária das minhas atividades",
        feedback: {
          title: "Você é um Revisor Consistente",
          insight: "Você tem ritual diário. Excelente! Pessoas com revisão diária têm 70% mais consistência.",
          stepsLabel: "Recomendação",
          steps: [
            "Crie ritual: manhã (planejar) ou noite (revisar). Sempre 10 minutos.",
            "Use sistema de streaks (não quebrar a corrente)",
            "Faça gráficos semanais para ver melhoria",
          ],
          kairoTip: "Dashboard perfeito para seu ritual diário. 5-10 minutos e pronto.",
        },
      },
      {
        icon: "📆",
        label: "Algumas vezes por semana",
        description: "Acompanho meu progresso 2-3 vezes na semana",
        feedback: {
          title: "Você é um Planejador Flexível",
          insight: "Você é equilibrado. Consistente mas não obsessivo.",
          stepsLabel: "Recomendação",
          steps: [
            "Escolha 2-3 dias específicos (seg, qua, sex)",
            "Faça revisão mais profunda nesses dias",
            "Combine com revisão semanal no domingo",
          ],
          kairoTip: "Adapta ao seu ritmo. Sem pressão de acessar diariamente.",
        },
      },
      {
        icon: "🗓",
        label: "Semanalmente",
        description: "Faço uma revisão semanal do que foi feito",
        feedback: {
          title: "Você é um Planejador Estratégico",
          insight: "Você vê padrões que outros não veem. Excelente para visão macro.",
          stepsLabel: "Recomendação",
          steps: [
            "Ritual semanal: domingo à noite ou segunda de manhã (30-60 min)",
            "Fórmula: Revisar → Refletir → Planejar",
            "Identifique vitórias e aprendizados",
          ],
          kairoTip: "Relatórios semanais + tendências + histórico. Perfeito para planejamento estratégico.",
        },
      },
      {
        icon: "📋",
        label: "Mensalmente",
        description: "Prefiro acompanhar em ciclos mensais",
        feedback: {
          title: "Você é um Visionário de Longo Prazo",
          insight: "Você não fica preso em detalhes. Excelente para objetivos maiores.",
          stepsLabel: "Recomendação",
          steps: [
            "Ritual mensal: último ou primeiro dia do mês (60-90 min)",
            "Fórmula: Revisar → Analisar → Planejar",
            "Crie \"experimentos\" para o próximo mês",
          ],
          kairoTip: "Relatórios mensais + tendências de longo prazo. Visão macro garantida.",
        },
      },
    ],
  },
  {
    question: "Pergunta 4: Suas Áreas de Foco",
    subtitle: "Quais áreas você quer organizar? (Múltipla seleção)",
    multiSelect: true,
    options: [
      {
        icon: "🎯",
        label: "Metas e objetivos pessoais",
        description: "Quero definir e acompanhar meus objetivos de longo prazo",
        feedback: {
          title: "Você é um Construtor de Futuro",
          insight: "92% das pessoas não alcançam metas porque não as acompanham. Você vai ser diferente.",
          stepsLabel: "Faça AGORA",
          steps: [
            "Defina 3 metas para 90 dias (não 10)",
            "Crie 3-4 marcos intermediários por meta",
            "Revise toda semana",
          ],
          kairoTip: "Metas com marcos automáticos + progresso visual + histórico.",
        },
      },
      {
        icon: "📝",
        label: "Tarefas do trabalho",
        description: "Preciso gerenciar minhas tarefas profissionais",
        feedback: {
          title: "Você é um Profissional Organizado",
          insight: "Pessoas que organizam tarefas são 40% mais produtivas.",
          stepsLabel: "Faça AGORA",
          steps: [
            "Brain dump: escreva tudo que precisa fazer",
            "Escolha 3 tarefas prioritárias para hoje",
            "Revise toda noite",
          ],
          kairoTip: "Kanban visual + priorização + prazos. Nunca mais esquece nada.",
        },
      },
      {
        icon: "🏃",
        label: "Hábitos e rotinas",
        description: "Quero criar e manter hábitos saudáveis",
        feedback: {
          title: "Você é um Construtor de Hábitos",
          insight: "Leva 66 dias para um hábito se formar. Hábitos visuais têm 5x mais sucesso.",
          stepsLabel: "Faça AGORA",
          steps: [
            "Escolha 1-2 hábitos (não 10)",
            "Defina um gatilho (depois do café? antes de dormir?)",
            "Crie rastreador visual (calendário na parede)",
          ],
          kairoTip: "Streaks (não quebrar a corrente) + visualização de progresso.",
        },
      },
      {
        icon: "💵",
        label: "Finanças pessoais",
        description: "Preciso controlar meus gastos e receitas",
        feedback: {
          title: "Você é um Gestor Financeiro",
          insight: "Pessoas que rastreiam economizam 20%. Quem não rastreia não sabe para onde o dinheiro vai.",
          stepsLabel: "Faça AGORA",
          steps: [
            "Categorize últimos 3 meses de gastos",
            "Identifique \"vazamentos\"",
            "Crie meta: \"Economizar R$X/mês\"",
          ],
          kairoTip: "Rastreamento automático + IA + gráficos + insights.",
        },
      },
      {
        icon: "🛒",
        label: "Compras e lista de mercado",
        description: "Gosto de organizar minhas compras",
        feedback: {
          title: "Você é um Organizador Prático",
          insight: "Pessoas que fazem lista gastam 30% menos. Você esquece 25% do que precisa se não anotar.",
          stepsLabel: "Faça AGORA",
          steps: [
            "Crie \"lista mestre\" de compras",
            "Organize por categoria",
            "Marque conforme compra",
          ],
          kairoTip: "Listas compartilháveis + sincronização em tempo real.",
        },
      },
      {
        icon: "📝",
        label: "Anotações e ideias",
        description: "Preciso capturar e organizar minhas ideias",
        feedback: {
          title: "Você é um Criativo Capturador",
          insight: "Você esquece 90% das suas ideias em 24 horas. Ideias capturadas têm 10x mais chances de serem executadas.",
          stepsLabel: "Faça AGORA",
          steps: [
            "Crie sistema de captura (telefone, papel, qualquer lugar)",
            "Revise ideias toda semana",
            "Organize por tema",
          ],
          kairoTip: "Captura rápida + sincronização + organização por categoria.",
        },
      },
    ],
  },
  {
    question: "Pergunta 5: Seu Objetivo Principal",
    subtitle: "O que você quer alcançar com melhor organização?",
    options: [
      {
        icon: "🚀",
        label: "Aumentar minha produtividade",
        description: "Quero fazer mais em menos tempo",
        feedback: {
          title: "Você quer fazer mais em menos tempo",
          insight: "40% da produtividade vem de organização. 30% de foco. 20% de energia. 10% de ferramentas.",
          stepsLabel: "Faça AGORA",
          steps: [
            "Elimine distrações (notificações, abas, telefone)",
            "Trabalhe em blocos: 90 min foco + 15 min pausa",
            "Faça tarefa importante PRIMEIRO (antes de email)",
          ],
          kairoTip: "Dashboard limpo + timer + Kanban visual. Foco garantido.",
        },
      },
      {
        icon: "😌",
        label: "Reduzir estresse e ansiedade",
        description: "Sinto que organização me ajudaria a ficar mais tranquilo",
        feedback: {
          title: "Você quer paz mental",
          insight: "73% do estresse vem de não saber o que fazer. Pessoas organizadas têm 60% menos ansiedade.",
          stepsLabel: "Faça AGORA",
          steps: [
            "Brain dump: escreva tudo que está na cabeça",
            "Crie um \"sistema confiável\" onde tudo fica registrado",
            "Revise regularmente",
          ],
          kairoTip: "Seu \"sistema confiável\" centralizado. Seu cérebro relaxa.",
        },
      },
      {
        icon: "💪",
        label: "Manter consistência e disciplina",
        description: "Quero construir hábitos e manter disciplina",
        feedback: {
          title: "Você quer construir hábitos que mudam vidas",
          insight: "Consistência vence talento. Pequenos passos consistentes vencem grandes passos inconsistentes.",
          stepsLabel: "Faça AGORA",
          steps: [
            "Escolha 1-2 hábitos",
            "Crie rastreador visual",
            "Comece pequeno (20 min é melhor que 1h que você não vai fazer)",
          ],
          kairoTip: "Streaks + visualização = vício positivo que mantém você consistente.",
        },
      },
      {
        icon: "🎓",
        label: "Aprender e crescer pessoalmente",
        description: "Quero investir em meu desenvolvimento",
        feedback: {
          title: "Você quer evoluir como pessoa",
          insight: "Pessoas que aprendem consistentemente ganham 50% mais.",
          stepsLabel: "Faça AGORA",
          steps: [
            "Defina uma habilidade para desenvolver",
            "Crie plano: cursos, livros, prática",
            "Rastreie progresso",
          ],
          kairoTip: "Rastreie aprendizado + organize cursos + monitore hábitos de prática.",
        },
      },
      {
        icon: "💰",
        label: "Melhorar minha situação financeira",
        description: "Quero ter melhor controle e aumentar minha renda",
        feedback: {
          title: "Você quer tomar controle das finanças",
          insight: "Dinheiro segue quem o acompanha. Você pode aumentar renda em 20-30% apenas com visibilidade.",
          stepsLabel: "Faça AGORA",
          steps: [
            "Audit: categorize últimos 3 meses",
            "Identifique vazamentos",
            "Crie meta financeira clara",
          ],
          kairoTip: "Rastreamento automático + IA para insights + metas financeiras.",
        },
      },
      {
        icon: "⚖️",
        label: "Equilibrar vida pessoal e profissional",
        description: "Quero separar e balancear essas áreas",
        feedback: {
          title: "Você quer viver bem em todas as áreas",
          insight: "Falta de equilíbrio causa 60% do burnout. Pessoas equilibradas são 3x mais felizes.",
          stepsLabel: "Faça AGORA",
          steps: [
            "Defina suas áreas: Trabalho, Família, Saúde, Finanças, Desenvolvimento, Lazer",
            "Crie uma meta por área",
            "Revise semanalmente o equilíbrio",
          ],
          kairoTip: "Dashboard mostra todas as áreas. Você vê o equilíbrio visualmente.",
        },
      },
    ],
  },
  {
    question: "Pergunta 6: Sua Experiência com Ferramentas",
    subtitle: "Você já usou apps de produtividade antes?",
    options: [
      {
        icon: "✨",
        label: "Não, essa é minha primeira vez",
        description: "Estou começando agora com ferramentas de organização",
        feedback: {
          title: "Bem-vindo! Você está no lugar certo",
          insight: "Não tenha medo. Comece pequeno. Leva 2-3 semanas para se acostumar.",
          stepsLabel: "Faça AGORA",
          steps: [
            "Escolha um módulo para começar (recomendamos Tarefas ou Hábitos)",
            "Dedique 15 minutos para explorar",
            "Crie seu primeiro item",
            "Use por 7 dias",
          ],
          kairoTip: "Interface intuitiva. Você não precisa de experiência anterior. Comece simples, explore depois.",
        },
      },
      {
        icon: "🔄",
        label: "Sim, mas não consegui manter consistência",
        description: "Tentei mas abandonei por falta de hábito",
        feedback: {
          title: "Você não está sozinho. Dessa vez vai ser diferente",
          insight: "Você provavelmente abandonou porque: ferramenta complicada, se sentiu sobrecarregado, faltou motivação visual.",
          stepsLabel: "Faça AGORA",
          steps: [
            "Comece com APENAS um hábito",
            "Crie ritual (sempre mesmo horário)",
            "Vise 80%, não 100%",
            "Celebre pequenas vitórias",
          ],
          kairoTip: "Streaks cria dinâmica viciante. Você não quer quebrar a corrente. Dessa vez vai ser diferente.",
        },
      },
      {
        icon: "✅",
        label: "Sim, e tenho experiência com eles",
        description: "Já uso apps e conheço bem como funcionam",
        feedback: {
          title: "Você vai apreciar a Kairo",
          insight: "Como alguém com experiência, você vai entender o valor de uma ferramenta bem feita.",
          stepsLabel: "O que você vai amar",
          steps: [
            "Tudo integrado (não fragmentado)",
            "Simples mas poderoso",
            "Design limpo (sem complicação desnecessária)",
            "Sincronização perfeita",
          ],
          kairoTip: "Eficiência que você nunca viu. Tudo conectado. É o app que você estava esperando.",
        },
      },
      {
        icon: "🎯",
        label: "Sim, mas quero algo mais completo",
        description: "Usava algo simples e quero algo mais robusto",
        feedback: {
          title: "Você está pronto para o upgrade",
          insight: "Se você sentia falta de integração, análise profunda e sincronização, a Kairo é exatamente o que você procura.",
          stepsLabel: "O que você vai ganhar",
          steps: [
            "Suite completa integrada",
            "Análise profunda com IA",
            "Sincronização instantânea",
            "Crescimento sem limite",
          ],
          kairoTip: "Tudo em um lugar. Use o que precisa, quando precisa. É a suite completa que você queria.",
        },
      },
    ],
  },
];

// ── Profile Logic ──────────────────────────────────────────

interface Profile {
  title: string;
  emoji: string;
  description: string;
  modules: string[];
  tip: string;
}

const profiles: Record<string, Profile> = {
  organizador: { title: "O Organizador de Tarefas", emoji: "📋", description: "Você é focado em tarefas, prefere listas e usa ferramentas frequentemente.", modules: ["Tarefas", "Calendário"], tip: "Use o Kanban para visualizar suas tarefas em diferentes estágios." },
  perseguidor: { title: "O Perseguidor de Metas", emoji: "🎯", description: "Foco em objetivos, quer acompanhar progresso e se motiva por consistência.", modules: ["Metas", "Streaks"], tip: "Configure metas com marcos intermediários para manter a motivação." },
  financeiro: { title: "O Controlador Financeiro", emoji: "💰", description: "Foco em finanças, quer análise, gráficos e insights por IA.", modules: ["Finanças", "Dashboard"], tip: "Use o assistente financeiro com IA para insights sobre seus gastos." },
  construtor: { title: "O Construtor de Hábitos", emoji: "🏃", description: "Foco em consistência, quer ver streaks e se motiva por progresso visual.", modules: ["Hábitos", "Streaks"], tip: "Comece com 2-3 hábitos simples e vá aumentando." },
  equilibrador: { title: "O Equilibrador de Vida", emoji: "⚖️", description: "Quer organizar todas as áreas, busca equilíbrio pessoal e profissional.", modules: ["Dashboard", "Todas as ferramentas"], tip: "Use o Dashboard para visão macro de todas as áreas." },
  iniciante: { title: "O Iniciante Curioso", emoji: "✨", description: "Primeira experiência com organização, aberto a explorar e aprender.", modules: ["Tarefas", "Hábitos"], tip: "Faça um tour pelos módulos e comece com o que faz sentido." },
};

function determineProfile(answers: Record<number, number | number[]>): Profile {
  const q1 = answers[0] as number;
  const q5 = answers[4] as number;
  const q6 = answers[5] as number;
  if (q6 === 0) return profiles.iniciante;
  if (q1 === 0 || q5 === 0) return profiles.organizador;
  if (q1 === 1 || q5 === 2) return profiles.perseguidor;
  if (q1 === 2 || q5 === 4) return profiles.financeiro;
  if (q1 === 4 || q5 === 2) return profiles.construtor;
  if (q5 === 5) return profiles.equilibrador;
  return profiles.perseguidor;
}

// ── Component ──────────────────────────────────────────────

export default function Quiz() {
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | number[]>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [multiSelected, setMultiSelected] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  const q = questions[currentQ];
  const totalQ = questions.length;

  useEffect(() => {
    if (!finished) return;
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ["#f97316", "#eab308", "#22c55e", "#a855f7", "#3b82f6"];
    const frame = () => {
      confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    setTimeout(() => {
      confetti({ particleCount: 150, spread: 120, origin: { x: 0.5, y: 0.4 }, colors, startVelocity: 35, gravity: 0.8 });
    }, 400);
  }, [finished]);

  const handleSelect = (idx: number) => {
    if (showFeedback) return;
    if (q.multiSelect) {
      setMultiSelected((prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]);
    } else {
      setSelectedOption(idx);
      setAnswers((prev) => ({ ...prev, [currentQ]: idx }));
      setShowFeedback(true);
    }
  };

  const handleMultiContinue = () => {
    if (multiSelected.length === 0) return;
    setAnswers((prev) => ({ ...prev, [currentQ]: multiSelected }));
    setSelectedOption(multiSelected[0]);
    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedOption(null);
    setMultiSelected([]);
    if (currentQ < totalQ - 1) setCurrentQ((prev) => prev + 1);
    else setFinished(true);
  };

  const handleBack = () => {
    if (currentQ > 0 && !showFeedback) {
      setCurrentQ((prev) => prev - 1);
      setSelectedOption(null);
      setMultiSelected([]);
    }
  };

  const profile = finished ? determineProfile(answers) : null;
  const feedbackData = selectedOption !== null ? q.options[selectedOption].feedback : null;

  // ── Splash Screen ──
  if (!started) {
    return (
      <div className="min-h-[100dvh] bg-background text-foreground flex flex-col relative overflow-hidden">
        <AnimatedBackground />

        <main className="flex-1 flex flex-col items-center justify-center px-5 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="w-full max-w-sm flex flex-col items-center text-center"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 12, delay: 0.2 }}
              className="mb-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/40 flex items-center justify-center shadow-2xl shadow-primary/10">
                <img src={kairoLogo} alt="Kairo" className="w-10 h-10 rounded-lg" />
              </div>
            </motion.div>

            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/8 border border-primary/15 mb-4"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.12em] text-primary/80 uppercase">
                Quiz personalizado
              </span>
            </motion.div>

            {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-[22px] sm:text-3xl font-bold leading-tight mb-2.5"
              >
                Descubra seu estilo de produtividade
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-[13px] text-muted-foreground leading-relaxed mb-6 max-w-[300px]"
              >
                Em 3 minutos, entenda qual é a melhor forma de organizar sua vida e quais ferramentas da Kairo são perfeitas para você.
              </motion.p>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-center gap-1.5 mb-5"
            >
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-[11px] text-muted-foreground ml-1">+500 já fizeram</span>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="w-full"
            >
              <Button
                onClick={() => setStarted(true)}
                className="w-full h-12 rounded-2xl text-sm font-bold tracking-wide uppercase gap-2 shadow-xl shadow-primary/20"
              >
                Começar agora
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>

            {/* Time */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-[11px] text-muted-foreground/50 mt-3"
            >
              ⏱ Leva menos de 2 minutos
            </motion.p>
          </motion.div>
        </main>
      </div>
    );
  }

  // ── Quiz Flow ──
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col relative overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <header className="w-full bg-background/60 backdrop-blur-2xl sticky top-0 z-50 border-b border-border/20 safe-area-top">
        <div className="max-w-lg mx-auto px-4 py-2.5 flex items-center">
          {currentQ > 0 && !showFeedback && !finished ? (
            <button onClick={handleBack} className="p-1 -ml-1 rounded-full active:bg-accent transition-colors">
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
          ) : (
            <div className="w-7" />
          )}
          <div className="flex-1 flex justify-center">
            <img src={kairoLogo} alt="Kairo" className="h-5 w-5 rounded-md" />
          </div>
          <span className="text-[11px] text-muted-foreground font-semibold tabular-nums w-7 text-right">
            {finished ? totalQ : currentQ + 1}/{totalQ}
          </span>
        </div>

        {/* Progress */}
        <div className="max-w-lg mx-auto px-4 pb-2">
          <div className="flex gap-1">
            {Array.from({ length: totalQ }).map((_, i) => (
              <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden bg-muted/40">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={false}
                  animate={{ width: i < currentQ || finished ? "100%" : i === currentQ ? "40%" : "0%" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-4 overflow-y-auto relative z-10">
        <AnimatePresence mode="wait">
          {!finished ? (
            <motion.div
              key={`q-${currentQ}-${showFeedback ? "fb" : "q"}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full max-w-lg"
            >
              {!showFeedback ? (
                <>
                  {/* Question */}
                  <div className="mb-4">
                    <h2 className="text-[17px] sm:text-xl font-bold text-center leading-snug mb-1">
                      {q.question}
                    </h2>
                    {q.subtitle && (
                      <p className="text-[11px] text-muted-foreground text-center">{q.subtitle}</p>
                    )}
                  </div>

                  {/* Options */}
                  <div className="flex flex-col gap-2">
                    {q.options.map((opt, idx) => {
                      const isMultiSelected = multiSelected.includes(idx);
                      return (
                        <motion.button
                          key={idx}
                          onClick={() => handleSelect(idx)}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03, duration: 0.25 }}
                          className={`group flex items-center gap-3 w-full text-left px-3.5 py-3 rounded-xl border transition-all duration-150 active:scale-[0.98] ${
                            isMultiSelected
                              ? "border-primary/40 bg-primary/8 shadow-[0_0_20px_-6px] shadow-primary/15"
                              : "border-border/30 bg-card/40 backdrop-blur-sm active:bg-accent/40"
                          }`}
                        >
                          <span className="text-lg flex-shrink-0">{opt.icon}</span>
                          <div className="flex-1 min-w-0">
                            <span className="block font-semibold text-[13px] leading-snug">{opt.label}</span>
                            {opt.description && (
                              <span className="block text-[11px] text-muted-foreground leading-snug mt-0.5">{opt.description}</span>
                            )}
                          </div>
                          {q.multiSelect && (
                            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                              isMultiSelected ? "border-primary bg-primary" : "border-muted-foreground/20"
                            }`}>
                              {isMultiSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Multi-select continue */}
                  {q.multiSelect && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                      <Button
                        onClick={handleMultiContinue}
                        disabled={multiSelected.length === 0}
                        className="w-full h-11 rounded-xl gap-2 text-sm font-semibold disabled:opacity-30"
                      >
                        Continuar
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
                </>
              ) : (
                /* Feedback - Structured Card */
                <div className="flex flex-col pt-2 pb-4">
                  {feedbackData && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-xl overflow-hidden"
                    >
                      {/* Header */}
                      <div className="px-4 pt-4 pb-3 border-b border-border/20 bg-primary/5">
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Sparkles className="h-4 w-4 text-primary" />
                          </div>
                          <h3 className="text-[15px] font-bold leading-tight">{feedbackData.title}</h3>
                        </div>
                        <p className="text-[12px] text-muted-foreground leading-relaxed">{feedbackData.insight}</p>
                      </div>

                      {/* Steps */}
                      <div className="px-4 py-3 border-b border-border/20">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-primary/70 mb-2">
                          {feedbackData.stepsLabel || "Faça AGORA"}
                        </p>
                        <div className="space-y-2">
                          {feedbackData.steps.map((step, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.15 + i * 0.06 }}
                              className="flex items-start gap-2.5"
                            >
                              <span className="flex-shrink-0 w-5 h-5 rounded-md bg-secondary/80 flex items-center justify-center text-[10px] font-bold text-foreground/70 mt-0.5">
                                {i + 1}
                              </span>
                              <span className="text-[12px] leading-snug text-foreground/90">{step}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Kairo Tip */}
                      <div className="px-4 py-3 bg-primary/[0.03]">
                        <div className="flex items-start gap-2">
                          <img src={kairoLogo} alt="Kairo" className="w-4 h-4 rounded-sm mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            <span className="font-semibold text-foreground/80">Na Kairo:</span> {feedbackData.kairoTip}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Next Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4"
                  >
                    <Button onClick={handleNext} className="w-full h-11 rounded-xl gap-2 text-sm font-semibold">
                      {currentQ < totalQ - 1 ? "Próxima pergunta" : "Ver meu resultado"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              )}
            </motion.div>
          ) : (
            /* ── Result Screen with Benefits & Pricing ── */
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-lg pb-8"
            >
              {/* Profile card */}
              <div className="relative rounded-2xl border border-border/30 overflow-hidden mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
                <div className="absolute inset-0 bg-card/60 backdrop-blur-2xl" />
                <div className="relative z-10 p-5 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10, delay: 0.2 }}
                    className="text-4xl mb-2"
                  >
                    {profile?.emoji}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/8 border border-primary/15 mb-1.5"
                  >
                    <span className="text-[9px] font-bold tracking-[0.12em] text-primary/70 uppercase">Seu perfil</span>
                  </motion.div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="text-lg font-bold mb-1.5"
                  >
                    {profile?.title}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    className="text-xs text-muted-foreground leading-relaxed"
                  >
                    {profile?.description}
                  </motion.p>
                </div>
              </div>

              {/* Modules + Tip compact */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex gap-2 mb-6"
              >
                <div className="flex-1 bg-card/50 backdrop-blur-sm border border-border/25 rounded-xl p-3">
                  <p className="text-[10px] font-semibold mb-1.5 flex items-center gap-1">📌 Recomendados</p>
                  <div className="flex flex-wrap gap-1">
                    {profile?.modules.map((m) => (
                      <span key={m} className="px-2 py-0.5 bg-primary/8 text-primary text-[10px] font-semibold rounded-md border border-primary/15">{m}</span>
                    ))}
                  </div>
                </div>
                <div className="flex-1 bg-card/50 backdrop-blur-sm border border-border/25 rounded-xl p-3">
                  <p className="text-[10px] font-semibold mb-1 flex items-center gap-1">💡 Dica</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{profile?.tip}</p>
                </div>
              </motion.div>

              {/* Benefits Section */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="mb-6"
              >
                <h3 className="text-base font-bold text-center mb-4">O que você ganha com a Kairo</h3>
                <div className="space-y-2">
                  {[
                    { icon: Target, title: "Metas Inteligentes", desc: "Progresso visual e histórico detalhado" },
                    { icon: Flame, title: "Streaks de Consistência", desc: "Sequências e conquistas diárias" },
                    { icon: Wallet, title: "Controle Financeiro", desc: "Categorias, gráficos e análise por IA" },
                    { icon: Calendar, title: "Gestão de Tarefas", desc: "Kanban, listas e timers integrados" },
                    { icon: BarChart3, title: "Hábitos Rastreáveis", desc: "Progresso semanal visual" },
                    { icon: TrendingUp, title: "Dashboard Completo", desc: "Toda sua vida em um painel" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm"
                    >
                      <div className="h-8 w-8 rounded-lg bg-secondary/80 flex items-center justify-center shrink-0">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Differentiators */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="mb-6"
              >
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: CheckCircle2, title: "Design Minimalista", desc: "Foco no que importa" },
                    { icon: Shield, title: "Dados Seguros", desc: "Criptografados na nuvem" },
                    { icon: Clock, title: "Sync Instantâneo", desc: "Todos os dispositivos" },
                    { icon: Sparkles, title: "IA Integrada", desc: "Assistente financeiro" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.75 + i * 0.05 }}
                      className="p-3 rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm text-center"
                    >
                      <item.icon className="h-4 w-4 mx-auto mb-1.5 text-success" />
                      <p className="text-[11px] font-semibold">{item.title}</p>
                      <p className="text-[9px] text-muted-foreground">{item.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Pricing Cards */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.85 }}
                className="mb-4"
              >
                <h3 className="text-base font-bold text-center mb-1">Escolha seu plano</h3>
                <p className="text-[11px] text-muted-foreground text-center mb-4">Acesso total a todas as funcionalidades</p>

                {/* Annual Plan - Primary */}
                <div className="relative p-5 rounded-2xl border border-primary/30 bg-background/60 backdrop-blur-xl overflow-hidden mb-3">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/10" />
                  <motion.div
                    className="absolute -top-0.5 -right-0.5 bg-foreground text-background text-[9px] font-bold px-2.5 py-0.5 rounded-bl-lg rounded-tr-xl"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    Mais Popular
                  </motion.div>
                  <div className="relative z-10">
                    <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Anual</div>
                    <div className="flex items-baseline gap-1 mb-0.5">
                      <span className="text-2xl font-bold">R$69,90</span>
                      <span className="text-muted-foreground text-xs">/ano</span>
                    </div>
                    <p className="text-muted-foreground line-through text-[10px] mb-0.5">R$197,90/ano</p>
                    <p className="text-success text-[11px] font-medium mb-2">Economize R$128,00 — apenas R$5,83/mês</p>
                    <ul className="space-y-1.5 mb-4">
                      {["Acesso total a tudo", "45% de desconto", "Prioridade em novos recursos", "Suporte VIP"].map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                          <span className="text-[11px]">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <a href="https://pay.kirvano.com/44bf7ce3-3b3b-442b-9983-9f612db21135" target="_blank" rel="noopener noreferrer" className="block">
                      <Button className="w-full h-11 bg-foreground text-background hover:bg-foreground/90 text-sm font-semibold rounded-xl">
                        Começar Agora
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </a>
                  </div>
                </div>

                {/* Monthly Plan */}
                <div className="relative p-5 rounded-2xl border border-border/50 bg-background/60 backdrop-blur-xl overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
                  <div className="relative z-10">
                    <div className="text-[10px] font-medium text-muted-foreground mb-0.5">Mensal</div>
                    <div className="flex items-baseline gap-1 mb-0.5">
                      <span className="text-2xl font-bold">R$29,90</span>
                      <span className="text-muted-foreground text-xs">/mês</span>
                    </div>
                    <p className="text-muted-foreground line-through text-[10px] mb-2">R$39,90/mês</p>
                    <p className="text-muted-foreground text-[11px] mb-3">Pague mês a mês, cancele quando quiser</p>
                    <ul className="space-y-1.5 mb-4">
                      {["Acesso total", "Sincronização em tempo real", "Suporte prioritário", "Atualizações contínuas"].map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                          <span className="text-[11px]">{item}</span>
                        </li>
                      ))}
                    </ul>
                    <a href="https://pay.kirvano.com/cb78dfd0-c8e0-40bb-a16b-951ba74a0a02" target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="outline" className="w-full h-11 backdrop-blur-sm bg-background/50 text-sm rounded-xl">
                        Começar Agora
                      </Button>
                    </a>
                  </div>
                </div>
              </motion.div>

              {/* Back to landing */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
              >
                <Link to="/">
                  <Button variant="ghost" className="w-full h-9 rounded-xl text-[11px] text-muted-foreground">
                    Saiba mais sobre o Kairo
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
