import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHabits } from '@/hooks/useHabits';
import { HabitProgressChart } from '@/components/habits/HabitProgressChart';
import { HabitGrid } from '@/components/habits/HabitGrid';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Habitos() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const monthKey = format(currentDate, 'yyyy-MM');
  
  const {
    habits,
    loading,
    daysInMonth,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabitLog,
    getHabitAdherence,
    dailyScores,
    getLogStatus,
  } = useHabits(currentDate);

  const goToPreviousMonth = () => setCurrentDate((prev) => subMonths(prev, 1));
  const goToNextMonth = () => setCurrentDate((prev) => addMonths(prev, 1));
  const goToToday = () => setCurrentDate(new Date());

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
        <div className="h-40 bg-muted/30 rounded animate-pulse" />
        <div className="h-64 bg-muted/30 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-4 md:-m-6 bg-background overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between px-4 md:px-6 py-2 md:py-3 border-b border-border/30 flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <h1 className="text-lg md:text-xl font-bold">Hábitos</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6 md:h-7 md:w-7" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
            <span className="text-xs md:text-sm font-medium min-w-[80px] md:min-w-[100px] text-center capitalize">
              {format(currentDate, 'MMM yyyy', { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6 md:h-7 md:w-7" onClick={goToNextMonth}>
              <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={goToToday}>
          Hoje
        </Button>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Progress Chart */}
        <div className="px-4 md:px-6 py-2 md:py-3">
          <h2 className="text-sm md:text-base font-bold text-foreground uppercase tracking-wider mb-2 md:mb-3">
            Progresso do Mês
          </h2>
          <HabitProgressChart dailyScores={dailyScores} />
        </div>

        {/* Habits Grid */}
        <div className="px-4 md:px-6 py-2 md:py-3 border-t border-border/30">
          <h2 className="text-sm md:text-base font-bold text-foreground uppercase tracking-wider mb-2 md:mb-3">
            Grade de Hábitos
          </h2>
          <HabitGrid
            habits={habits}
            daysInMonth={daysInMonth}
            monthKey={monthKey}
            onToggleLog={toggleHabitLog}
            onCreateHabit={createHabit}
            onUpdateHabit={updateHabit}
            onDeleteHabit={deleteHabit}
            getHabitAdherence={getHabitAdherence}
            getLogStatus={getLogStatus}
          />
        </div>
      </div>
    </div>
  );
}
