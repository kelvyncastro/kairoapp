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
        feedback:
          "Na Kairo tem a ferramenta perfeita para isso! 📋 O módulo de Gestão de Tarefas permite que você organize suas atividades em um Kanban visual, onde você vê claramente o que precisa fazer, o que está em progresso e o que já foi concluído. Você também pode usar listas simples se preferir algo mais direto, ou até mesmo timers para manter o foco em cada tarefa. Muitos usuários conseguem aumentar sua produtividade em até 40% apenas reorganizando suas tarefas de forma visual.",
      },
      {
        icon: "🎯",
        label: "Manter consistência com meus objetivos",
        description: "Defino metas mas não consigo acompanhar o progresso",
        feedback:
          "Excelente notícia: a Kairo foi feita para isso! 🎯 Com o módulo de Metas Inteligentes, você define seus objetivos e acompanha o progresso com visualização clara. Mas o diferencial é o sistema de Streaks de Consistência, aquele sistema de não quebrar a corrente que mantém você motivado dia após dia. Usuários que usam esse recurso aumentam sua taxa de sucesso em objetivos em mais de 3x.",
      },
      {
        icon: "💰",
        label: "Controlar minhas finanças",
        description: "Não tenho visibilidade sobre meus gastos e receitas",
        feedback:
          "A Kairo tem um assistente financeiro inteligente! 💰 O módulo de Controle Financeiro não é só um lugar para anotar gastos. Com análise por IA, você recebe insights automáticos sobre seus padrões de gasto, categorias onde você mais gasta e recomendações para economizar. Muitos usuários economizam 15-20% apenas vendo seus gastos de forma clara.",
      },
      {
        icon: "⏰",
        label: "Gerenciar meu tempo",
        description: "Sinto que o tempo passa rápido e não consigo fazer tudo",
        feedback:
          "O Kairo é especialista em gestão de tempo! ⏰ Além das tarefas, o calendário integrado permite que você visualize seu tempo de forma macro. O sistema também permite timers para cada atividade, criando blocos de tempo focado. Usuários que usam essa abordagem relatam ganhar em média 2-3 horas produtivas por dia.",
      },
      {
        icon: "🧠",
        label: "Manter foco e evitar distrações",
        description: "Tenho dificuldade em manter a concentração",
        feedback:
          "A Kairo ajuda você a manter o foco! 🧠 Com o sistema de Streaks de Consistência e metas com progresso visual, você cria um ambiente que recompensa o foco. O timer integrado para tarefas ajuda você a trabalhar em blocos de tempo sem distrações. Usuários que usam essas ferramentas aumentam seu tempo de foco em até 60%.",
      },
    ],
  },
  {
    question: "Pergunta 2: Seu Estilo de Trabalho",
    subtitle: "Como você prefere trabalhar e se organizar?",
    options: [
      {
        icon: "📊",
        label: "Vejo tudo em um dashboard centralizado",
        description: "Prefiro ter uma visão geral de tudo em um único lugar",
        feedback:
          "Você vai amar o Dashboard da Kairo! 📊 O Dashboard Completo foi feito para pessoas como você. Você consegue visualizar em um único painel: tarefas do dia, progresso das metas, streaks de hábitos e resumo financeiro. É como ter um centro de controle da sua vida em um só lugar.",
      },
      {
        icon: "✅",
        label: "Prefiro listas simples e diretas",
        description: "Gosto de marcar tarefas conforme as completo",
        feedback:
          "Simplicidade é poder, e a Kairo entende isso! ✅ O módulo de Tarefas em Listas permite criar listas simples e diretas, marcar conforme completa e ver seu progresso crescer. Sem distrações e sem complexidade desnecessária.",
      },
      {
        icon: "📅",
        label: "Gosto de visualizar em calendário",
        description: "Prefiro ver minhas atividades distribuídas no tempo",
        feedback:
          "O calendário da Kairo é seu melhor amigo! 📅 Você consegue visualizar tarefas, metas e hábitos distribuídos no tempo. Isso ajuda a ver o quadro geral da semana e do mês, identificar dias sobrecarregados e planejar com antecedência.",
      },
      {
        icon: "🎨",
        label: "Preciso de um visual limpo e minimalista",
        description: "Design clean e sem poluição visual é essencial",
        feedback:
          "A Kairo foi feita com design minimalista em mente! 🎨 Cada pixel foi pensado para não distrair. A interface é clean, intuitiva e sem poluição visual. Você vê apenas o que importa, quando importa.",
      },
      {
        icon: "🔄",
        label: "Gosto de acompanhar progresso visual",
        description: "Preciso ver meu progresso em gráficos e estatísticas",
        feedback:
          "Gráficos e estatísticas são seu combustível! 🔄 A Kairo oferece visualizações detalhadas de seu progresso em hábitos, metas e finanças. Usuários visuais como você tendem a manter 3x mais consistência.",
      },
    ],
  },
  {
    question: "Pergunta 3: Frequência de Uso",
    subtitle: "Com que frequência você precisa acompanhar suas atividades e objetivos?",
    options: [
      {
        icon: "⚡",
        label: "Diariamente, várias vezes ao dia",
        description: "Preciso revisar e atualizar constantemente",
        feedback:
          "A Kairo foi feita para pessoas ativas como você! ⚡ Com sincronização instantânea entre dispositivos, você consegue atualizar tarefas, marcar hábitos e acompanhar metas em tempo real. Tudo é otimizado para velocidade e eficiência.",
      },
      {
        icon: "📅",
        label: "Diariamente, uma vez ao dia",
        description: "Faço uma revisão diária das minhas atividades",
        feedback:
          "A rotina diária é o melhor momento para usar a Kairo! 📅 Muitos usuários fazem uma revisão matinal de 5-10 minutos e uma revisão rápida à noite para marcar o que foi concluído. Essa rotina simples cria consistência e clareza.",
      },
      {
        icon: "📆",
        label: "Algumas vezes por semana",
        description: "Acompanho meu progresso 2-3 vezes na semana",
        feedback:
          "A Kairo se adapta ao seu ritmo! 📆 Você não precisa acessar todos os dias. Com revisões semanais, você consegue ter visão clara do que foi feito e do que vem pela frente, mantendo progresso acumulado.",
      },
      {
        icon: "🗓",
        label: "Semanalmente",
        description: "Faço uma revisão semanal do que foi feito",
        feedback:
          "Planejamento semanal é uma estratégia poderosa! 🗓 A Kairo oferece relatórios semanais que facilitam análise de padrões, identificação de bloqueios e ajustes de estratégia para a próxima semana.",
      },
      {
        icon: "📋",
        label: "Mensalmente",
        description: "Prefiro acompanhar em ciclos mensais",
        feedback:
          "Planejamento mensal é perfeito para visão macro! 📋 Defina metas para o mês, acompanhe o progresso e faça uma análise completa no final. O histórico permite enxergar sua evolução mês a mês.",
      },
    ],
  },
  {
    question: "Pergunta 4: Áreas de Foco",
    subtitle: "Quais áreas você quer organizar e acompanhar? (Você pode escolher mais de uma)",
    multiSelect: true,
    options: [
      {
        icon: "🎯",
        label: "Metas e objetivos pessoais",
        description: "Quero definir e acompanhar meus objetivos de longo prazo",
        feedback:
          "Metas são o coração da Kairo! 🎯 O módulo de Metas Inteligentes permite definir objetivos com marcos intermediários e acompanhar o progresso em tempo real.",
      },
      {
        icon: "📝",
        label: "Tarefas do trabalho",
        description: "Preciso gerenciar minhas tarefas profissionais",
        feedback:
          "Organize seu trabalho com precisão! 📝 O módulo de Gestão de Tarefas é perfeito para profissionais: subtarefas, prioridades, prazos e acompanhamento visual do status de cada projeto.",
      },
      {
        icon: "🏃",
        label: "Hábitos e rotinas",
        description: "Quero criar e manter hábitos saudáveis",
        feedback:
          "Construa hábitos que mudam sua vida! 🏃 O módulo de Hábitos Rastreáveis com streaks de consistência mantém você motivado e disciplinado no dia a dia.",
      },
      {
        icon: "💵",
        label: "Finanças pessoais",
        description: "Preciso controlar meus gastos e receitas",
        feedback:
          "Tome controle do seu dinheiro! 💵 O módulo financeiro com IA gera insights sobre padrões de gasto e mostra gráficos claros para ajudar você a economizar mais.",
      },
      {
        icon: "🛒",
        label: "Compras e lista de mercado",
        description: "Gosto de organizar minhas compras",
        feedback:
          "Nunca mais esqueça o que comprar! 🛒 O módulo de lista de mercado é simples e poderoso, com checklist prático e sincronização para facilitar sua rotina.",
      },
      {
        icon: "📝",
        label: "Anotações e ideias",
        description: "Preciso capturar e organizar minhas ideias",
        feedback:
          "Capture suas ideias antes que desapareçam! 📝 O módulo de Notas ajuda a organizar pensamentos, insights e referências em um espaço simples e sempre acessível.",
      },
    ],
  },
  {
    question: "Pergunta 5: Objetivo Principal",
    subtitle: "O que você quer alcançar com melhor organização?",
    options: [
      {
        icon: "🚀",
        label: "Aumentar minha produtividade",
        description: "Quero fazer mais em menos tempo",
        feedback:
          "A Kairo é feita para produtivos! 🚀 Usuários relatam aumentos de produtividade de 30-50% porque tudo fica organizado, priorizado e visível, reduzindo ruído mental.",
      },
      {
        icon: "😌",
        label: "Reduzir estresse e ansiedade",
        description: "Sinto que organização me ajudaria a ficar mais tranquilo",
        feedback:
          "A organização é o antídoto para a ansiedade! 😌 Quando tudo está visível e organizado, seu cérebro relaxa. Muitos usuários relatam redução de estresse por ter tudo em um único lugar confiável.",
      },
      {
        icon: "💪",
        label: "Manter consistência e disciplina",
        description: "Quero construir hábitos e manter disciplina",
        feedback:
          "A consistência é a chave do sucesso! 💪 O sistema de streaks é psicologicamente poderoso e, com metas visuais, cria um ambiente que recompensa a disciplina diária.",
      },
      {
        icon: "🎓",
        label: "Aprender e crescer pessoalmente",
        description: "Quero investir em meu desenvolvimento",
        feedback:
          "Crescimento pessoal começa com organização! 🎓 Crie metas de aprendizado, organize estudos em tarefas e acompanhe hábitos de leitura para evoluir com constância.",
      },
      {
        icon: "💰",
        label: "Melhorar minha situação financeira",
        description: "Quero ter melhor controle e aumentar minha renda",
        feedback:
          "Dinheiro segue quem o acompanha! 💰 Com controle financeiro e análise por IA, você identifica oportunidades de economia e toma decisões mais estratégicas.",
      },
      {
        icon: "⚖️",
        label: "Equilibrar vida pessoal e profissional",
        description: "Quero separar e balancear essas áreas",
        feedback:
          "Equilíbrio é a chave da felicidade! ⚖️ A Kairo permite organizar trabalho, objetivos pessoais, hábitos e finanças em um único lugar, com visão clara para ajustar prioridades.",
      },
    ],
  },
  {
    question: "Pergunta 6: Experiência Anterior",
    subtitle: "Você já usou apps de produtividade ou organização antes?",
    options: [
      {
        icon: "✨",
        label: "Não, essa é minha primeira vez",
        description: "Estou começando agora com ferramentas de organização",
        feedback:
          "Bem-vindo! Você está no lugar certo! ✨ A Kairo foi feita para ser intuitiva. Comece com um módulo, aprenda como funciona e depois explore os outros no seu ritmo.",
      },
      {
        icon: "🔄",
        label: "Sim, mas não consegui manter consistência",
        description: "Tentei mas abandonei por falta de hábito",
        feedback:
          "Você não está sozinho, e a Kairo foi feita para resolver isso! 🔄 O sistema de streaks e a interface simples ajudam a manter motivação sem sobrecarga.",
      },
      {
        icon: "✅",
        label: "Sim, e tenho experiência com eles",
        description: "Já uso apps e conheço bem como funcionam",
        feedback:
          "Você vai amar a Kairo! ✅ Como alguém experiente, você vai aproveitar a integração de tarefas, hábitos, metas, finanças e calendário em um único ecossistema.",
      },
      {
        icon: "🎯",
        label: "Sim, mas quero algo mais completo",
        description: "Usava algo simples e quero algo mais robusto",
        feedback:
          "A Kairo é exatamente o que você procura! 🎯 Se faltava profundidade no que você usava antes, aqui você tem uma suíte completa que cresce com suas necessidades.",
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
  const feedbackText = selectedOption !== null ? q.options[selectedOption].feedback : "";

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
                /* Feedback */
                <div className="flex flex-col items-center text-center pt-6">
                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 10, stiffness: 180 }}
                    className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 shadow-lg shadow-primary/10"
                  >
                    <Sparkles className="h-5 w-5 text-primary" />
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12 }}
                    className="text-muted-foreground text-[13px] leading-relaxed max-w-[280px] mb-6"
                  >
                    {feedbackText}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="w-full"
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
                      <span className="text-2xl font-bold">R$197,90</span>
                      <span className="text-muted-foreground text-xs">/ano</span>
                    </div>
                    <p className="text-muted-foreground line-through text-[10px] mb-0.5">R$397,90/ano</p>
                    <p className="text-success text-[11px] font-medium mb-2">Economize R$160,90 — apenas R$16,49/mês</p>
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
