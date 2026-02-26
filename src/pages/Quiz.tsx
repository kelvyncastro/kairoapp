import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import confetti from "canvas-confetti";
import kairoLogo from "@/assets/kairo-penguin.png";
import { Link } from "react-router-dom";

// ── Quiz Data ──────────────────────────────────────────────

interface QuizOption {
  icon: string;
  label: string;
  description: string;
  feedback: string;
}

interface QuizQuestion {
  question: string;
  category: string;
  multiSelect?: boolean;
  options: QuizOption[];
}

const questions: QuizQuestion[] = [
  {
    question: "Qual é seu maior desafio no dia a dia?",
    category: "DESAFIO",
    options: [
      {
        icon: "📋",
        label: "Organizar todas as minhas tarefas",
        description: "Tenho muitas coisas para fazer e não consigo priorizar",
        feedback:
          "Na Kairo tem a ferramenta perfeita para isso! 📋 O módulo de Gestão de Tarefas permite que você organize suas atividades em um Kanban visual com listas simples e timers integrados. Muitos usuários aumentam sua produtividade em até 40%!",
      },
      {
        icon: "🎯",
        label: "Manter consistência com meus objetivos",
        description: "Defino metas mas não consigo acompanhar o progresso",
        feedback:
          "Excelente notícia: a Kairo foi feita para isso! 🎯 Com o módulo de Metas Inteligentes e o sistema de Streaks de Consistência, usuários aumentam sua taxa de sucesso em objetivos em mais de 3x!",
      },
      {
        icon: "💰",
        label: "Controlar minhas finanças",
        description: "Não tenho visibilidade sobre meus gastos e receitas",
        feedback:
          "A Kairo tem um assistente financeiro inteligente! 💰 Com análise por IA, você recebe insights automáticos sobre seus padrões de gasto. Muitos usuários economizam 15-20% apenas vendo seus gastos de forma clara.",
      },
      {
        icon: "⏰",
        label: "Gerenciar meu tempo",
        description: "Sinto que o tempo passa rápido e não consigo fazer tudo",
        feedback:
          "O Kairo é especialista em gestão de tempo! ⏰ O Calendário integrado e os timers para cada atividade criam blocos de tempo focado. Usuários relatam ganhar em média 2-3 horas produtivas por dia.",
      },
      {
        icon: "🧠",
        label: "Manter foco e evitar distrações",
        description: "Tenho dificuldade em manter a concentração",
        feedback:
          "A Kairo ajuda você a manter o foco! 🧠 Com Streaks de Consistência, timer integrado e Dashboard sem poluição visual, usuários aumentam seu tempo de foco em até 60%.",
      },
    ],
  },
  {
    question: "Como você prefere trabalhar e se organizar?",
    category: "ESTILO",
    options: [
      {
        icon: "📊",
        label: "Dashboard centralizado",
        description: "Prefiro ter uma visão geral de tudo em um único lugar",
        feedback:
          "Você vai amar o Dashboard da Kairo! 📊 Visualize tarefas, metas, streaks, resumo financeiro — tudo em um único painel. É como ter um centro de controle da sua vida.",
      },
      {
        icon: "✅",
        label: "Listas simples e diretas",
        description: "Gosto de marcar tarefas conforme as completo",
        feedback:
          "Simplicidade é poder! ✅ O módulo de Tarefas em Listas permite criar listas diretas e sem complicação. Adicione, marque e veja seu progresso crescer.",
      },
      {
        icon: "📅",
        label: "Visualizar em calendário",
        description: "Prefiro ver minhas atividades distribuídas no tempo",
        feedback:
          "O Calendário da Kairo é seu melhor amigo! 📅 Visualize tarefas, metas e hábitos distribuídos no tempo. Identifique dias sobrecarregados e planeje com antecedência.",
      },
      {
        icon: "🎨",
        label: "Visual limpo e minimalista",
        description: "Design clean e sem poluição visual é essencial",
        feedback:
          "A Kairo foi feita com design minimalista! 🎨 Cada pixel foi pensado para não distrair. Interface clean, intuitiva e sem poluição visual. Um design que respeita seu tempo.",
      },
      {
        icon: "🔄",
        label: "Acompanhar progresso visual",
        description: "Preciso ver meu progresso em gráficos e estatísticas",
        feedback:
          "Gráficos e estatísticas são seu combustível! 🔄 A Kairo oferece visualizações detalhadas de progresso. Usuários visuais como você mantêm 3x mais consistência.",
      },
    ],
  },
  {
    question:
      "Com que frequência você precisa acompanhar suas atividades e objetivos?",
    category: "FREQUÊNCIA",
    options: [
      {
        icon: "⚡",
        label: "Várias vezes ao dia",
        description: "Preciso revisar e atualizar constantemente",
        feedback:
          "A Kairo foi feita para pessoas ativas como você! ⚡ Sincronização instantânea e interface rápida para atualizações em segundos, de qualquer lugar.",
      },
      {
        icon: "📅",
        label: "Uma vez ao dia",
        description: "Faço uma revisão diária das minhas atividades",
        feedback:
          "A rotina diária é perfeita! 📅 5-10 minutos pela manhã para prioridades, e à noite para revisão. Essa rotina cria consistência e clareza.",
      },
      {
        icon: "📆",
        label: "Algumas vezes por semana",
        description: "Acompanho meu progresso 2-3 vezes na semana",
        feedback:
          "A Kairo se adapta ao seu ritmo! 📆 O sistema de Streaks e Metas funciona mesmo com acessos menos frequentes. Perfeito para planejamento semanal.",
      },
      {
        icon: "🗓",
        label: "Semanalmente",
        description: "Faço uma revisão semanal do que foi feito",
        feedback:
          "Planejamento semanal é poderoso! 🗓 A Kairo oferece relatórios semanais para análise de padrões e ajuste de estratégia. Como ter um coach pessoal toda semana.",
      },
      {
        icon: "📋",
        label: "Mensalmente",
        description: "Prefiro acompanhar em ciclos mensais",
        feedback:
          "Planejamento mensal é perfeito para visão macro! 📋 Defina metas, acompanhe progresso, e analise ao final do mês. Ideal para quem quer ver o quadro geral.",
      },
    ],
  },
  {
    question:
      "Quais áreas você quer organizar e acompanhar? (Escolha quantas quiser)",
    category: "ÁREAS DE FOCO",
    multiSelect: true,
    options: [
      {
        icon: "🎯",
        label: "Metas e objetivos pessoais",
        description: "Quero definir e acompanhar meus objetivos de longo prazo",
        feedback:
          "Metas são o coração da Kairo! 🎯 Defina objetivos claros com marcos intermediários e acompanhe o progresso em tempo real.",
      },
      {
        icon: "📝",
        label: "Tarefas do trabalho",
        description: "Preciso gerenciar minhas tarefas profissionais",
        feedback:
          "Organize seu trabalho com precisão! 📝 Tarefas com subtarefas, prioridades, prazos e Kanban visual.",
      },
      {
        icon: "🏃",
        label: "Hábitos e rotinas",
        description: "Quero criar e manter hábitos saudáveis",
        feedback:
          "Construa hábitos que mudam sua vida! 🏃 O sistema de Streaks é viciante (no bom sentido) e mantém você motivado.",
      },
      {
        icon: "💵",
        label: "Finanças pessoais",
        description: "Preciso controlar meus gastos e receitas",
        feedback:
          "Tome controle do seu dinheiro! 💵 Controle financeiro com análise por IA que revela padrões e oportunidades de economia.",
      },
      {
        icon: "🛒",
        label: "Compras e lista de mercado",
        description: "Gosto de organizar minhas compras",
        feedback:
          "Nunca mais esqueça o que comprar! 🛒 Listas organizadas que você pode sincronizar com outras pessoas.",
      },
      {
        icon: "📝",
        label: "Anotações e ideias",
        description: "Preciso capturar e organizar minhas ideias",
        feedback:
          "Capture suas ideias antes que desapareçam! 📝 Editor de notas sincronizado em todos os seus dispositivos.",
      },
    ],
  },
  {
    question: "O que você quer alcançar com melhor organização?",
    category: "OBJETIVO",
    options: [
      {
        icon: "🚀",
        label: "Aumentar minha produtividade",
        description: "Quero fazer mais em menos tempo",
        feedback:
          "A Kairo é feita para produtivos! 🚀 Usuários relatam aumentos de 30-50% eliminando o 'ruído mental' com tudo organizado e priorizado.",
      },
      {
        icon: "😌",
        label: "Reduzir estresse e ansiedade",
        description: "Organização me ajudaria a ficar mais tranquilo",
        feedback:
          "Organização é o antídoto para a ansiedade! 😌 Quando tudo está organizado e visível, seu cérebro relaxa. Usuários relatam redução significativa de ansiedade.",
      },
      {
        icon: "💪",
        label: "Manter consistência e disciplina",
        description: "Quero construir hábitos e manter disciplina",
        feedback:
          "A consistência é a chave do sucesso! 💪 Streaks e Metas com progresso visual criam um ambiente que recompensa a disciplina. Transformação em 90 dias.",
      },
      {
        icon: "🎓",
        label: "Aprender e crescer pessoalmente",
        description: "Quero investir em meu desenvolvimento",
        feedback:
          "Crescimento pessoal começa com organização! 🎓 Rastreie seu desenvolvimento com metas de aprendizado, hábitos de leitura e Dashboard de progresso.",
      },
      {
        icon: "💰",
        label: "Melhorar situação financeira",
        description: "Quero ter melhor controle e aumentar minha renda",
        feedback:
          "Dinheiro segue quem o acompanha! 💰 Controle financeiro com IA que ajuda a economizar 15-20% e aumentar a renda de forma estratégica.",
      },
      {
        icon: "⚖️",
        label: "Equilibrar vida pessoal e profissional",
        description: "Quero separar e balancear essas áreas",
        feedback:
          "Equilíbrio é a chave da felicidade! ⚖️ Organize todas as áreas da sua vida em um único lugar com Dashboard que mostra o equilíbrio entre elas.",
      },
    ],
  },
  {
    question:
      "Você já usou apps de produtividade ou organização antes?",
    category: "EXPERIÊNCIA",
    options: [
      {
        icon: "✨",
        label: "Não, essa é minha primeira vez",
        description: "Estou começando agora com ferramentas de organização",
        feedback:
          "Bem-vindo! Você está no lugar certo! ✨ A Kairo foi feita para ser intuitiva. Comece com um módulo e vá explorando. A Kairo cresce com você.",
      },
      {
        icon: "🔄",
        label: "Sim, mas não mantive consistência",
        description: "Tentei mas abandonei por falta de hábito",
        feedback:
          "Você não está sozinho! 🔄 O sistema de Streaks cria uma dinâmica viciante que mantém você motivado. Comece devagar — dessa vez vai ser diferente.",
      },
      {
        icon: "✅",
        label: "Sim, tenho experiência",
        description: "Já uso apps e conheço bem como funcionam",
        feedback:
          "Você vai amar a Kairo! ✅ Um ecossistema completo onde tudo se conecta. Eficiência que você nunca viu antes.",
      },
      {
        icon: "🎯",
        label: "Sim, mas quero algo mais completo",
        description: "Usava algo simples e quero algo mais robusto",
        feedback:
          "A Kairo é exatamente o que você procura! 🎯 Tarefas, hábitos, metas, finanças, calendário e notas — tudo integrado. Use o que precisa, quando precisa.",
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
  organizador: {
    title: "O Organizador de Tarefas",
    emoji: "📋",
    description:
      "Você é focado em tarefas, prefere listas e usa ferramentas frequentemente.",
    modules: ["Tarefas", "Calendário"],
    tip: "Use o Kanban do Kairo para visualizar suas tarefas em diferentes estágios.",
  },
  perseguidor: {
    title: "O Perseguidor de Metas",
    emoji: "🎯",
    description:
      "Foco em objetivos, quer acompanhar progresso e se motiva por consistência.",
    modules: ["Metas", "Streaks de Consistência"],
    tip: "Configure suas metas com marcos intermediários para manter a motivação.",
  },
  financeiro: {
    title: "O Controlador Financeiro",
    emoji: "💰",
    description:
      "Foco em finanças, quer análise, gráficos e usa IA para insights.",
    modules: ["Finanças", "Dashboard"],
    tip: "Use o assistente financeiro com IA para obter insights sobre seus gastos.",
  },
  construtor: {
    title: "O Construtor de Hábitos",
    emoji: "🏃",
    description:
      "Foco em consistência, quer ver streaks e se motiva por progresso visual.",
    modules: ["Hábitos", "Streaks"],
    tip: "Comece com 2-3 hábitos simples e vá aumentando conforme ganha consistência.",
  },
  equilibrador: {
    title: "O Equilibrador de Vida",
    emoji: "⚖️",
    description:
      "Quer organizar todas as áreas, busca equilíbrio entre pessoal e profissional.",
    modules: ["Dashboard", "Todas as ferramentas"],
    tip: "Use o Dashboard para ter uma visão macro de todas as áreas da sua vida.",
  },
  iniciante: {
    title: "O Iniciante Curioso",
    emoji: "✨",
    description:
      "Primeira experiência com organização, aberto a explorar e aprender.",
    modules: ["Tarefas", "Hábitos"],
    tip: "Faça um tour pelos módulos e comece com o que mais faz sentido para você.",
  },
};

function determineProfile(answers: Record<number, number | number[]>): Profile {
  // Simple heuristic based on Q1 and Q5
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
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | number[]>>({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [multiSelected, setMultiSelected] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  const q = questions[currentQ];
  const totalQ = questions.length;
  const progress = finished ? 100 : ((currentQ) / totalQ) * 100;

  // Fire confetti on finish
  useEffect(() => {
    if (!finished) return;
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ["#f97316", "#eab308", "#22c55e", "#a855f7", "#3b82f6"];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { x: 0.5, y: 0.4 },
        colors,
        startVelocity: 35,
        gravity: 0.8,
      });
    }, 400);
  }, [finished]);

  const handleSelect = (idx: number) => {
    if (showFeedback) return;

    if (q.multiSelect) {
      setMultiSelected((prev) =>
        prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
      );
    } else {
      setSelectedOption(idx);
      setAnswers((prev) => ({ ...prev, [currentQ]: idx }));
      setShowFeedback(true);
    }
  };

  const handleMultiContinue = () => {
    if (multiSelected.length === 0) return;
    setAnswers((prev) => ({ ...prev, [currentQ]: multiSelected }));
    // Show feedback for first selected
    setSelectedOption(multiSelected[0]);
    setShowFeedback(true);
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedOption(null);
    setMultiSelected([]);

    if (currentQ < totalQ - 1) {
      setCurrentQ((prev) => prev + 1);
    } else {
      setFinished(true);
    }
  };

  const handleBack = () => {
    if (currentQ > 0 && !showFeedback) {
      setCurrentQ((prev) => prev - 1);
      setSelectedOption(null);
      setMultiSelected([]);
    }
  };

  const profile = finished ? determineProfile(answers) : null;

  const feedbackText =
    selectedOption !== null ? q.options[selectedOption].feedback : "";

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-3">
          {currentQ > 0 && !showFeedback && !finished ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          ) : (
            <div className="w-16" />
          )}

          <div className="flex-1 flex justify-center">
            <img src={kairoLogo} alt="Kairo" className="h-8 w-8 rounded-lg" />
          </div>

          <div className="w-16" />
        </div>

        {/* Progress */}
        <div className="max-w-2xl mx-auto px-3 sm:px-4 pb-2 sm:pb-3">
          <div className="flex items-center gap-1.5 sm:gap-3">
            {Array.from({ length: totalQ }).map((_, i) => (
              <div key={i} className="flex-1 flex items-center gap-1">
                <div
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    i < currentQ || finished
                      ? "bg-primary"
                      : i === currentQ
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!finished ? (
            <motion.div
              key={`q-${currentQ}-${showFeedback ? "fb" : "q"}`}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-xl"
            >
              {!showFeedback ? (
                <>
                  {/* Category label */}
                  <p className="text-xs font-semibold tracking-widest text-primary text-center mb-2 sm:mb-4 uppercase">
                    {q.category}
                  </p>

                  {/* Question */}
                  <h2 className="text-lg sm:text-2xl font-bold text-center mb-5 sm:mb-10 leading-snug">
                    {q.question}
                  </h2>

                  {/* Options */}
                  <div className="flex flex-col gap-2 sm:gap-3">
                    {q.options.map((opt, idx) => {
                      const isMultiSelected = multiSelected.includes(idx);
                      return (
                        <motion.button
                          key={idx}
                          onClick={() => handleSelect(idx)}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex items-center gap-3 w-full text-left p-3 sm:p-4 rounded-xl border transition-all duration-200 ${
                            isMultiSelected
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card hover:border-muted-foreground/40 hover:bg-accent/50"
                          }`}
                        >
                          <span className="text-xl sm:text-2xl flex-shrink-0">
                            {opt.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base">
                              {opt.label}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {opt.description}
                            </p>
                          </div>
                          {isMultiSelected && (
                            <Check className="h-5 w-5 text-primary flex-shrink-0" />
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Multi-select continue */}
                  {q.multiSelect && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 flex justify-center"
                    >
                      <Button
                        onClick={handleMultiContinue}
                        disabled={multiSelected.length === 0}
                        className="gap-2"
                      >
                        Continuar
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
                </>
              ) : (
                /* Feedback */
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-4 sm:mb-6"
                  >
                    <Sparkles className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
                  </motion.div>

                  <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto mb-6 sm:mb-8">
                    {feedbackText}
                  </p>

                  <Button onClick={handleNext} className="gap-2">
                    {currentQ < totalQ - 1 ? "Próxima Pergunta" : "Ver Resultado"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            /* Result */
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-xl text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 10, delay: 0.2 }}
                className="text-5xl sm:text-6xl mb-3"
              >
                {profile?.emoji}
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl sm:text-3xl font-bold mb-2"
              >
                Você é: {profile?.title}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6"
              >
                {profile?.description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 text-left"
              >
                <h3 className="font-semibold mb-3">
                  📌 Módulos recomendados para você:
                </h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {profile?.modules.map((m) => (
                    <span
                      key={m}
                      className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full border border-primary/20"
                    >
                      {m}
                    </span>
                  ))}
                </div>

                <h3 className="font-semibold mb-2">💡 Dica para começar:</h3>
                <p className="text-sm text-muted-foreground">{profile?.tip}</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 text-left"
              >
                <h3 className="font-semibold mb-3">🚀 Próximos passos:</h3>
                <ol className="text-sm text-muted-foreground space-y-2">
                  <li className="flex gap-2">
                    <span className="text-foreground font-medium">1.</span>
                    Comece com o módulo que mais faz sentido para você
                  </li>
                  <li className="flex gap-2">
                    <span className="text-foreground font-medium">2.</span>
                    Dedique 5 minutos para explorar e entender
                  </li>
                  <li className="flex gap-2">
                    <span className="text-foreground font-medium">3.</span>
                    Crie seu primeiro item (tarefa, hábito, meta...)
                  </li>
                  <li className="flex gap-2">
                    <span className="text-foreground font-medium">4.</span>
                    Mantenha a consistência por 7 dias
                  </li>
                </ol>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col gap-3"
              >
                <Link to="/#pricing">
                  <Button
                    size="lg"
                    className="w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
                  >
                    <Sparkles className="h-5 w-5" />
                    Comece sua jornada agora
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="ghost" size="lg" className="w-full">
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
