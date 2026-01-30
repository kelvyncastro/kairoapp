import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskTimerProps {
  taskId: string;
  timeSpentSeconds: number;
  timerStartedAt: string | null;
  onUpdate: (updates: { time_spent_seconds?: number; timer_started_at?: string | null }) => void;
}

export function TaskTimer({ taskId, timeSpentSeconds, timerStartedAt, onUpdate }: TaskTimerProps) {
  const [displayTime, setDisplayTime] = useState(timeSpentSeconds || 0);
  const isRunning = !!timerStartedAt;

  // Calculate current elapsed time
  const calculateElapsed = useCallback(() => {
    if (!timerStartedAt) return timeSpentSeconds || 0;
    const startTime = new Date(timerStartedAt).getTime();
    const now = Date.now();
    const additionalSeconds = Math.floor((now - startTime) / 1000);
    return (timeSpentSeconds || 0) + additionalSeconds;
  }, [timerStartedAt, timeSpentSeconds]);

  // Update display every second when running
  useEffect(() => {
    setDisplayTime(calculateElapsed());

    if (!isRunning) return;

    const interval = setInterval(() => {
      setDisplayTime(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, calculateElapsed]);

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ timer_started_at: new Date().toISOString() });
  };

  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    const elapsed = calculateElapsed();
    onUpdate({ 
      time_spent_seconds: elapsed, 
      timer_started_at: null 
    });
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ 
      time_spent_seconds: 0, 
      timer_started_at: null 
    });
    setDisplayTime(0);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-1">
      <span 
        className={cn(
          "text-xs font-mono min-w-[50px] text-center",
          isRunning ? "text-success" : "text-muted-foreground"
        )}
      >
        {formatTime(displayTime)}
      </span>
      
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {isRunning ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={handlePause}
            title="Pausar"
          >
            <Pause className="h-3 w-3" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={handleStart}
            title="Iniciar"
          >
            <Play className="h-3 w-3" />
          </Button>
        )}
        
        {displayTime > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-destructive"
            onClick={handleReset}
            title="Resetar"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
