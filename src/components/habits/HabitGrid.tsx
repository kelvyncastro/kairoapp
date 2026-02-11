import * as React from 'react';
import { MoreHorizontal, Trash2, Edit2, Plus, GripVertical, FileText, Sun, Sunset, Moon, CalendarClock } from 'lucide-react';
import { NeonCheckbox } from '@/components/ui/animated-check-box';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
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
import { HabitWithLogs, HabitSection } from '@/types/habits';
import { format, isSameDay, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useSound } from '@/contexts/SoundContext';

// Helper function to check if HTML content is empty
const isDescriptionEmpty = (html: string | null | undefined): boolean => {
  if (!html) return true;
  const stripHtml = html.replace(/<[^>]*>/g, '').trim();
  return stripHtml === '';
};

interface HabitGridProps {
  habits: HabitWithLogs[];
  daysInMonth: Date[];
  monthKey?: string;
  showSections?: boolean;
  onToggleLog: (habitId: string, date: Date) => void;
  onCreateHabit: (name: string, description?: string | null, section?: HabitSection) => void;
  onUpdateHabit: (id: string, updates: { name?: string; description?: string | null; section?: HabitSection }) => void;
  onDeleteHabit: (id: string) => void;
  getHabitAdherence: (habit: HabitWithLogs) => number;
  getLogStatus: (habit: HabitWithLogs, date: Date) => 'done' | 'not_done' | 'pending' | 'future' | 'not_planned';
  onReorder?: (reorderedHabits: HabitWithLogs[]) => void;
}

const SECTION_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  all_day: { label: 'Dia inteiro', icon: CalendarClock, color: 'text-emerald-400' },
  morning: { label: 'Manhã', icon: Sun, color: 'text-amber-400' },
  afternoon: { label: 'Tarde', icon: Sunset, color: 'text-orange-400' },
  night: { label: 'Noite', icon: Moon, color: 'text-indigo-400' },
};

const SECTION_ORDER: (HabitSection)[] = ['morning', 'afternoon', 'night', 'all_day'];

type RenderItem = 
  | { type: 'section'; section: string }
  | { type: 'habit'; habit: HabitWithLogs; globalIndex: number };

// Group days by week
const groupDaysByWeek = (days: Date[]): { weekNumber: number; days: Date[] }[] => {
  if (days.length === 0) return [];
  
  const weeks: { weekNumber: number; days: Date[] }[] = [];
  let currentWeek: Date[] = [];
  let weekNumber = 1;
  
  const firstDay = days[0];
  const dayOfWeek = getDay(firstDay);
  const daysToFill = dayOfWeek;
  
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
  
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null as unknown as Date);
    }
    weeks.push({ weekNumber, days: currentWeek });
  }
  
  return weeks;
};

const HabitGrid = React.memo(function HabitGrid({
  habits,
  daysInMonth,
  monthKey,
  showSections = false,
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
  const [detailSection, setDetailSection] = React.useState<HabitSection>(null);
  const [isCreateMode, setIsCreateMode] = React.useState(false);
  const [columnWidth, setColumnWidth] = React.useState(() => {
    const saved = localStorage.getItem('habits-column-width');
    return saved ? Number(saved) : 224;
  });
  const isResizing = React.useRef(false);
  const resizeStartX = React.useRef(0);
  const resizeStartWidth = React.useRef(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const editInputRef = React.useRef<HTMLInputElement>(null);
  const gridRef = React.useRef<HTMLDivElement>(null);
  const today = new Date();
  const { playCheck } = useSound();

  const weeks = React.useMemo(() => groupDaysByWeek(daysInMonth), [daysInMonth]);

  // Build render items list (with section separators when enabled)
  const renderItems = React.useMemo((): RenderItem[] => {
    if (!showSections) {
      return habits.map((habit, i) => ({ type: 'habit' as const, habit, globalIndex: i }));
    }

    const items: RenderItem[] = [];
    const grouped = new Map<string, HabitWithLogs[]>();
    
    for (const s of SECTION_ORDER) {
      grouped.set(s || 'all_day', []);
    }
    
    for (const habit of habits) {
      // Habits without section go to 'all_day' when sections are enabled
      const key = habit.section || 'all_day';
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(habit);
    }

    let globalIdx = 0;
    for (const section of SECTION_ORDER) {
      const key = section || 'all_day';
      const sectionHabits = grouped.get(key) || [];
      if (sectionHabits.length === 0) continue;
      items.push({ type: 'section', section: key });
      for (const habit of sectionHabits) {
        items.push({ type: 'habit', habit, globalIndex: globalIdx++ });
      }
    }

    return items;
  }, [habits, showSections]);

  // Flat list of habits in render order (for drag operations)
  const orderedHabits = React.useMemo(() => 
    renderItems.filter((i): i is Extract<RenderItem, { type: 'habit' }> => i.type === 'habit').map(i => i.habit),
    [renderItems]
  );

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
        const weekWidth = 224;
        const scrollPosition = Math.max(0, (currentWeekIndex - 1) * weekWidth);
        gridRef.current.scrollLeft = scrollPosition;
      }
    }
  }, [weeks, monthKey, habits.length]);

  const openCreateDialog = () => {
    setIsCreateMode(true);
    setDetailHabit(null);
    setDetailName('');
    setDetailDescription('');
    setDetailSection(null);
  };

  const handleCreateFromDialog = () => {
    if (detailName.trim()) {
      const cleanDescription = isDescriptionEmpty(detailDescription) ? null : detailDescription.trim();
      onCreateHabit(detailName.trim(), cleanDescription, showSections ? detailSection : null);
      setIsCreateMode(false);
      setDetailName('');
      setDetailDescription('');
      setDetailSection(null);
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
    setDetailSection(habit.section);
  };

  const handleSaveDetail = () => {
    if (detailHabit && detailName.trim()) {
      const cleanDescription = isDescriptionEmpty(detailDescription) ? null : detailDescription.trim();
      onUpdateHabit(detailHabit.id, {
        name: detailName.trim(),
        description: cleanDescription,
        section: showSections ? detailSection : detailHabit.section,
      });
      setDetailHabit({ ...detailHabit, name: detailName.trim(), description: cleanDescription, section: detailSection });
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
    const reordered = [...orderedHabits];
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
      localStorage.setItem('habits-column-width', String(columnWidth));
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Render a section separator row for the left column
  const renderSectionSeparator = (sectionKey: string) => {
    const config = SECTION_CONFIG[sectionKey];
    if (!config) return null;
    const Icon = config.icon;
    
    return (
      <div
        key={`section-${sectionKey}`}
        className="h-8 px-3 flex items-center gap-2 bg-muted/30 border-b border-border/20"
      >
        <Icon className={cn("h-3.5 w-3.5", config.color)} />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {config.label}
        </span>
      </div>
    );
  };

  // Render a section separator row for the right grid (empty, just for alignment)
  const renderSectionSeparatorGrid = (sectionKey: string, weekDays: Date[]) => {
    return (
      <div
        key={`section-grid-${sectionKey}`}
        className="flex h-8 bg-muted/30 border-b border-border/20"
      >
        {weekDays.map((_, dayIndex) => (
          <div key={dayIndex} className="w-8" />
        ))}
      </div>
    );
  };

  // Render a habit row for the left column
  const renderHabitRow = (habit: HabitWithLogs, habitIndex: number) => {
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
                {!isDescriptionEmpty(habit.description) && (
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
          
          {/* Render items (habits + section separators) */}
          {renderItems.map((item) => {
            if (item.type === 'section') {
              return renderSectionSeparator(item.section);
            }
            return renderHabitRow(item.habit, item.globalIndex);
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

                {/* Render items for grid side */}
                {renderItems.map((item) => {
                  if (item.type === 'section') {
                    return renderSectionSeparatorGrid(item.section, week.days);
                  }
                  
                  const habit = item.habit;
                  return (
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
                  );
                })}

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

    {/* Habit Detail / Create Dialog */}
    <Dialog open={!!detailHabit || isCreateMode} onOpenChange={(open) => {
      if (!open) {
        if (isCreateMode) {
          setIsCreateMode(false);
        } else if (detailHabit) {
          handleSaveDetail();
          setDetailHabit(null);
        }
        setDetailName('');
        setDetailDescription('');
        setDetailSection(null);
      }
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isCreateMode ? 'Novo Hábito' : 'Editar Hábito'}</DialogTitle>
          <DialogDescription>
            {isCreateMode
              ? 'Dê um nome e opcionalmente uma descrição ao seu hábito.'
              : 'Altere o nome e adicione uma descrição ao seu hábito.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nome</label>
            <Input
              value={detailName}
              onChange={(e) => setDetailName(e.target.value)}
              placeholder="Nome do hábito..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (isCreateMode) handleCreateFromDialog();
                  else handleSaveDetail();
                }
              }}
            />
          </div>

          {/* Section selector - only show when sections enabled */}
          {showSections && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Período</label>
              <div className="flex gap-2">
                {(['morning', 'afternoon', 'night'] as const).map((s) => {
                  const config = SECTION_CONFIG[s];
                  const Icon = config.icon;
                  const isSelected = detailSection === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setDetailSection(isSelected ? null : s)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-medium transition-all",
                        isSelected 
                          ? "border-primary bg-primary/10 text-foreground" 
                          : "border-border/50 text-muted-foreground hover:border-border hover:bg-muted/30"
                      )}
                    >
                      <Icon className={cn("h-3.5 w-3.5", isSelected ? config.color : "text-muted-foreground")} />
                      {config.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Opcional. Clique novamente para remover.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Descrição</label>
            <RichTextEditor
              content={detailDescription}
              onChange={(html) => setDetailDescription(html)}
              placeholder="Passo a passo, observações..."
              className="min-h-[120px]"
            />
          </div>
          <Button className="w-full" onClick={() => {
            if (isCreateMode) {
              handleCreateFromDialog();
            } else {
              handleSaveDetail();
              setDetailHabit(null);
            }
          }}>
            {isCreateMode ? 'Criar' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
});

export { HabitGrid };
