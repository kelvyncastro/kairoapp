import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { NeonCheckbox } from '@/components/ui/animated-check-box';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format, getDaysInMonth, startOfMonth, addDays, getDay, isSameDay, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';

interface DemoHabit {
  id: string;
  name: string;
  completedDays: Set<string>;
}

const today = new Date();

function generateRandomCompletions(monthDate: Date): Set<string> {
  const set = new Set<string>();
  const daysCount = getDaysInMonth(monthDate);
  const start = startOfMonth(monthDate);
  const todayDay = today.getDate();
  const isSameMonth = monthDate.getMonth() === today.getMonth() && monthDate.getFullYear() === today.getFullYear();
  for (let i = 0; i < daysCount; i++) {
    const d = addDays(start, i);
    if (isSameMonth && i + 1 > todayDay) break;
    if (Math.random() > 0.35) set.add(format(d, 'yyyy-MM-dd'));
  }
  return set;
}

// Group days by week (same logic as real HabitGrid)
function groupDaysByWeek(days: Date[]) {
  if (days.length === 0) return [];
  const weeks: { weekNumber: number; days: (Date | null)[] }[] = [];
  let currentWeek: (Date | null)[] = [];
  let weekNumber = 1;
  const dayOfWeek = getDay(days[0]);
  for (let i = 0; i < dayOfWeek; i++) currentWeek.push(null);
  days.forEach(day => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push({ weekNumber, days: currentWeek });
      currentWeek = [];
      weekNumber++;
    }
  });
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push({ weekNumber, days: currentWeek });
  }
  return weeks;
}

export function DemoHabitos() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [habits, setHabits] = useState<DemoHabit[]>(() => [
    { id: 'h1', name: 'Treinar', completedDays: generateRandomCompletions(today) },
    { id: 'h2', name: 'Ler 30 min', completedDays: generateRandomCompletions(today) },
    { id: 'h3', name: 'Meditar', completedDays: generateRandomCompletions(today) },
    { id: 'h4', name: 'Beber 2L água', completedDays: generateRandomCompletions(today) },
    { id: 'h5', name: 'Dormir até 23h', completedDays: generateRandomCompletions(today) },
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const daysInMonth = useMemo(() => {
    const count = getDaysInMonth(currentDate);
    const start = startOfMonth(currentDate);
    return Array.from({ length: count }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const isSameMonthAsToday = currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  const weeks = useMemo(() => groupDaysByWeek(daysInMonth), [daysInMonth]);

  // Daily scores for chart (same as real HabitProgressChart)
  const dailyScores = useMemo(() => {
    return daysInMonth.map((day, i) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const isFuture = isSameMonthAsToday && i + 1 > today.getDate();
      if (isFuture) return { day: i + 1, score: 0 };
      const completed = habits.filter(h => h.completedDays.has(dateStr)).length;
      const score = habits.length > 0 ? Math.round((completed / habits.length) * 100) : 0;
      return { day: i + 1, score };
    }).filter(d => d.score > 0 || d.day <= today.getDate());
  }, [daysInMonth, habits, isSameMonthAsToday]);

  const weekLabels = useMemo(() => {
    const labels: number[] = [];
    for (let i = 1; i <= Math.ceil(dailyScores.length / 7); i++) {
      labels.push((i - 1) * 7 + 1);
    }
    return labels;
  }, [dailyScores.length]);

  const toggleDay = (habitId: string, day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const newSet = new Set(h.completedDays);
      if (newSet.has(dateStr)) newSet.delete(dateStr); else newSet.add(dateStr);
      return { ...h, completedDays: newSet };
    }));
  };

  const getAdherence = (habit: DemoHabit) => {
    const maxDay = isSameMonthAsToday ? today.getDate() : daysInMonth.length;
    if (maxDay === 0) return 0;
    let count = 0;
    for (let i = 0; i < maxDay; i++) {
      if (habit.completedDays.has(format(daysInMonth[i], 'yyyy-MM-dd'))) count++;
    }
    return Math.round((count / maxDay) * 100);
  };

  const addHabit = () => {
    if (!newName.trim()) return;
    setHabits(prev => [...prev, { id: `new-${Date.now()}`, name: newName.trim(), completedDays: new Set() }]);
    setNewName('');
    setIsAdding(false);
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header - matches real Habitos page */}
      <div className="flex items-center justify-between px-4 md:px-6 py-2 md:py-3 border-b border-border/30 flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          <h1 className="text-lg md:text-xl font-bold">Hábitos</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6 md:h-7 md:w-7" onClick={() => setCurrentDate(prev => subMonths(prev, 1))}>
              <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
            <span className="text-xs md:text-sm font-medium min-w-[80px] md:min-w-[100px] text-center capitalize">
              {format(currentDate, 'MMM yyyy', { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6 md:h-7 md:w-7" onClick={() => setCurrentDate(prev => addMonths(prev, 1))}>
              <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setCurrentDate(new Date())}>
          Hoje
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Progress Chart - matches real HabitProgressChart */}
        <div className="px-4 md:px-6 py-3 md:py-4">
          <h2 className="text-sm md:text-base font-bold text-foreground tracking-wider mb-3 md:mb-4">
            Progresso Geral dos Hábitos
          </h2>
          <div className="h-32 md:h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyScores} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="demoScoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} interval={6} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} tickFormatter={v => `${v}%`} width={45} ticks={[0, 25, 50, 75, 100]} />
                {weekLabels.map(day => (
                  <ReferenceLine key={day} x={day} stroke="hsl(var(--border))" strokeDasharray="3 3" strokeOpacity={0.5} />
                ))}
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.[0]) {
                      const dayNum = payload[0].payload.day;
                      const weekNum = Math.ceil(dayNum / 7);
                      return (
                        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                          <p className="text-xs text-muted-foreground">Dia {dayNum} (Semana {weekNum})</p>
                          <p className="text-sm font-semibold text-foreground">{payload[0].value}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#demoScoreGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Habits Grid - matches real HabitGrid */}
        <div className="px-4 md:px-6 py-3 md:py-4 border-t border-border/30">
          <h2 className="text-sm md:text-base font-bold text-foreground tracking-wider mb-3 md:mb-4">
            Grade de Hábitos
          </h2>
          <div className="flex flex-col w-full overflow-hidden">
            <div className="flex w-full">
              {/* Fixed left column - Habit names */}
              <div className="flex-shrink-0 w-48 md:w-56 border-r border-border/30 bg-background z-10">
                <div className="h-16 border-b border-border/30 flex items-end px-3 pb-2">
                  <span className="text-sm font-semibold text-foreground">Hábito</span>
                </div>
                {habits.map(habit => {
                  const adherence = getAdherence(habit);
                  return (
                    <div key={habit.id} className="h-14 px-3 flex items-center justify-between border-b border-border/20 group hover:bg-muted/20 transition-colors">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-sm font-medium truncate text-foreground">{habit.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={adherence} className="h-1.5 w-16 bg-muted" />
                          <span className="text-xs font-medium text-primary">{adherence}%</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-50">
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteHabit(habit.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
                <div className="h-14 px-3 flex items-center border-b border-border/20">
                  {isAdding ? (
                    <Input
                      autoFocus
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') addHabit(); if (e.key === 'Escape') setIsAdding(false); }}
                      onBlur={() => { if (!newName.trim()) setIsAdding(false); }}
                      placeholder="Nome do hábito..."
                      className="h-8 text-sm"
                    />
                  ) : (
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground w-full justify-start" onClick={() => setIsAdding(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar hábito
                    </Button>
                  )}
                </div>
              </div>

              {/* Scrollable right section - Weeks grid */}
              <div className="flex-1 overflow-x-auto">
                <div className="inline-flex">
                  {weeks.map((week, weekIndex) => (
                    <div key={week.weekNumber} className={cn("flex-shrink-0", weekIndex < weeks.length - 1 && "border-r border-border/20")}>
                      <div className="h-16 border-b border-border/30 flex flex-col justify-end px-2 pb-1">
                        <span className="text-xs font-semibold text-muted-foreground mb-1">Semana {week.weekNumber}</span>
                        <div className="flex">
                          {week.days.map((day, di) => {
                            const isToday = day && isSameDay(day, today);
                            return (
                              <div key={di} className="w-8 flex flex-col items-center">
                                {day ? (
                                  <>
                                    <span className={cn('text-[10px] font-medium', isToday ? 'text-primary' : 'text-muted-foreground')}>{format(day, 'd')}</span>
                                    <span className={cn('text-[9px] uppercase', isToday ? 'text-primary font-medium' : 'text-muted-foreground/70')}>{format(day, 'EEE', { locale: ptBR }).slice(0, 3)}</span>
                                  </>
                                ) : <span className="text-[10px] text-transparent">-</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      {habits.map(habit => (
                        <div key={habit.id} className="flex h-14 border-b border-border/20 items-center px-0.5">
                          {week.days.map((day, di) => {
                            if (!day) return <div key={di} className="w-8 h-8" />;
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const isDone = habit.completedDays.has(dateStr);
                            const isFuture = isSameMonthAsToday && day > today;
                            const isToday = isSameDay(day, today);
                            return (
                              <div key={dateStr} className="w-8 flex items-center justify-center">
                                <NeonCheckbox
                                  size={24}
                                  checked={isDone}
                                  disabled={isFuture}
                                  onChange={() => !isFuture && toggleDay(habit.id, day)}
                                  className={cn(
                                    isFuture && 'opacity-30 cursor-not-allowed',
                                    isToday && !isDone && '[&>div>div]:ring-2 [&>div>div]:ring-primary/30 [&>div>div]:ring-offset-1 [&>div>div]:ring-offset-background'
                                  )}
                                />
                              </div>
                            );
                          })}
                        </div>
                      ))}
                      <div className="flex h-14 border-b border-border/20">
                        {week.days.map((_, di) => <div key={di} className="w-8" />)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
