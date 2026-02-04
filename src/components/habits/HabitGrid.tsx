import * as React from 'react';
import { Check, MoreHorizontal, Trash2, Edit2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { HabitWithLogs } from '@/types/habits';
import { format, isSameDay, getDay, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HabitGridProps {
  habits: HabitWithLogs[];
  daysInMonth: Date[];
  monthKey?: string;
  onToggleLog: (habitId: string, date: Date) => void;
  onCreateHabit: (name: string) => void;
  onUpdateHabit: (id: string, updates: { name: string }) => void;
  onDeleteHabit: (id: string) => void;
  getHabitAdherence: (habit: HabitWithLogs) => number;
  getLogStatus: (habit: HabitWithLogs, date: Date) => 'done' | 'not_done' | 'pending' | 'future' | 'not_planned';
}

// Calculate how many times a habit was completed in the current month
const getMonthlyCompletionCount = (habit: HabitWithLogs, daysInMonth: Date[]): number => {
  const monthStart = daysInMonth[0];
  const monthEnd = daysInMonth[daysInMonth.length - 1];
  
  return habit.logs.filter(log => {
    if (log.status !== 'done') return false;
    const logDate = new Date(log.date + 'T00:00:00');
    return logDate >= monthStart && logDate <= monthEnd;
  }).length;
};

// Group days into weeks
const groupDaysIntoWeeks = (days: Date[]): Date[][] => {
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  days.forEach((day, index) => {
    currentWeek.push(day);
    // End week on Saturday (6) or at the end of the array
    if (getDay(day) === 6 || index === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  return weeks;
};

const HabitGrid = React.memo(function HabitGrid({
  habits,
  daysInMonth,
  monthKey,
  onToggleLog,
  onCreateHabit,
  onUpdateHabit,
  onDeleteHabit,
  getHabitAdherence,
  getLogStatus,
}: HabitGridProps) {
  const CELL_WIDTH = 32;
  const [newHabitName, setNewHabitName] = React.useState('');
  const [isAddingHabit, setIsAddingHabit] = React.useState(false);
  const [editingHabitId, setEditingHabitId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const editInputRef = React.useRef<HTMLInputElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const today = new Date();

  const weeks = React.useMemo(() => groupDaysIntoWeeks(daysInMonth), [daysInMonth]);

  React.useEffect(() => {
    if (isAddingHabit && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingHabit]);

  React.useEffect(() => {
    if (editingHabitId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingHabitId]);

  // Scroll to current week on mount
  React.useEffect(() => {
    if (gridRef.current && daysInMonth.length > 0) {
      const todayIndex = daysInMonth.findIndex((d) => isSameDay(d, today));
      if (todayIndex > 0) {
        const weekIndex = weeks.findIndex(week => week.some(d => isSameDay(d, today)));
        if (weekIndex > 0) {
          const scrollPosition = Math.max(0, (weekIndex - 1) * (7 * CELL_WIDTH + 8));
          gridRef.current.scrollLeft = scrollPosition;
        }
      }
    }
  }, [daysInMonth, monthKey, habits.length, weeks, CELL_WIDTH]);

  const handleAddHabit = () => {
    if (newHabitName.trim()) {
      onCreateHabit(newHabitName.trim());
      setNewHabitName('');
      setIsAddingHabit(false);
    }
  };

  const handleEditHabit = (habit: HabitWithLogs) => {
    setEditingHabitId(habit.id);
    setEditingName(habit.name);
  };

  const handleSaveEdit = () => {
    if (editingHabitId && editingName.trim()) {
      onUpdateHabit(editingHabitId, { name: editingName.trim() });
    }
    setEditingHabitId(null);
    setEditingName('');
  };

  const getDayOfWeekShort = (date: Date): string => {
    return format(date, 'EEE', { locale: ptBR }).toUpperCase().slice(0, 3);
  };

  return (
    <div className="flex flex-col w-full overflow-hidden bg-muted/5 rounded-lg border border-border/30">
      {/* Grid container */}
      <div className="flex w-full">
        {/* Fixed left column - Habit names with progress bars */}
        <div className="flex-shrink-0 w-44 md:w-56 border-r border-border/30 bg-background/50 z-10">
          {/* Header */}
          <div className="h-14 md:h-16 border-b border-border/30 flex items-center px-3 md:px-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hábito</span>
          </div>
          
          {/* Habit rows */}
          {habits.map((habit) => {
            const adherence = getHabitAdherence(habit);
            return (
              <div
                key={habit.id}
                className="h-12 md:h-14 px-3 md:px-4 flex items-center justify-between border-b border-border/20 group hover:bg-muted/20 transition-colors"
              >
                {editingHabitId === habit.id ? (
                  <Input
                    ref={editInputRef}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') {
                        setEditingHabitId(null);
                        setEditingName('');
                      }
                    }}
                    className="h-8 text-sm"
                  />
                ) : (
                  <>
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate text-foreground">{habit.name}</p>
                        <span className="text-xs font-medium text-primary ml-2 flex-shrink-0">
                          {adherence}%
                        </span>
                      </div>
                      <Progress 
                        value={adherence} 
                        className="h-1.5 bg-muted/30" 
                      />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="z-50">
                        <DropdownMenuItem onClick={() => handleEditHabit(habit)}>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDeleteHabit(habit.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            );
          })}

          {/* Add habit row */}
          <div className="h-12 md:h-14 px-3 md:px-4 flex items-center border-b border-border/20">
            {isAddingHabit ? (
              <Input
                ref={inputRef}
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="Nome do hábito..."
                onBlur={() => {
                  if (!newHabitName.trim()) setIsAddingHabit(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddHabit();
                  if (e.key === 'Escape') {
                    setIsAddingHabit(false);
                    setNewHabitName('');
                  }
                }}
                className="h-8 text-sm"
              />
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary/80 hover:bg-primary/10 w-full justify-start gap-2"
                onClick={() => setIsAddingHabit(true)}
              >
                <Plus className="h-4 w-4" />
                Adicionar Hábito
              </Button>
            )}
          </div>
        </div>

        {/* Scrollable right section - Weeks grid */}
        <div ref={gridRef} className="flex-1 overflow-x-auto">
          <div className="inline-flex w-max min-w-full">
            {/* Weeks */}
            {weeks.map((week, weekIndex) => (
              <div 
                key={weekIndex} 
                className={cn(
                  "flex flex-col",
                  weekIndex < weeks.length - 1 && "border-r border-border/20"
                )}
              >
                {/* Week header */}
                <div className="h-14 md:h-16 border-b border-border/30 flex flex-col justify-center px-2">
                  <span className="text-xs font-semibold text-muted-foreground text-center mb-1">
                    Semana {weekIndex + 1}
                  </span>
                  <div className="flex">
                    {week.map((day) => {
                      const isToday = isSameDay(day, today);
                      return (
                        <div
                          key={day.toISOString()}
                          className="w-8 flex-shrink-0 flex flex-col items-center"
                        >
                          <span className="text-[9px] text-muted-foreground/70 mb-0.5">
                            {format(day, 'd')}/{format(day, 'MM')}
                          </span>
                          <span className={cn(
                            "text-[8px] uppercase",
                            isToday ? "text-primary font-bold" : "text-muted-foreground/50"
                          )}>
                            {getDayOfWeekShort(day)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Habit cells for this week */}
                {habits.map((habit) => (
                  <div key={habit.id} className="flex h-12 md:h-14 border-b border-border/20">
                    {week.map((day) => {
                      const status = getLogStatus(habit, day);
                      const isToday = isSameDay(day, today);

                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "w-8 flex-shrink-0 flex items-center justify-center",
                            isToday && "bg-primary/5"
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              if (status !== 'future') {
                                onToggleLog(habit.id, day);
                              }
                            }}
                            disabled={status === 'future'}
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150',
                              status === 'done' && 'bg-primary text-primary-foreground shadow-sm shadow-primary/30',
                              (status === 'not_done' || status === 'not_planned') && 'border-2 border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/10',
                              status === 'pending' && 'border-2 border-primary bg-primary/10 hover:bg-primary/20',
                              status === 'future' && 'border border-muted-foreground/10 opacity-30 cursor-not-allowed'
                            )}
                          >
                            {status === 'done' && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Empty row for add habit alignment */}
                <div className="flex h-12 md:h-14 border-b border-border/20">
                  {week.map((day) => (
                    <div key={day.toISOString()} className="w-8 flex-shrink-0" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

export { HabitGrid };
