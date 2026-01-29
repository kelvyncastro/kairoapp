import { motion, type Transition, type TargetAndTransition } from "framer-motion";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedFireProps {
  streak: number;
  className?: string;
}

type FireLevel = "none" | "dying" | "low" | "medium" | "high" | "inferno";

interface AnimationConfig {
  animate: TargetAndTransition;
  transition: Transition;
}

export function AnimatedFire({ streak, className }: AnimatedFireProps) {
  // Determine fire intensity level
  const getFireLevel = (): FireLevel => {
    if (streak === 0) return "none";
    if (streak < 3) return "dying";
    if (streak < 7) return "low";
    if (streak < 14) return "medium";
    if (streak < 30) return "high";
    return "inferno";
  };

  const level = getFireLevel();

  // Animation config based on level
  const getAnimationConfig = (): AnimationConfig => {
    const configs: Record<FireLevel, AnimationConfig> = {
      none: {
        animate: { opacity: 0.3, scale: 1 },
        transition: { duration: 0 },
      },
      dying: {
        animate: {
          opacity: [0.4, 0.6, 0.4],
          scale: [0.85, 0.9, 0.85],
          y: [0, -1, 0],
        },
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      },
      low: {
        animate: {
          opacity: [0.7, 0.9, 0.7],
          scale: [0.95, 1, 0.95],
          y: [0, -2, 0],
        },
        transition: {
          duration: 1.2,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      },
      medium: {
        animate: {
          opacity: [0.85, 1, 0.85],
          scale: [1, 1.1, 1],
          y: [0, -3, 0],
          rotate: [-2, 2, -2],
        },
        transition: {
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      },
      high: {
        animate: {
          opacity: 1,
          scale: [1.05, 1.15, 1.05],
          y: [0, -4, 0],
          rotate: [-3, 3, -3],
        },
        transition: {
          duration: 0.5,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      },
      inferno: {
        animate: {
          opacity: 1,
          scale: [1.1, 1.25, 1.1],
          y: [0, -5, 0],
          rotate: [-5, 5, -5],
        },
        transition: {
          duration: 0.3,
          repeat: Infinity,
          ease: "easeInOut" as const,
        },
      },
    };
    return configs[level];
  };

  // Color classes based on level
  const getColorClass = () => {
    switch (level) {
      case "none":
        return "text-muted-foreground";
      case "dying":
        return "text-orange-900/70";
      case "low":
        return "text-orange-600";
      case "medium":
        return "text-orange-500";
      case "high":
        return "text-orange-400";
      case "inferno":
        return "text-yellow-400";
      default:
        return "text-muted-foreground";
    }
  };

  // Glow effect for higher levels
  const getGlowStyle = (): React.CSSProperties => {
    switch (level) {
      case "medium":
        return { filter: "drop-shadow(0 0 4px rgba(249, 115, 22, 0.4))" };
      case "high":
        return { filter: "drop-shadow(0 0 8px rgba(251, 146, 60, 0.6))" };
      case "inferno":
        return { filter: "drop-shadow(0 0 12px rgba(250, 204, 21, 0.8))" };
      default:
        return {};
    }
  };

  const { animate, transition } = getAnimationConfig();
  const showExtraFlame = level === "high" || level === "inferno";

  return (
    <motion.div
      className={cn("relative inline-flex", className)}
      animate={animate}
      transition={transition}
      style={getGlowStyle()}
    >
      <Flame className={cn("h-5 w-5", getColorClass())} />
      
      {/* Extra flame layers for higher levels */}
      {showExtraFlame && (
        <motion.div
          className="absolute inset-0"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1.2, 1.4, 1.2],
          }}
          transition={{
            duration: level === "inferno" ? 0.2 : 0.4,
            repeat: Infinity,
            ease: "easeInOut" as const,
          }}
        >
          <Flame className={cn("h-5 w-5 text-destructive/50")} />
        </motion.div>
      )}
    </motion.div>
  );
}