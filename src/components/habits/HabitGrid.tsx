import * as React from 'react';
import { Check, MoreHorizontal, Trash2, Edit2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { HabitWithLogs } from '@/types/habits';
import { format, isSameDay, getDay } from 'date-fns';

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
  const CELL_WIDTH = 32; // reduced for smaller checkboxes
  const [newHabitName, setNewHabitName] = React.useState('');
  const [isAddingHabit, setIsAddingHabit] = React.useState(false);
  const [editingHabitId, setEditingHabitId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const editInputRef = React.useRef<HTMLInputElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const today = new Date();

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

  // Scroll to today's column on mount
  React.useEffect(() => {
    if (gridRef.current && daysInMonth.length > 0) {
      const todayIndex = daysInMonth.findIndex((d) => isSameDay(d, today));
      if (todayIndex > 0) {
        const cellWidth = CELL_WIDTH;
        const scrollPosition = Math.max(0, (todayIndex - 5) * cellWidth);
        gridRef.current.scrollLeft = scrollPosition;
      }
    }
  }, [daysInMonth, monthKey, habits.length, CELL_WIDTH]);

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

  const isSunday = (date: Date) => getDay(date) === 0;

  return (
    <div className="flex flex-col w-full overflow-hidden">
      {/* Grid container */}
      <div className="flex w-full">
        {/* Fixed left column - Habit names */}
        <div className="flex-shrink-0 w-72 border-r border-border/30 bg-background z-10">
          {/* Header spacer */}
          <div className="h-10 border-b border-border/30 flex items-center px-4">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Hábitos</span>
          </div>
          
          {/* Habit rows */}
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="h-12 px-4 flex items-center justify-between border-b border-border/20 group hover:bg-muted/20 transition-colors"
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
                    <p className="text-base font-medium truncate text-foreground">{habit.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-sm text-muted-foreground">
                        {getMonthlyCompletionCount(habit, daysInMonth)}x
                      </span>
                      <span className="text-sm text-muted-foreground">•</span>
                      <span className="text-sm font-semibold text-success">
                        {getHabitAdherence(habit)}%
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      >
                        <MoreHorizontal className="h-4 w-4" />
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
          ))}

          {/* Add habit row */}
          <div className="h-12 px-4 flex items-center border-b border-border/20">
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
                className="text-muted-foreground hover:text-foreground w-full justify-start"
                onClick={() => setIsAddingHabit(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar hábito
              </Button>
            )}
          </div>
        </div>

        {/* Scrollable right section - Days grid */}
        <div ref={gridRef} className="flex-1 overflow-x-auto">
          <div className="inline-flex flex-col w-max min-w-full">
            {/* Days header */}
            <div className="flex h-10 border-b border-border/30">
              {daysInMonth.map((day) => {
                const isToday = isSameDay(day, today);
                const isSun = isSunday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'w-8 flex-shrink-0 flex items-center justify-center text-xs font-medium',
                      isSun && 'text-destructive',
                      isToday && 'text-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'w-6 h-6 flex items-center justify-center rounded-full transition-colors text-xs',
                        isToday && 'bg-destructive text-destructive-foreground font-bold'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Habit day cells */}
            {habits.map((habit) => (
              <div key={habit.id} className="flex h-12 border-b border-border/20">
                {daysInMonth.map((day) => {
                  const status = getLogStatus(habit, day);

                  return (
                    <div
                      key={day.toISOString()}
                      className="w-8 flex-shrink-0 flex items-center justify-center"
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
                          'w-5 h-5 rounded flex items-center justify-center transition-all duration-150',
                          status === 'done' && 'bg-success hover:brightness-110',
                          (status === 'not_done' || status === 'not_planned') && 'border border-muted-foreground/30 hover:border-success/60 hover:bg-muted/30',
                          status === 'pending' && 'border-2 border-destructive hover:bg-destructive/10',
                          status === 'future' && 'border border-muted-foreground/15 opacity-30 cursor-not-allowed'
                        )}
                      >
                        {status === 'done' && <Check className="h-3 w-3 text-black" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Empty row for add habit alignment */}
            <div className="flex h-12 border-b border-border/20">
              {daysInMonth.map((day) => (
                <div key={day.toISOString()} className="w-8 flex-shrink-0" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export { HabitGrid };
