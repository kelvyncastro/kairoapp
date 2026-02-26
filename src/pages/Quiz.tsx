import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Check, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      { icon: "📋", label: "Organizar todas as minhas tarefas", description: "Tenho muitas coisas para fazer e não consigo priorizar", feedback: "Na Kairo tem a ferramenta perfeita para isso! 📋 O módulo de Gestão de Tarefas permite que você organize suas atividades em um Kanban visual com listas simples e timers integrados." },
      { icon: "🎯", label: "Manter consistência com meus objetivos", description: "Defino metas mas não consigo acompanhar o progresso", feedback: "Excelente notícia: a Kairo foi feita para isso! 🎯 Com o módulo de Metas Inteligentes e o sistema de Streaks de Consistência, usuários aumentam sua taxa de sucesso em mais de 3x!" },
      { icon: "💰", label: "Controlar minhas finanças", description: "Não tenho visibilidade sobre meus gastos e receitas", feedback: "A Kairo tem um assistente financeiro inteligente! 💰 Com análise por IA, você recebe insights automáticos sobre seus padrões de gasto." },
      { icon: "⏰", label: "Gerenciar meu tempo", description: "Sinto que o tempo passa rápido e não consigo fazer tudo", feedback: "O Kairo é especialista em gestão de tempo! ⏰ O Calendário integrado e os timers criam blocos de tempo focado." },
      { icon: "🧠", label: "Manter foco e evitar distrações", description: "Tenho dificuldade em manter a concentração", feedback: "A Kairo ajuda você a manter o foco! 🧠 Com Streaks de Consistência, timer integrado e Dashboard sem poluição visual." },
    ],
  },
  {
    question: "Como você prefere se organizar?",
    category: "ESTILO",
    options: [
      { icon: "📊", label: "Dashboard centralizado", description: "Visão geral de tudo em um único lugar", feedback: "Você vai amar o Dashboard da Kairo! 📊 Tarefas, metas, streaks, resumo financeiro — tudo em um painel." },
      { icon: "✅", label: "Listas simples e diretas", description: "Marcar tarefas conforme as completo", feedback: "Simplicidade é poder! ✅ Listas diretas, sem complicação. Adicione, marque e veja seu progresso crescer." },
      { icon: "📅", label: "Visualizar em calendário", description: "Atividades distribuídas no tempo", feedback: "O Calendário da Kairo é seu melhor amigo! 📅 Visualize tudo distribuído no tempo." },
      { icon: "🎨", label: "Visual limpo e minimalista", description: "Design clean é essencial", feedback: "A Kairo foi feita com design minimalista! 🎨 Cada pixel pensado para não distrair." },
      { icon: "🔄", label: "Acompanhar progresso visual", description: "Gráficos e estatísticas", feedback: "Gráficos são seu combustível! 🔄 Visualizações detalhadas de progresso em tempo real." },
    ],
  },
  {
    question: "Com que frequência você acompanha suas atividades?",
    category: "FREQUÊNCIA",
    options: [
      { icon: "⚡", label: "Várias vezes ao dia", description: "Revisar e atualizar constantemente", feedback: "A Kairo foi feita para pessoas ativas como você! ⚡ Interface rápida para atualizações em segundos." },
      { icon: "📅", label: "Uma vez ao dia", description: "Revisão diária das atividades", feedback: "A rotina diária é perfeita! 📅 5-10 minutos pela manhã para prioridades, e à noite para revisão." },
      { icon: "📆", label: "Algumas vezes por semana", description: "Acompanho 2-3 vezes na semana", feedback: "A Kairo se adapta ao seu ritmo! 📆 Streaks e Metas funcionam mesmo com acessos menos frequentes." },
      { icon: "🗓", label: "Semanalmente", description: "Revisão semanal do que foi feito", feedback: "Planejamento semanal é poderoso! 🗓 Relatórios semanais para análise de padrões." },
      { icon: "📋", label: "Mensalmente", description: "Acompanho em ciclos mensais", feedback: "Planejamento mensal é perfeito para visão macro! 📋 Metas, progresso e análise mensal." },
    ],
  },
  {
    question: "Quais áreas você quer organizar?",
    category: "ÁREAS DE FOCO",
    multiSelect: true,
    options: [
      { icon: "🎯", label: "Metas e objetivos", description: "Objetivos de longo prazo", feedback: "Metas são o coração da Kairo! 🎯" },
      { icon: "📝", label: "Tarefas do trabalho", description: "Tarefas profissionais", feedback: "Organize seu trabalho com precisão! 📝" },
      { icon: "🏃", label: "Hábitos e rotinas", description: "Hábitos saudáveis", feedback: "Construa hábitos que mudam sua vida! 🏃" },
      { icon: "💵", label: "Finanças pessoais", description: "Gastos e receitas", feedback: "Tome controle do seu dinheiro! 💵" },
      { icon: "🛒", label: "Compras e mercado", description: "Listas de compras", feedback: "Nunca mais esqueça o que comprar! 🛒" },
      { icon: "📝", label: "Anotações e ideias", description: "Capturar ideias", feedback: "Capture suas ideias antes que desapareçam! 📝" },
    ],
  },
  {
    question: "O que você quer alcançar?",
    category: "OBJETIVO",
    options: [
      { icon: "🚀", label: "Aumentar produtividade", description: "Fazer mais em menos tempo", feedback: "Usuários relatam aumentos de 30-50% eliminando o 'ruído mental'! 🚀" },
      { icon: "😌", label: "Reduzir estresse", description: "Ficar mais tranquilo", feedback: "Quando tudo está organizado, seu cérebro relaxa! 😌" },
      { icon: "💪", label: "Manter consistência", description: "Construir disciplina", feedback: "Streaks e Metas com progresso visual criam disciplina! 💪" },
      { icon: "🎓", label: "Crescer pessoalmente", description: "Investir em desenvolvimento", feedback: "Crescimento pessoal começa com organização! 🎓" },
      { icon: "💰", label: "Melhorar finanças", description: "Controle e aumentar renda", feedback: "Dinheiro segue quem o acompanha! 💰" },
      { icon: "⚖️", label: "Equilibrar vida", description: "Pessoal e profissional", feedback: "Equilíbrio é a chave da felicidade! ⚖️" },
    ],
  },
  {
    question: "Já usou apps de produtividade antes?",
    category: "EXPERIÊNCIA",
    options: [
      { icon: "✨", label: "Não, é minha primeira vez", description: "Começando agora", feedback: "Bem-vindo! A Kairo foi feita para ser intuitiva. ✨" },
      { icon: "🔄", label: "Sim, mas não mantive consistência", description: "Tentei mas abandonei", feedback: "O sistema de Streaks cria uma dinâmica que mantém você motivado! 🔄" },
      { icon: "✅", label: "Sim, tenho experiência", description: "Já uso e conheço bem", feedback: "Você vai amar a Kairo! Um ecossistema completo. ✅" },
      { icon: "🎯", label: "Sim, mas quero algo mais completo", description: "Quero algo mais robusto", feedback: "Tudo integrado: tarefas, hábitos, metas, finanças, calendário e notas! 🎯" },
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
  gradient: string;
}

const profiles: Record<string, Profile> = {
  organizador: { title: "O Organizador de Tarefas", emoji: "📋", description: "Você é focado em tarefas, prefere listas e usa ferramentas frequentemente.", modules: ["Tarefas", "Calendário"], tip: "Use o Kanban do Kairo para visualizar suas tarefas em diferentes estágios.", gradient: "from-blue-500/20 to-cyan-500/20" },
  perseguidor: { title: "O Perseguidor de Metas", emoji: "🎯", description: "Foco em objetivos, quer acompanhar progresso e se motiva por consistência.", modules: ["Metas", "Streaks de Consistência"], tip: "Configure suas metas com marcos intermediários para manter a motivação.", gradient: "from-orange-500/20 to-amber-500/20" },
  financeiro: { title: "O Controlador Financeiro", emoji: "💰", description: "Foco em finanças, quer análise, gráficos e usa IA para insights.", modules: ["Finanças", "Dashboard"], tip: "Use o assistente financeiro com IA para obter insights sobre seus gastos.", gradient: "from-emerald-500/20 to-green-500/20" },
  construtor: { title: "O Construtor de Hábitos", emoji: "🏃", description: "Foco em consistência, quer ver streaks e se motiva por progresso visual.", modules: ["Hábitos", "Streaks"], tip: "Comece com 2-3 hábitos simples e vá aumentando conforme ganha consistência.", gradient: "from-purple-500/20 to-violet-500/20" },
  equilibrador: { title: "O Equilibrador de Vida", emoji: "⚖️", description: "Quer organizar todas as áreas, busca equilíbrio entre pessoal e profissional.", modules: ["Dashboard", "Todas as ferramentas"], tip: "Use o Dashboard para ter uma visão macro de todas as áreas da sua vida.", gradient: "from-pink-500/20 to-rose-500/20" },
  iniciante: { title: "O Iniciante Curioso", emoji: "✨", description: "Primeira experiência com organização, aberto a explorar e aprender.", modules: ["Tarefas", "Hábitos"], tip: "Faça um tour pelos módulos e comece com o que mais faz sentido para você.", gradient: "from-sky-500/20 to-indigo-500/20" },
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

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-30%] left-[-20%] w-[70vw] h-[70vw] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-primary/3 blur-[80px]" />
      </div>

      {/* Header */}
      <header className="w-full bg-background/60 backdrop-blur-2xl sticky top-0 z-50 border-b border-border/30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center">
          {currentQ > 0 && !showFeedback && !finished ? (
            <button onClick={handleBack} className="p-1.5 -ml-1.5 rounded-full hover:bg-accent transition-colors">
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
          ) : (
            <div className="w-8" />
          )}
          <div className="flex-1 flex justify-center">
            <img src={kairoLogo} alt="Kairo" className="h-7 w-7 rounded-lg" />
          </div>
          <span className="text-xs text-muted-foreground font-medium tabular-nums w-8 text-right">
            {finished ? totalQ : currentQ + 1}/{totalQ}
          </span>
        </div>

        {/* Progress bar */}
        <div className="max-w-lg mx-auto px-4 pb-3">
          <div className="flex gap-1">
            {Array.from({ length: totalQ }).map((_, i) => (
              <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden bg-muted/50">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={false}
                  animate={{
                    width: i < currentQ || finished ? "100%" : i === currentQ ? "50%" : "0%",
                  }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-4 py-6 overflow-y-auto relative z-10">
        <AnimatePresence mode="wait">
          {!finished ? (
            <motion.div
              key={`q-${currentQ}-${showFeedback ? "fb" : "q"}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full max-w-lg"
            >
              {!showFeedback ? (
                <>
                  {/* Category pill */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center mb-4"
                  >
                    <span className="text-[10px] font-bold tracking-[0.2em] text-primary/80 bg-primary/8 border border-primary/15 px-3 py-1 rounded-full uppercase">
                      {q.category}
                    </span>
                  </motion.div>

                  {/* Question */}
                  <h2 className="text-lg sm:text-xl font-bold text-center mb-6 leading-snug px-2">
                    {q.question}
                  </h2>

                  {/* Options */}
                  <div className="flex flex-col gap-2.5">
                    {q.options.map((opt, idx) => {
                      const isMultiSelected = multiSelected.includes(idx);
                      return (
                        <motion.button
                          key={idx}
                          onClick={() => handleSelect(idx)}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05, duration: 0.3 }}
                          whileTap={{ scale: 0.97 }}
                          className={`group flex items-center gap-3 w-full text-left p-3.5 rounded-2xl border transition-all duration-200 ${
                            isMultiSelected
                              ? "border-primary/50 bg-primary/10 shadow-[0_0_20px_-5px] shadow-primary/20"
                              : "border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 hover:bg-card/80 active:bg-accent/60"
                          }`}
                        >
                          <span className="text-2xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                            {opt.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm leading-tight">{opt.label}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{opt.description}</p>
                          </div>
                          {q.multiSelect && (
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                              isMultiSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
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
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: multiSelected.length > 0 ? 1 : 0.4, y: 0 }}
                      className="mt-6"
                    >
                      <Button
                        onClick={handleMultiContinue}
                        disabled={multiSelected.length === 0}
                        className="w-full h-12 rounded-2xl gap-2 text-sm font-semibold"
                      >
                        Continuar
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
                </>
              ) : (
                /* Feedback screen */
                <div className="flex flex-col items-center text-center pt-4">
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", damping: 10, stiffness: 200 }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-5 shadow-lg shadow-primary/10"
                  >
                    <Sparkles className="h-7 w-7 text-primary" />
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-muted-foreground text-sm leading-relaxed max-w-sm mb-8"
                  >
                    {feedbackText}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="w-full"
                  >
                    <Button onClick={handleNext} className="w-full h-12 rounded-2xl gap-2 text-sm font-semibold">
                      {currentQ < totalQ - 1 ? "Próxima pergunta" : "Ver meu resultado"}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              )}
            </motion.div>
          ) : (
            /* Result */
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-lg"
            >
              {/* Profile hero */}
              <div className={`relative rounded-3xl bg-gradient-to-br ${profile?.gradient} border border-border/30 p-6 mb-5 text-center overflow-hidden`}>
                <div className="absolute inset-0 bg-card/40 backdrop-blur-xl" />
                <div className="relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10, delay: 0.2 }}
                    className="text-5xl mb-3"
                  >
                    {profile?.emoji}
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="text-[10px] font-bold tracking-[0.2em] text-primary/80 uppercase mb-1"
                  >
                    Seu perfil
                  </motion.p>

                  <motion.h2
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl sm:text-2xl font-bold mb-2"
                  >
                    {profile?.title}
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-muted-foreground text-sm leading-relaxed"
                  >
                    {profile?.description}
                  </motion.p>
                </div>
              </div>

              {/* Modules */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-2xl p-4 mb-3"
              >
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <span className="text-base">📌</span> Módulos recomendados
                </h3>
                <div className="flex flex-wrap gap-2">
                  {profile?.modules.map((m) => (
                    <span key={m} className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-xl border border-primary/20">
                      {m}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Tip */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-2xl p-4 mb-3"
              >
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <span className="text-base">💡</span> Dica para começar
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{profile?.tip}</p>
              </motion.div>

              {/* Steps */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-card/60 backdrop-blur-sm border border-border/30 rounded-2xl p-4 mb-6"
              >
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <span className="text-base">🚀</span> Próximos passos
                </h3>
                <div className="space-y-2.5">
                  {[
                    "Comece com o módulo recomendado",
                    "Dedique 5 min para explorar",
                    "Crie seu primeiro item",
                    "Mantenha consistência por 7 dias",
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{step}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col gap-2.5"
              >
                <Link to="/#pricing">
                  <Button className="w-full h-13 rounded-2xl gap-2 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
                    <Sparkles className="h-4 w-4" />
                    Comece sua jornada agora
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="ghost" className="w-full h-11 rounded-2xl text-xs text-muted-foreground">
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
