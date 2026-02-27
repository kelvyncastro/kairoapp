import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { Flame, Trophy, Crown, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Badge {
  days: number;
  icon: typeof Flame | typeof Trophy | typeof Crown;
  label: string;
  color: string;
}

interface AchievementCelebrationProps {
  badge: Badge | null;
  onClose: () => void;
}

export function AchievementCelebration({ badge, onClose }: AchievementCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (badge) {
      setIsVisible(true);
      
    }
  }, [badge]);

  const getConfettiColors = (colorClass: string) => {
    switch (colorClass) {
      case "streak-fire":
        return ["#f97316", "#ea580c", "#fb923c", "#fed7aa"];
      case "streak-trophy":
        return ["#eab308", "#facc15", "#fde047", "#fef3c7"];
      case "streak-crown":
        return ["#a855f7", "#8b5cf6", "#c084fc", "#ddd6fe"];
      default:
        return ["#22c55e", "#16a34a", "#4ade80", "#bbf7d0"];
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!badge) return null;

  const Icon = badge.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative bg-card border border-border rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Sparkles decoration */}
            <motion.div
              className="absolute -top-3 left-1/2 -translate-x-1/2"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="h-6 w-6 text-primary" />
            </motion.div>

            {/* Icon with animation */}
            <motion.div
              className="relative mx-auto mb-6"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", damping: 12 }}
            >
              <div className="relative">
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-full blur-xl opacity-50"
                  style={{
                    background: badge.color === "streak-fire" 
                      ? "radial-gradient(circle, #f97316 0%, transparent 70%)"
                      : badge.color === "streak-trophy"
                      ? "radial-gradient(circle, #eab308 0%, transparent 70%)"
                      : "radial-gradient(circle, #a855f7 0%, transparent 70%)"
                  }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                {/* Icon container */}
                <motion.div
                  className="relative w-24 h-24 rounded-full bg-card border-2 border-border flex items-center justify-center"
                  animate={{ 
                    boxShadow: [
                      "0 0 20px rgba(255,255,255,0.1)",
                      "0 0 40px rgba(255,255,255,0.2)",
                      "0 0 20px rgba(255,255,255,0.1)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Icon className={`h-12 w-12 ${badge.color}`} />
                </motion.div>
              </div>
            </motion.div>

            {/* Text content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold mb-2">🎉 Parabéns!</h2>
              <p className="text-muted-foreground mb-4">
                Você conquistou uma nova medalha!
              </p>
              
              <div className="bg-secondary/50 rounded-xl p-4 mb-6">
                <h3 className="text-xl font-bold mb-1">{badge.label}</h3>
                <p className="text-sm text-muted-foreground">
                  {badge.days} dias de consistência
                </p>
              </div>

              <motion.p
                className="text-sm text-muted-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                Continue assim! Cada dia conta para construir seus hábitos.
              </motion.p>
            </motion.div>

            {/* Continue button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-6"
            >
              <Button onClick={handleClose} className="w-full gap-2">
                <Sparkles className="h-4 w-4" />
                Continuar
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
