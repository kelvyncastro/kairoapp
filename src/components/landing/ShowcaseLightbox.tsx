import { useCallback, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ShowcaseLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slides: { image: string; mobileImage: string; title: string }[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  isMobile: boolean;
}

export function ShowcaseLightbox({
  open,
  onOpenChange,
  slides,
  currentIndex,
  onIndexChange,
  isMobile,
}: ShowcaseLightboxProps) {
  const goNext = useCallback(() => {
    onIndexChange((currentIndex + 1) % slides.length);
  }, [currentIndex, slides.length, onIndexChange]);

  const goPrev = useCallback(() => {
    onIndexChange((currentIndex - 1 + slides.length) % slides.length);
  }, [currentIndex, slides.length, onIndexChange]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, goNext, goPrev]);

  const slide = slides[currentIndex];
  if (!slide) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-2 sm:p-4 bg-background/95 backdrop-blur-md border-border/50 flex flex-col items-center gap-2">
        <div className="relative w-full flex items-center justify-center flex-1 min-h-0">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 z-10 h-10 w-10 rounded-full bg-background/60 backdrop-blur-sm"
            onClick={goPrev}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <img
            src={isMobile ? slide.mobileImage : slide.image}
            alt={slide.title}
            className="max-h-[80vh] max-w-full object-contain rounded-lg"
          />

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 z-10 h-10 w-10 rounded-full bg-background/60 backdrop-blur-sm"
            onClick={goNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        <div className="text-center">
          <p className="font-semibold text-sm">{slide.title}</p>
          <p className="text-xs text-muted-foreground">{currentIndex + 1} / {slides.length}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
