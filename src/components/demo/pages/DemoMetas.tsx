import { useState, useMemo } from 'react';
import {
  Plus, Target, TrendingUp, DollarSign, Dumbbell, Heart, User, MoreHorizontal,
  Star, Trophy, Rocket, Lightbulb, Book, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { differenceInDays, parseISO } from 'date-fns';

interface DemoGoal {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  currentValue: number;
  targetValue: number;
  unitLabel: string;
  status: 'ACTIVE' | 'COMPLETED';
  endDate: string;
  history: { index: number; value: number; date: string }[];
}

const CATEGORIES = [
  { id: 'FIN', name: 'Financeira', icon: DollarSign, color: '#22c55e' },
  { id: 'FIT', name: 'Fitness', icon: Dumbbell, color: '#f59e0b' },
  { id: 'SAU', name: 'Saúde', icon: Heart, color: '#ef4444' },
  { id: 'PES', name: 'Pessoal', icon: User, color: '#8b5cf6' },
];

const DEMO_GOALS: DemoGoal[] = [
  {
    id: 'g1', title: 'Economizar R$10.000', description: 'Reserva de emergência',
    categoryId: 'FIN', currentValue: 6500, targetValue: 10000, unitLabel: 'R$',
    status: 'ACTIVE', endDate: '2026-12-31',
    history: [{ index: 1, value: 2000, date: '01/01' }, { index: 2, value: 3500, date: '15/01' }, { index: 3, value: 5000, date: '01/02' }, { index: 4, value: 6500, date: '07/02' }],
  },
  {
    id: 'g2', title: 'Correr 100km', description: 'Corrida acumulada no mês',
    categoryId: 'FIT', currentValue: 72, targetValue: 100, unitLabel: 'km',
    status: 'ACTIVE', endDate: '2026-02-28',
    history: [{ index: 1, value: 15, date: '05/02' }, { index: 2, value: 35, date: '10/02' }, { index: 3, value: 55, date: '15/02' }, { index: 4, value: 72, date: '20/02' }],
  },
  {
    id: 'g3', title: 'Ler 12 livros', description: 'Um livro por mês',
    categoryId: 'PES', currentValue: 3, targetValue: 12, unitLabel: 'livros',
    status: 'ACTIVE', endDate: '2026-12-31',
    history: [{ index: 1, value: 1, date: '15/01' }, { index: 2, value: 2, date: '30/01' }, { index: 3, value: 3, date: '08/02' }],
  },
  {
    id: 'g4', title: 'Perder 5kg', description: 'Meta de peso saudável',
    categoryId: 'SAU', currentValue: 3.2, targetValue: 5, unitLabel: 'kg',
    status: 'ACTIVE', endDate: '2026-06-30',
    history: [{ index: 1, value: 0.8, date: '10/01' }, { index: 2, value: 1.5, date: '20/01' }, { index: 3, value: 2.3, date: '01/02' }, { index: 4, value: 3.2, date: '09/02' }],
  },
  {
    id: 'g5', title: 'Investir R$5.000', description: 'Renda variável',
    categoryId: 'FIN', currentValue: 5000, targetValue: 5000, unitLabel: 'R$',
    status: 'COMPLETED', endDate: '2026-01-31',
    history: [{ index: 1, value: 2000, date: '05/01' }, { index: 2, value: 3500, date: '15/01' }, { index: 3, value: 5000, date: '25/01' }],
  },
];

export function DemoMetas() {
  const [goals, setGoals] = useState<DemoGoal[]>(DEMO_GOALS);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  const filteredGoals = activeCategory === 'ALL'
    ? goals
    : goals.filter(g => g.categoryId === activeCategory);

  const addProgress = (goalId: string, amount: number) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== goalId) return g;
      const newVal = Math.min(g.currentValue + amount, g.targetValue);
      return {
        ...g,
        currentValue: newVal,
        status: newVal >= g.targetValue ? 'COMPLETED' : 'ACTIVE',
        history: [...g.history, { index: g.history.length + 1, value: newVal, date: 'Agora' }],
      };
    }));
  };

  // Stats
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.status === 'COMPLETED').length;
  const activeGoals = goals.filter(g => g.status === 'ACTIVE').length;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header - matches real Metas page */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border/30 flex-shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Metas</h1>
          <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Defina objetivos e acompanhe seu progresso</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Settings className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Gerenciar Setores</span>
          </Button>
          <Button size="sm" className="h-8 gap-1.5">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nova Meta</span>
          </Button>
        </div>
      </div>

      {/* Category filters - matches real Metas */}
      <div className="flex gap-2 px-4 md:px-6 py-3 border-b border-border/30 overflow-x-auto flex-shrink-0">
        <Button variant={activeCategory === 'ALL' ? 'default' : 'outline'} size="sm" className="h-8 text-xs shrink-0" onClick={() => setActiveCategory('ALL')}>
          Todas ({totalGoals})
        </Button>
        {CATEGORIES.map(cat => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            className="h-8 text-xs gap-1.5 shrink-0"
            onClick={() => setActiveCategory(cat.id)}
          >
            <cat.icon className="h-3.5 w-3.5" style={{ color: activeCategory === cat.id ? undefined : cat.color }} />
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Goals grid */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        <div className="grid gap-4 md:grid-cols-2">
          {filteredGoals.map(goal => {
            const cat = CATEGORIES.find(c => c.id === goal.categoryId)!;
            const percent = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
            const isExpanded = expandedGoal === goal.id;
            const daysLeft = differenceInDays(parseISO(goal.endDate), new Date());

            return (
              <div
                key={goal.id}
                className="rounded-xl border border-border/50 bg-card/50 p-4 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
              >
                {/* Category badge + actions */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                      <cat.icon className="h-4 w-4" style={{ color: cat.color }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: cat.color }}>{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {goal.status === 'COMPLETED' && (
                      <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full font-medium">✓ Concluída</span>
                    )}
                    {goal.status === 'ACTIVE' && daysLeft > 0 && (
                      <span className="text-[10px] text-muted-foreground">{daysLeft} dias restantes</span>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36 bg-popover">
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <h3 className="font-semibold text-sm mb-1">{goal.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{goal.description}</p>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{goal.currentValue} / {goal.targetValue} {goal.unitLabel}</span>
                    <span className="font-semibold" style={{ color: cat.color }}>{percent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%`, backgroundColor: cat.color }}
                    />
                  </div>
                </div>

                {/* Expanded: chart + add progress */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border/30">
                    <div className="h-28 mb-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={goal.history} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`grad-${goal.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={cat.color} stopOpacity={0.4} />
                              <stop offset="100%" stopColor={cat.color} stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis hide domain={[0, goal.targetValue]} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload?.[0]) {
                                return (
                                  <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                                    <p className="text-xs text-muted-foreground">{payload[0].payload.date}</p>
                                    <p className="text-sm font-semibold">{payload[0].value} {goal.unitLabel}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area type="monotone" dataKey="value" stroke={cat.color} strokeWidth={2} fill={`url(#grad-${goal.id})`} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    {goal.status !== 'COMPLETED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-8 text-xs"
                        onClick={(e) => { e.stopPropagation(); addProgress(goal.id, Math.ceil(goal.targetValue * 0.1)); }}
                      >
                        <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                        Registrar Progresso (+10%)
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
