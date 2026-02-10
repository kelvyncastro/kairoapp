import { useRef, useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

import showcaseDashboard from "@/assets/showcase/showcase-dashboard.jpg";
import showcaseTarefas from "@/assets/showcase/showcase-tarefas.jpg";
import showcaseHabitos from "@/assets/showcase/showcase-habitos.jpg";
import showcaseMetas from "@/assets/showcase/showcase-metas.jpg";
import showcaseFinancas from "@/assets/showcase/showcase-financas.jpg";
import showcaseChat from "@/assets/showcase/showcase-chat.jpg";
import showcaseCalendario from "@/assets/showcase/showcase-calendario.jpg";

const slides = [
  {
    image: showcaseDashboard,
    title: "Dashboard",
    description: "Visão geral completa da sua vida em um painel intuitivo e personalizável.",
  },
  {
    image: showcaseTarefas,
    title: "Tarefas",
    description: "Kanban, listas, filtros avançados e timer integrado para máxima produtividade.",
  },
  {
    image: showcaseHabitos,
    title: "Hábitos",
    description: "Acompanhe seus hábitos diários com grid visual semanal e estatísticas.",
  },
  {
    image: showcaseMetas,
    title: "Metas",
    description: "Defina metas com prazos, progresso visual e histórico de evolução.",
  },
  {
    image: showcaseFinancas,
    title: "Finanças",
    description: "Controle receitas e despesas com gráficos, categorias e análise inteligente.",
  },
  {
    image: showcaseChat,
    title: "Chat Financeiro",
    description: "Converse com IA sobre suas finanças e receba insights personalizados.",
  },
  {
    image: showcaseCalendario,
    title: "Calendário",
    description: "Organize seu tempo com blocos, prioridades e pontuação de produtividade.",
  },
];

export function AppShowcaseCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    slidesToScroll: 1,
    containScroll: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    // Auto-scroll
    const interval = setInterval(() => {
      if (emblaApi) emblaApi.scrollNext();
    }, 5000);

    return () => {
      emblaApi.off("select", onSelect);
      clearInterval(interval);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Conheça cada setor
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore as telas do Kairo e veja como cada funcionalidade foi pensada para você
          </p>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex -ml-4">
              {slides.map((slide, index) => (
                <div
                  key={slide.title}
                  className="flex-[0_0_85%] sm:flex-[0_0_60%] lg:flex-[0_0_45%] min-w-0 pl-4"
                >
                  <motion.div
                    className="group cursor-pointer"
                    whileHover={{ scale: 1.04 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className="relative rounded-xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm shadow-lg">
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={slide.image}
                          alt={slide.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-1">{slide.title}</h3>
                        <p className="text-sm text-muted-foreground">{slide.description}</p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </div>
          </div>

          {/* Nav buttons */}
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm shadow-md hidden sm:flex"
            onClick={() => emblaApi?.scrollPrev()}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm shadow-md hidden sm:flex"
            onClick={() => emblaApi?.scrollNext()}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === selectedIndex
                  ? "w-6 bg-primary"
                  : "w-2 bg-muted-foreground/30"
              }`}
              onClick={() => emblaApi?.scrollTo(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
