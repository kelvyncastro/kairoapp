import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { NeonCheckbox } from '@/components/ui/animated-check-box';
import { cn } from '@/lib/utils';
import { format, getDaysInMonth, startOfMonth, addDays, getDay, isSameDay, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface DemoHabit {
  id: string;
  name: string;
  completedDays: Set<string>; // 'yyyy-MM-dd'
}

const today = new Date();
const todayStr = format(today, 'yyyy-MM-dd');

function generateRandomCompletions(monthDate: Date): Set<string> {
  const set = new Set<string>();
  const daysCount = getDaysInMonth(monthDate);
  const start = startOfMonth(monthDate);
  const todayDay = today.getDate();
  const isSameMonth = monthDate.getMonth() === today.getMonth() && monthDate.getFullYear() === today.getFullYear();
  
  for (let i = 0; i < daysCount; i++) {
    const d = addDays(start, i);
    if (isSameMonth && i + 1 > todayDay) break;
    if (Math.random() > 0.35) {
      set.add(format(d, 'yyyy-MM-dd'));
    }
  }
  return set;
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

  // Group days by week
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    let currentWeek: (Date | null)[] = [];
    const firstDow = getDay(daysInMonth[0]);
    for (let i = 0; i < firstDow; i++) currentWeek.push(null);
    daysInMonth.forEach(day => {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        result.push(currentWeek as Date[]);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      result.push(currentWeek as Date[]);
    }
    return result;
  }, [daysInMonth]);

  // Daily scores for chart
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

  const toggleDay = (habitId: string, day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const newSet = new Set(h.completedDays);
      if (newSet.has(dateStr)) newSet.delete(dateStr);
      else newSet.add(dateStr);
      return { ...h, completedDays: newSet };
    }));
  };

  const getAdherence = (habit: DemoHabit) => {
    const maxDay = isSameMonthAsToday ? today.getDate() : daysInMonth.length;
    if (maxDay === 0) return 0;
    let count = 0;
    for (let i = 0; i < maxDay; i++) {
      const dateStr = format(daysInMonth[i], 'yyyy-MM-dd');
      if (habit.completedDays.has(dateStr)) count++;
    }
    return Math.round((count / maxDay) * 100);
  };

  const addHabit = () => {
    if (!newName.trim()) return;
    setHabits(prev => [...prev, { id: `new-${Date.now()}`, name: newName.trim(), completedDays: new Set() }]);
    setNewName('');
    setIsAdding(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold">Hábitos</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentDate(prev => subMonths(prev, 1))}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-xs font-medium min-w-[80px] text-center capitalize">
              {format(currentDate, 'MMM yyyy', { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentDate(prev => addMonths(prev, 1))}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setCurrentDate(new Date())}>
          Hoje
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Progress Chart */}
        <div className="px-4 py-3">
          <h3 className="text-sm font-bold mb-2">Progresso Geral dos Hábitos</h3>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyScores} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="demoScoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} interval={6} />
                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} tickFormatter={v => `${v}%`} width={35} ticks={[0, 50, 100]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.[0]) {
                      return (
                        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                          <p className="text-xs text-muted-foreground">Dia {payload[0].payload.day}</p>
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

        {/* Grid */}
        <div className="px-4 py-3 border-t border-border/30">
          <h3 className="text-sm font-bold mb-2">Grade de Hábitos</h3>
          <div className="flex w-full overflow-hidden">
            {/* Left: habit names */}
            <div className="flex-shrink-0 w-36 border-r border-border/30">
              <div className="h-12 border-b border-border/30 flex items-end px-2 pb-1">
                <span className="text-xs font-semibold">Hábito</span>
              </div>
              {habits.map(habit => (
                <div key={habit.id} className="h-10 px-2 flex items-center justify-between border-b border-border/20">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{habit.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Progress value={getAdherence(habit)} className="h-1 w-12 bg-muted" />
                      <span className="text-[10px] font-medium text-primary">{getAdherence(habit)}%</span>
                    </div>
                  </div>
                </div>
              ))}
              {/* Add habit */}
              <div className="h-10 px-2 flex items-center">
                {isAdding ? (
                  <Input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addHabit(); if (e.key === 'Escape') setIsAdding(false); }}
                    onBlur={() => { if (!newName.trim()) setIsAdding(false); }}
                    placeholder="Hábito..."
                    className="h-7 text-xs"
                  />
                ) : (
                  <button onClick={() => setIsAdding(true)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <Plus className="h-3 w-3" /> Adicionar
                  </button>
                )}
              </div>
            </div>

            {/* Right: checkboxes scrollable */}
            <div className="flex-1 overflow-x-auto">
              <div className="inline-flex">
                {weeks.map((week, wi) => (
                  <div key={wi} className={cn("flex-shrink-0", wi < weeks.length - 1 && "border-r border-border/20")}>
                    <div className="h-12 border-b border-border/30 flex flex-col justify-end px-1 pb-0.5">
                      <span className="text-[10px] font-semibold text-muted-foreground mb-0.5">Sem {wi + 1}</span>
                      <div className="flex">
                        {week.map((day, di) => (
                          <div key={di} className="w-7 flex flex-col items-center">
                            {day ? (
                              <>
                                <span className={cn('text-[9px]', isSameDay(day, today) ? 'text-primary font-bold' : 'text-muted-foreground')}>
                                  {format(day, 'd')}
                                </span>
                                <span className={cn('text-[8px] uppercase', isSameDay(day, today) ? 'text-primary' : 'text-muted-foreground/70')}>
                                  {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
                                </span>
                              </>
                            ) : <span className="text-[9px] text-transparent">-</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                    {habits.map(habit => (
                      <div key={habit.id} className="flex h-10 border-b border-border/20 items-center">
                        {week.map((day, di) => {
                          if (!day) return <div key={di} className="w-7 h-7" />;
                          const dateStr = format(day, 'yyyy-MM-dd');
                          const isDone = habit.completedDays.has(dateStr);
                          const isFuture = isSameMonthAsToday && day > today;
                          return (
                            <div key={dateStr} className="w-7 flex items-center justify-center">
                              <NeonCheckbox
                                size={20}
                                checked={isDone}
                                disabled={isFuture}
                                onChange={() => !isFuture && toggleDay(habit.id, day)}
                                className={cn(isFuture && 'opacity-30 cursor-not-allowed')}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    <div className="flex h-10 border-b border-border/20">
                      {week.map((_, di) => <div key={di} className="w-7" />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
