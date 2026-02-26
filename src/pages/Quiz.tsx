import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Check, ChevronLeft, Star } from "lucide-react";
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

interface QuizOption {
  icon: string;
  label: string;
  feedback: string;
}

interface QuizQuestion {
  question: string;
  subtitle?: string;
  multiSelect?: boolean;
  options: QuizOption[];
}

const questions: QuizQuestion[] = [
  {
    question: "Qual é seu maior desafio no dia a dia?",
    subtitle: "Escolha o que mais te representa",
    options: [
      { icon: "📋", label: "Organizar todas as minhas tarefas", feedback: "O módulo de Gestão de Tarefas da Kairo permite que você organize suas atividades em um Kanban visual com timers integrados." },
      { icon: "🎯", label: "Manter consistência com meus objetivos", feedback: "Com Metas Inteligentes e Streaks de Consistência, usuários aumentam sua taxa de sucesso em mais de 3x!" },
      { icon: "💰", label: "Controlar minhas finanças", feedback: "A Kairo tem um assistente financeiro com IA que revela insights automáticos sobre seus padrões de gasto." },
      { icon: "⏰", label: "Gerenciar meu tempo", feedback: "O Calendário integrado e os timers criam blocos de tempo focado. Ganhe 2-3 horas produtivas por dia." },
      { icon: "🧠", label: "Manter foco e evitar distrações", feedback: "Streaks de Consistência, timer integrado e Dashboard sem poluição visual. Aumente seu foco em até 60%." },
    ],
  },
  {
    question: "Como você prefere se organizar?",
    subtitle: "Seu estilo de trabalho ideal",
    options: [
      { icon: "📊", label: "Dashboard centralizado", feedback: "Tarefas, metas, streaks, resumo financeiro — tudo em um painel." },
      { icon: "✅", label: "Listas simples e diretas", feedback: "Simplicidade é poder! Adicione, marque e veja seu progresso crescer." },
      { icon: "📅", label: "Visualizar em calendário", feedback: "Visualize tudo distribuído no tempo e identifique dias sobrecarregados." },
      { icon: "🎨", label: "Visual limpo e minimalista", feedback: "Cada pixel pensado para não distrair. Design que respeita seu tempo." },
      { icon: "📈", label: "Acompanhar progresso visual", feedback: "Gráficos e visualizações detalhadas de progresso em tempo real." },
    ],
  },
  {
    question: "Com que frequência você acompanha suas atividades?",
    subtitle: "Não existe resposta certa — apenas a sua",
    options: [
      { icon: "⚡", label: "Várias vezes ao dia", feedback: "Interface rápida para atualizações em segundos, de qualquer lugar." },
      { icon: "☀️", label: "Uma vez ao dia", feedback: "5-10 min pela manhã para prioridades, e à noite para revisão." },
      { icon: "📆", label: "Algumas vezes por semana", feedback: "Streaks e Metas funcionam mesmo com acessos menos frequentes." },
      { icon: "🗓", label: "Semanalmente", feedback: "Relatórios semanais para análise de padrões e ajuste de estratégia." },
      { icon: "📋", label: "Mensalmente", feedback: "Visão macro com metas, progresso e análise ao final do mês." },
    ],
  },
  {
    question: "Quais áreas você quer organizar?",
    subtitle: "Selecione quantas quiser",
    multiSelect: true,
    options: [
      { icon: "🎯", label: "Metas e objetivos", feedback: "Metas são o coração da Kairo!" },
      { icon: "📝", label: "Tarefas do trabalho", feedback: "Organize seu trabalho com precisão!" },
      { icon: "🏃", label: "Hábitos e rotinas", feedback: "Construa hábitos que mudam sua vida!" },
      { icon: "💵", label: "Finanças pessoais", feedback: "Tome controle do seu dinheiro!" },
      { icon: "🛒", label: "Compras e mercado", feedback: "Nunca mais esqueça o que comprar!" },
      { icon: "📓", label: "Anotações e ideias", feedback: "Capture suas ideias antes que desapareçam!" },
    ],
  },
  {
    question: "O que você quer alcançar?",
    subtitle: "Seu objetivo principal",
    options: [
      { icon: "🚀", label: "Aumentar produtividade", feedback: "Elimine o 'ruído mental' e ganhe 30-50% de eficiência!" },
      { icon: "😌", label: "Reduzir estresse", feedback: "Quando tudo está organizado, seu cérebro relaxa." },
      { icon: "💪", label: "Manter consistência", feedback: "Streaks e metas com progresso visual criam disciplina!" },
      { icon: "🎓", label: "Crescer pessoalmente", feedback: "Crescimento pessoal começa com organização!" },
      { icon: "💰", label: "Melhorar finanças", feedback: "Dinheiro segue quem o acompanha!" },
      { icon: "⚖️", label: "Equilibrar vida", feedback: "Organize todas as áreas da sua vida em um único lugar." },
    ],
  },
  {
    question: "Já usou apps de produtividade antes?",
    subtitle: "Sua experiência até agora",
    options: [
      { icon: "✨", label: "Não, é minha primeira vez", feedback: "Bem-vindo! A Kairo foi feita para ser intuitiva." },
      { icon: "🔄", label: "Sim, mas não mantive consistência", feedback: "O sistema de Streaks mantém você motivado dessa vez!" },
      { icon: "✅", label: "Sim, tenho experiência", feedback: "Você vai amar o ecossistema completo da Kairo!" },
      { icon: "🎯", label: "Sim, mas quero algo mais completo", feedback: "Tudo integrado: tarefas, hábitos, metas, finanças e mais!" },
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
              Descubra seu perfil de produtividade
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-[13px] text-muted-foreground leading-relaxed mb-6 max-w-[280px]"
            >
              Responda 6 perguntas rápidas e receba recomendações personalizadas.
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
                          <span className="font-medium text-[13px] leading-snug flex-1">{opt.label}</span>
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
            /* ── Result Screen ── */
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-lg"
            >
              {/* Profile card */}
              <div className="relative rounded-2xl border border-border/30 overflow-hidden mb-3">
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

              {/* Modules */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card/50 backdrop-blur-sm border border-border/25 rounded-xl p-3.5 mb-2.5"
              >
                <p className="text-[11px] font-semibold mb-2 flex items-center gap-1.5">
                  <span>📌</span> Módulos recomendados
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {profile?.modules.map((m) => (
                    <span key={m} className="px-2.5 py-1 bg-primary/8 text-primary text-[11px] font-semibold rounded-lg border border-primary/15">
                      {m}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Tip */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="bg-card/50 backdrop-blur-sm border border-border/25 rounded-xl p-3.5 mb-2.5"
              >
                <p className="text-[11px] font-semibold mb-1 flex items-center gap-1.5">
                  <span>💡</span> Dica para começar
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{profile?.tip}</p>
              </motion.div>

              {/* Steps */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-card/50 backdrop-blur-sm border border-border/25 rounded-xl p-3.5 mb-5"
              >
                <p className="text-[11px] font-semibold mb-2.5 flex items-center gap-1.5">
                  <span>🚀</span> Próximos passos
                </p>
                <div className="space-y-1.5">
                  {["Comece com o módulo recomendado", "Dedique 5 min para explorar", "Crie seu primeiro item", "Mantenha consistência por 7 dias"].map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4.5 h-4.5 rounded-full bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-[8px] font-bold text-primary">{i + 1}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{step}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col gap-2"
              >
                <Link to="/#pricing">
                  <Button className="w-full h-12 rounded-xl gap-2 text-sm font-bold tracking-wide uppercase shadow-xl shadow-primary/20">
                    <Sparkles className="h-4 w-4" />
                    Comece sua jornada agora
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
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
