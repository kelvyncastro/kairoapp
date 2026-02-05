import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Import screenshots
import dashboardImg from "@/assets/screenshots/dashboard.png";
import tarefasImg from "@/assets/screenshots/tarefas.png";
import calendarioImg from "@/assets/screenshots/calendario.png";
import habitosImg from "@/assets/screenshots/habitos.png";
import metasImg from "@/assets/screenshots/metas.png";
import rankingImg from "@/assets/screenshots/ranking.png";
import chatImg from "@/assets/screenshots/chat.png";
import financasImg from "@/assets/screenshots/financas.png";

const screenshots = [
  {
    src: dashboardImg,
    title: "Dashboard",
    description: "Visão completa do seu dia: tarefas pendentes, metas ativas, finanças e streak de consistência em um único lugar."
  },
  {
    src: tarefasImg,
    title: "Tarefas",
    description: "Organize suas tarefas por pastas, defina prioridades, datas e acompanhe o tempo gasto em cada atividade."
  },
  {
    src: calendarioImg,
    title: "Calendário",
    description: "Planeje sua semana com blocos de tempo, visualize compromissos e gerencie sua rotina de forma visual."
  },
  {
    src: habitosImg,
    title: "Hábitos",
    description: "Crie e monitore hábitos diários com uma grade visual que mostra seu progresso ao longo do mês."
  },
  {
    src: metasImg,
    title: "Metas",
    description: "Defina metas com prazos, acompanhe o progresso com gráficos e visualize o histórico de atualizações."
  },
  {
    src: rankingImg,
    title: "Ranking",
    description: "Compita com amigos em desafios de metas, aposte e acompanhe quem está liderando em tempo real."
  },
  {
    src: chatImg,
    title: "Chat Financeiro",
    description: "Registre transações por texto natural e converse com IA para analisar seus gastos de forma inteligente."
  },
  {
    src: financasImg,
    title: "Finanças",
    description: "Controle ganhos e gastos, visualize gráficos diários e categorize despesas por setores personalizados."
  },
];

const AUTOPLAY_INTERVAL = 5000;
const SWIPE_THRESHOLD = 50;

export function AppScreenshotCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % screenshots.length);
  }, []);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  }, []);

  const goToIndex = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  // Autoplay logic
  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(goToNext, AUTOPLAY_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, goToNext]);

  // Handle drag/swipe
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      goToPrev();
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      goToNext();
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      {/* Carousel Container */}
      <div 
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Image Container with animated neon border */}
        <div className="relative p-[3px] rounded-2xl overflow-hidden">
          {/* Animated neon glow border */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_100%] animate-[neon-flow_3s_linear_infinite] opacity-80" />
          <div className="absolute inset-[2px] rounded-2xl bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50 bg-[length:200%_100%] animate-[neon-flow_3s_linear_infinite] blur-md" />
          
          {/* Inner container */}
          <div className="relative overflow-hidden rounded-2xl bg-background">
            <div className="relative aspect-[16/10] cursor-grab active:cursor-grabbing">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.img
                  key={currentIndex}
                  src={screenshots[currentIndex].src}
                  alt={screenshots[currentIndex].title}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  className="absolute inset-0 w-full h-full object-cover object-top"
                />
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
          aria-label="Anterior"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={goToNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black/90 transition-colors"
          aria-label="Próximo"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>

      {/* Caption */}
      <motion.div 
        className="text-center mt-6"
        key={currentIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-xl font-bold mb-2">{screenshots[currentIndex].title}</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {screenshots[currentIndex].description}
        </p>
      </motion.div>

      {/* Dots Navigation */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {screenshots.map((_, index) => (
          <button
            key={index}
            onClick={() => goToIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? "w-8 bg-foreground" 
                : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60"
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-foreground"
          initial={{ width: "0%" }}
          animate={{ width: isPaused ? `${((currentIndex + 1) / screenshots.length) * 100}%` : "100%" }}
          transition={{ 
            duration: isPaused ? 0 : AUTOPLAY_INTERVAL / 1000,
            ease: "linear"
          }}
          key={`${currentIndex}-${isPaused}`}
        />
      </div>
    </div>
  );
}
