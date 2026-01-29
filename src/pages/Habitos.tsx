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
    getDailyScores,
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
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">Criador de Hábitos</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center capitalize">
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Hoje
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Progress Chart */}
        <div className="px-6 py-5">
          <div className="max-w-6xl mx-auto w-full">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Progresso do Mês
            </h2>
            <HabitProgressChart dailyScores={getDailyScores()} />
          </div>
        </div>

        {/* Habits Grid */}
        <div className="px-6 py-5 border-t border-border/30">
          <div className="max-w-6xl mx-auto w-full">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
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
    </div>
  );
}
