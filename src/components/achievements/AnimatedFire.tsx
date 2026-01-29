import { cn } from "@/lib/utils";
import "./animated-fire.css";

interface AnimatedFireProps {
  streak: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AnimatedFire({ streak, size = "md", className }: AnimatedFireProps) {
  // Determine fire intensity based on streak
  const getIntensity = () => {
    if (streak === 0) return "none";
    if (streak < 3) return "dying";
    if (streak < 7) return "low";
    if (streak < 14) return "medium";
    if (streak < 30) return "high";
    return "inferno";
  };

  const intensity = getIntensity();

  if (intensity === "none") return null;

  const sizeClasses = {
    sm: "w-6 h-8",
    md: "w-8 h-10",
    lg: "w-10 h-12",
  };

  return (
    <div 
      className={cn(
        "fire-container",
        sizeClasses[size],
        `fire-${intensity}`,
        className
      )}
    >
      <div className="fire">
        <div className="fire-flame fire-flame-main"></div>
        <div className="fire-flame fire-flame-left"></div>
        <div className="fire-flame fire-flame-right"></div>
        <div className="fire-flame fire-flame-inner"></div>
        <div className="fire-glow"></div>
      </div>
    </div>
  );
}