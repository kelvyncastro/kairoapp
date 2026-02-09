"use client";

import { Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  visualizerBars?: number;
  className?: string;
  isRecording?: boolean;
}

export function AIVoiceInput({
  onStart,
  onStop,
  visualizerBars = 48,
  className,
  isRecording: externalRecording,
}: AIVoiceInputProps) {
  const [submitted, setSubmitted] = useState(false);
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);

  const isActive = externalRecording !== undefined ? externalRecording : submitted;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isActive) {
      intervalId = setInterval(() => {
        setTime((t) => t + 1);
      }, 1000);
    } else {
      setTime(0);
    }

    return () => clearInterval(intervalId);
  }, [isActive]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClick = () => {
    if (externalRecording !== undefined) {
      if (isActive) {
        onStop?.(time);
      } else {
        onStart?.();
      }
    } else {
      const next = !submitted;
      setSubmitted(next);
      if (next) onStart?.();
      else onStop?.(time);
    }
  };

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative w-full flex flex-col items-center gap-4">
        <button
          className={cn(
            "group w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300",
            isActive
              ? "bg-destructive/20 border-2 border-destructive/50"
              : "bg-accent/50 hover:bg-accent border border-border/50"
          )}
          type="button"
          onClick={handleClick}
        >
          {isActive ? (
            <div className="w-6 h-6 rounded-sm bg-destructive animate-pulse" />
          ) : (
            <Mic className="w-6 h-6 text-foreground/80" />
          )}
        </button>

        <span className="font-mono text-sm tabular-nums text-muted-foreground">
          {formatTime(time)}
        </span>

        <div className="flex items-center gap-0.5 h-8">
          {[...Array(visualizerBars)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-0.5 rounded-full transition-all duration-300",
                isActive
                  ? "bg-foreground/50 animate-pulse"
                  : "bg-foreground/10 h-1"
              )}
              style={
                isActive
                  ? {
                      height: `${20 + Math.random() * 80}%`,
                      animationDelay: `${i * 0.05}s`,
                    }
                  : undefined
              }
            />
          ))}
        </div>

        <p className="text-xs text-muted-foreground h-4">
          {isActive ? "Gravando..." : "Clique para gravar"}
        </p>
      </div>
    </div>
  );
}
