import * as React from 'react';
import { MoreHorizontal, Trash2, Edit2, Plus, GripVertical, FileText } from 'lucide-react';
import { NeonCheckbox } from '@/components/ui/animated-check-box';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { useSound } from '@/contexts/SoundContext';

interface HabitGridProps {
  habits: HabitWithLogs[];
  daysInMonth: Date[];
  monthKey?: string;
  onToggleLog: (habitId: string, date: Date) => void;
  onCreateHabit: (name: string, description?: string | null) => void;
  onUpdateHabit: (id: string, updates: { name?: string; description?: string | null }) => void;
  onDeleteHabit: (id: string) => void;
  getHabitAdherence: (habit: HabitWithLogs) => number;
  getLogStatus: (habit: HabitWithLogs, date: Date) => 'done' | 'not_done' | 'pending' | 'future' | 'not_planned';
  onReorder?: (reorderedHabits: HabitWithLogs[]) => void;
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

// Group days by week
const groupDaysByWeek = (days: Date[]): { weekNumber: number; days: Date[] }[] => {
  if (days.length === 0) return [];
  
  const weeks: { weekNumber: number; days: Date[] }[] = [];
  let currentWeek: Date[] = [];
  let weekNumber = 1;
  
  // Determine how many days to pad at the start to align with the first day
  const firstDay = days[0];
  const dayOfWeek = getDay(firstDay);
  // We want Sunday (0) to be the start of the week for this visualization
  const daysToFill = dayOfWeek;
  
  // Add empty slots for padding
  for (let i = 0; i < daysToFill; i++) {
    currentWeek.push(null as unknown as Date);
  }
  
  days.forEach((day) => {
    currentWeek.push(day);
    
    if (currentWeek.length === 7) {
      weeks.push({ weekNumber, days: currentWeek });
      currentWeek = [];
      weekNumber++;
    }
  });
  
  // Push remaining days
  if (currentWeek.length > 0) {
    // Pad the end
    while (currentWeek.length < 7) {
      currentWeek.push(null as unknown as Date);
    }
    weeks.push({ weekNumber, days: currentWeek });
  }
  
  return weeks;
};

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

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
  onReorder,
}: HabitGridProps) {
  const [newHabitName, setNewHabitName] = React.useState('');
  const [isAddingHabit, setIsAddingHabit] = React.useState(false);
  const [editingHabitId, setEditingHabitId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);
  const [detailHabit, setDetailHabit] = React.useState<HabitWithLogs | null>(null);
  const [detailName, setDetailName] = React.useState('');
  const [detailDescription, setDetailDescription] = React.useState('');
  const [isCreateMode, setIsCreateMode] = React.useState(false);
  const [columnWidth, setColumnWidth] = React.useState(224);
  const isResizing = React.useRef(false);
  const resizeStartX = React.useRef(0);
  const resizeStartWidth = React.useRef(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const editInputRef = React.useRef<HTMLInputElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const today = new Date();
  const { playCheck } = useSound();

  const weeks = React.useMemo(() => groupDaysByWeek(daysInMonth), [daysInMonth]);

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
    if (gridRef.current && weeks.length > 0) {
      const currentWeekIndex = weeks.findIndex(week => 
        week.days.some(day => day && isSameDay(day, today))
      );
      if (currentWeekIndex > 0) {
        const weekWidth = 224; // approx width of each week column
        const scrollPosition = Math.max(0, (currentWeekIndex - 1) * weekWidth);
        gridRef.current.scrollLeft = scrollPosition;
      }
    }
  }, [weeks, monthKey, habits.length]);

  const handleAddHabit = () => {
    if (newHabitName.trim()) {
      onCreateHabit(newHabitName.trim());
      setNewHabitName('');
      setIsAddingHabit(false);
    }
  };

  const openCreateDialog = () => {
    setIsCreateMode(true);
    setDetailHabit(null);
    setDetailName('');
    setDetailDescription('');
  };

  const handleCreateFromDialog = () => {
    if (detailName.trim()) {
      onCreateHabit(detailName.trim(), detailDescription.trim() || null);
      setIsCreateMode(false);
      setDetailName('');
      setDetailDescription('');
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

  const openDetailDialog = (habit: HabitWithLogs) => {
    setDetailHabit(habit);
    setDetailName(habit.name);
    setDetailDescription(habit.description || '');
  };

  const handleSaveDetail = () => {
    if (detailHabit && detailName.trim()) {
      onUpdateHabit(detailHabit.id, {
        name: detailName.trim(),
        description: detailDescription.trim() || null,
      });
      // Update local ref so closing doesn't flash stale data
      setDetailHabit({ ...detailHabit, name: detailName.trim(), description: detailDescription.trim() || null });
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const reordered = [...habits];
    const [moved] = reordered.splice(draggedIndex, 1);
    reordered.splice(index, 0, moved);
    onReorder?.(reordered);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    resizeStartX.current = e.clientX;
    resizeStartWidth.current = columnWidth;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const diff = e.clientX - resizeStartX.current;
      setColumnWidth(Math.max(140, Math.min(400, resizeStartWidth.current + diff)));
    };
    
    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <>
    <div className="flex flex-col w-full overflow-hidden">
      {/* Grid container */}
      <div className="flex w-full">
        {/* Fixed left column - Habit names */}
        <div className="flex-shrink-0 border-r border-border/30 bg-background z-10 relative" style={{ width: columnWidth }}>
          {/* Header */}
          <div className="h-16 border-b border-border/30 flex items-end px-3 pb-2">
            <span className="text-sm font-semibold text-foreground">Hábito</span>
          </div>
          
          {/* Habit rows */}
          {habits.map((habit, habitIndex) => {
            const adherence = getHabitAdherence(habit);
            
            return (
              <div
                key={habit.id}
                draggable
                onDragStart={() => handleDragStart(habitIndex)}
                onDragOver={(e) => handleDragOver(e, habitIndex)}
                onDrop={() => handleDrop(habitIndex)}
                onDragEnd={handleDragEnd}
                className={cn(
                  "h-14 px-1 flex items-center justify-between border-b border-border/20 group hover:bg-muted/20 transition-colors",
                  draggedIndex === habitIndex && "opacity-40",
                  dragOverIndex === habitIndex && draggedIndex !== habitIndex && "border-t-2 border-t-primary"
                )}
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
                    <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab active:cursor-grabbing flex-shrink-0 mr-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div
                      className="flex-1 min-w-0 pr-2 cursor-pointer"
                      onClick={() => openDetailDialog(habit)}
                    >
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium truncate text-foreground">{habit.name}</p>
                        {habit.description && (
                          <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress 
                          value={adherence} 
                          className="h-1.5 w-16 bg-muted" 
                        />
                        <span className="text-xs font-medium text-primary">
                          {adherence}%
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
            );
          })}

          {/* Add habit row */}
          <div className="h-14 px-3 flex items-center border-b border-border/20">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground w-full justify-start"
                onClick={openCreateDialog}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar hábito
              </Button>
          </div>

          {/* Resize handle */}
          <div
            onMouseDown={handleResizeStart}
            className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-20"
          />
        </div>

        {/* Scrollable right section - Weeks grid */}
        <div ref={gridRef} className="flex-1 overflow-x-auto">
          <div className="inline-flex">
            {weeks.map((week, weekIndex) => (
              <div 
                key={week.weekNumber} 
                className={cn(
                  "flex-shrink-0",
                  weekIndex < weeks.length - 1 && "border-r border-border/20"
                )}
              >
                {/* Week header */}
                <div className="h-16 border-b border-border/30 flex flex-col justify-end px-2 pb-1">
                  <span className="text-xs font-semibold text-muted-foreground mb-1">
                    Semana {week.weekNumber}
                  </span>
                  <div className="flex">
                    {week.days.map((day, dayIndex) => {
                      const isToday = day && isSameDay(day, today);
                      const isSunday = day && getDay(day) === 0;
                      
                      return (
                        <div
                          key={dayIndex}
                          className="w-8 flex flex-col items-center"
                        >
                          {day ? (
                            <>
                              <span
                                className={cn(
                                  'text-[10px] font-medium',
                                  isToday ? 'text-primary' : 'text-muted-foreground'
                                )}
                              >
                                {format(day, 'd')}
                              </span>
                              <span
                                className={cn(
                                  'text-[9px] uppercase',
                                  isToday ? 'text-primary font-medium' : 'text-muted-foreground/70'
                                )}
                              >
                                {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
                              </span>
                            </>
                          ) : (
                            <span className="text-[10px] text-transparent">-</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Habit day cells for this week */}
                {habits.map((habit) => (
                  <div key={habit.id} className="flex h-14 border-b border-border/20 items-center px-0.5">
                    {week.days.map((day, dayIndex) => {
                      if (!day) {
                        return <div key={dayIndex} className="w-8 h-8" />;
                      }
                      
                      const status = getLogStatus(habit, day);
                      const isToday = isSameDay(day, today);

                      return (
                        <div
                          key={day.toISOString()}
                          className="w-8 flex items-center justify-center"
                        >
                          <NeonCheckbox
                            size={24}
                            checked={status === 'done'}
                            disabled={status === 'future'}
                            onChange={() => {
                              if (status !== 'future') {
                                if (status !== 'done') {
                                  playCheck();
                                }
                                onToggleLog(habit.id, day);
                              }
                            }}
                            className={cn(
                              status === 'future' && 'opacity-30 cursor-not-allowed',
                              status === 'pending' && '[&>div>div]:border-primary/50',
                              isToday && status !== 'done' && '[&>div>div]:ring-2 [&>div>div]:ring-primary/30 [&>div>div]:ring-offset-1 [&>div>div]:ring-offset-background'
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}

                {/* Empty row for add habit alignment */}
                <div className="flex h-14 border-b border-border/20">
                  {week.days.map((day, dayIndex) => (
                    <div key={dayIndex} className="w-8" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Habit Detail Dialog */}
    <Dialog open={!!detailHabit} onOpenChange={(open) => {
      if (!open) {
        handleSaveDetail();
        setDetailHabit(null);
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Hábito</DialogTitle>
          <DialogDescription>Altere o nome e adicione uma descrição ao seu hábito.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nome</label>
            <Input
              value={detailName}
              onChange={(e) => setDetailName(e.target.value)}
              placeholder="Nome do hábito..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveDetail();
                }
              }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Descrição</label>
            <Textarea
              value={detailDescription}
              onChange={(e) => setDetailDescription(e.target.value)}
              placeholder="Passo a passo, observações..."
              rows={4}
            />
          </div>
          <Button className="w-full" onClick={() => {
            handleSaveDetail();
            setDetailHabit(null);
          }}>
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
});

export { HabitGrid };
