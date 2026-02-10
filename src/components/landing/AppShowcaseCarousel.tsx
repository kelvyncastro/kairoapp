import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

import showcaseDashboard from "@/assets/showcase/showcase-dashboard.png";
import showcaseTarefas from "@/assets/showcase/showcase-tarefas.png";
import showcaseHabitos from "@/assets/showcase/showcase-habitos.png";
import showcaseMetas from "@/assets/showcase/showcase-metas.png";
import showcaseFinancas from "@/assets/showcase/showcase-financas.png";
import showcaseChat from "@/assets/showcase/showcase-chat.png";
import showcaseCalendario from "@/assets/showcase/showcase-calendario.png";
import showcaseRanking from "@/assets/showcase/showcase-ranking.png";
import showcaseNotas from "@/assets/showcase/showcase-notas.png";

import mobileDashboard from "@/assets/showcase/mobile-dashboard.png";
import mobileTarefas from "@/assets/showcase/mobile-tarefas.png";
import mobileHabitos from "@/assets/showcase/mobile-habitos.png";
import mobileMetas from "@/assets/showcase/mobile-metas.png";
import mobileFinancas from "@/assets/showcase/mobile-financas.png";
import mobileChat from "@/assets/showcase/mobile-chat.png";
import mobileCalendario from "@/assets/showcase/mobile-calendario.png";
import mobileRanking from "@/assets/showcase/mobile-ranking.png";
import mobileNotas from "@/assets/showcase/mobile-notas.png";

const slides = [
  {
    image: showcaseDashboard,
    mobileImage: mobileDashboard,
    title: "Dashboard",
    description: "Visão geral do seu dia com tarefas, metas, finanças, hábitos e agenda em um único painel.",
  },
  {
    image: showcaseTarefas,
    mobileImage: mobileTarefas,
    title: "Tarefas",
    description: "Organize por pastas, defina prioridades, prazos e acompanhe o tempo com cronômetro integrado.",
  },
  {
    image: showcaseHabitos,
    mobileImage: mobileHabitos,
    title: "Hábitos",
    description: "Grade visual semanal com progresso diário e gráfico de evolução ao longo do mês.",
  },
  {
    image: showcaseMetas,
    mobileImage: mobileMetas,
    title: "Metas",
    description: "Acompanhe objetivos com barra de progresso, histórico de evolução e categorias personalizadas.",
  },
  {
    image: showcaseCalendario,
    mobileImage: mobileCalendario,
    title: "Calendário",
    description: "Visualize sua semana com blocos de horário, compromissos e indicador de hora atual.",
  },
  {
    image: showcaseChat,
    mobileImage: mobileChat,
    title: "Chat Financeiro",
    description: "Converse com IA para registrar gastos, consultar relatórios e receber conselhos financeiros.",
  },
  {
    image: showcaseFinancas,
    mobileImage: mobileFinancas,
    title: "Finanças",
    description: "Controle receitas e despesas com gráficos diários, categorias e visão mensal completa.",
  },
  {
    image: showcaseRanking,
    mobileImage: mobileRanking,
    title: "Ranking",
    description: "Compita com amigos em desafios, acompanhe pontuações e metas com apostas motivacionais.",
  },
  {
    image: showcaseNotas,
    mobileImage: mobileNotas,
    title: "Notas",
    description: "Editor rico com pastas, busca rápida e organização flexível para suas anotações.",
  },
];

export function AppShowcaseCarousel() {
  const isMobile = useIsMobile();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    slidesToScroll: 1,
    containScroll: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    const interval = setInterval(() => {
      if (emblaApi) emblaApi.scrollNext();
    }, 5000);

    return () => {
      emblaApi.off("select", onSelect);
      clearInterval(interval);
    };
  }, [emblaApi, onSelect]);

  return (
    <section className="relative z-10 pt-8 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
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

        <div className="relative">
          <div ref={emblaRef} className="overflow-hidden">
            <div className="flex -ml-4">
              {slides.map((slide) => (
                <div
                  key={slide.title}
                  className="flex-[0_0_85%] sm:flex-[0_0_60%] lg:flex-[0_0_45%] min-w-0 pl-4"
                >
                  <motion.div
                    className="group cursor-pointer h-full"
                    whileHover={{ scale: 1.04 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className="relative rounded-xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm shadow-lg h-full flex flex-col">
                      <div className="aspect-video overflow-hidden bg-muted/30 flex items-center justify-center">
                        <img
                          src={isMobile ? slide.mobileImage : slide.image}
                          alt={slide.title}
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
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
