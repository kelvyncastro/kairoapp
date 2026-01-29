import { useState, useRef, useEffect } from 'react';
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
import { ptBR } from 'date-fns/locale';

interface HabitGridProps {
  habits: HabitWithLogs[];
  daysInMonth: Date[];
  onToggleLog: (habitId: string, date: Date) => void;
  onCreateHabit: (name: string) => void;
  onUpdateHabit: (id: string, updates: { name: string }) => void;
  onDeleteHabit: (id: string) => void;
  getHabitAdherence: (habit: HabitWithLogs) => number;
  getLogStatus: (habit: HabitWithLogs, date: Date) => 'done' | 'not_done' | 'pending' | 'future' | 'not_planned';
}

export function HabitGrid({
  habits,
  daysInMonth,
  onToggleLog,
  onCreateHabit,
  onUpdateHabit,
  onDeleteHabit,
  getHabitAdherence,
  getLogStatus,
}: HabitGridProps) {
  const [newHabitName, setNewHabitName] = useState('');
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  useEffect(() => {
    if (isAddingHabit && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAddingHabit]);

  useEffect(() => {
    if (editingHabitId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingHabitId]);

  // Scroll to today's column on mount
  useEffect(() => {
    if (gridRef.current) {
      const todayIndex = daysInMonth.findIndex((d) => isSameDay(d, today));
      if (todayIndex > 0) {
        const cellWidth = 36; // w-9 = 36px
        const scrollPosition = Math.max(0, (todayIndex - 3) * cellWidth);
        gridRef.current.scrollLeft = scrollPosition;
      }
    }
  }, [daysInMonth, today]);

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
    <div className="flex flex-col">
      {/* Grid container */}
      <div className="flex">
        {/* Fixed left column - Habit names */}
        <div className="flex-shrink-0 w-52 border-r border-border/30">
          {/* Header spacer */}
          <div className="h-10 border-b border-border/30" />
          
          {/* Habit rows */}
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="h-14 px-3 flex items-center justify-between border-b border-border/20 group"
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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{habit.name}</p>
                    <p className="text-xs text-red-500 font-semibold">
                      {getHabitAdherence(habit)}%
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditHabit(habit)}>
                        <Edit2 className="h-3.5 w-3.5 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDeleteHabit(habit.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          ))}

          {/* Add habit row */}
          <div className="h-14 px-3 flex items-center border-b border-border/20">
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
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setIsAddingHabit(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Adicionar hábito
              </Button>
            )}
          </div>
        </div>

        {/* Scrollable right section - Days grid */}
        <div ref={gridRef} className="flex-1 overflow-x-auto">
          <div className="inline-flex flex-col min-w-full">
            {/* Days header */}
            <div className="flex h-10 border-b border-border/30">
              {daysInMonth.map((day) => {
                const isToday = isSameDay(day, today);
                const isSun = isSunday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      'w-9 flex-shrink-0 flex items-center justify-center text-xs font-medium',
                      isSun && 'text-red-500',
                      isToday && 'text-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'w-6 h-6 flex items-center justify-center rounded-full',
                        isToday && 'bg-red-500 text-white'
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
              <div key={habit.id} className="flex h-14 border-b border-border/20">
                {daysInMonth.map((day) => {
                  const status = getLogStatus(habit, day);

                  return (
                    <div
                      key={day.toISOString()}
                      className="w-9 flex-shrink-0 flex items-center justify-center"
                    >
                      <button
                        onClick={() => onToggleLog(habit.id, day)}
                        disabled={status === 'future' || status === 'not_planned'}
                        className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                          status === 'done' && 'bg-green-500',
                          status === 'not_done' && 'border border-muted-foreground/30',
                          status === 'pending' && 'border-2 border-red-500',
                          status === 'future' && 'border border-muted-foreground/20 opacity-30 cursor-not-allowed',
                          status === 'not_planned' && 'opacity-0 cursor-default',
                          (status === 'not_done' || status === 'pending') && 'hover:border-green-500/50'
                        )}
                      >
                        {status === 'done' && <Check className="h-4 w-4 text-white" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Empty row for add habit */}
            <div className="flex h-14 border-b border-border/20">
              {daysInMonth.map((day) => (
                <div key={day.toISOString()} className="w-9 flex-shrink-0" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
