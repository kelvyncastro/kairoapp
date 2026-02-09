import { useState } from 'react';
import { Plus, Target, TrendingUp, DollarSign, Dumbbell, Heart, User, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

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

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 flex-shrink-0">
        <div>
          <h2 className="text-base font-bold">Metas</h2>
          <p className="text-xs text-muted-foreground hidden sm:block">Defina objetivos e acompanhe seu progresso</p>
        </div>
        <Button size="sm" className="h-8">
          <Plus className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Nova Meta</span>
        </Button>
      </div>

      {/* Category filters */}
      <div className="flex gap-1.5 px-4 py-2 border-b border-border/30 overflow-x-auto flex-shrink-0">
        <Button variant={activeCategory === 'ALL' ? 'default' : 'outline'} size="sm" className="h-7 text-xs" onClick={() => setActiveCategory('ALL')}>
          Todas
        </Button>
        {CATEGORIES.map(cat => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs gap-1.5 shrink-0"
            onClick={() => setActiveCategory(cat.id)}
          >
            <cat.icon className="h-3 w-3" style={{ color: activeCategory === cat.id ? undefined : cat.color }} />
            <span className="hidden sm:inline">{cat.name}</span>
          </Button>
        ))}
      </div>

      {/* Goals grid */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="grid gap-3 md:grid-cols-2">
          {filteredGoals.map(goal => {
            const cat = CATEGORIES.find(c => c.id === goal.categoryId)!;
            const percent = Math.min(Math.round((goal.currentValue / goal.targetValue) * 100), 100);
            const isExpanded = expandedGoal === goal.id;

            return (
              <div
                key={goal.id}
                className="rounded-xl border border-border/50 bg-card/50 p-4 hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
              >
                {/* Category badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                      <cat.icon className="h-3.5 w-3.5" style={{ color: cat.color }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: cat.color }}>{cat.name}</span>
                  </div>
                  {goal.status === 'COMPLETED' && (
                    <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">✓ Concluída</span>
                  )}
                </div>

                <h3 className="font-semibold text-sm mb-1">{goal.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{goal.description}</p>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{goal.currentValue} / {goal.targetValue} {goal.unitLabel}</span>
                    <span className="font-semibold" style={{ color: cat.color }}>{percent}%</span>
                  </div>
                  <Progress value={percent} className="h-2" indicatorColor={cat.color} />
                </div>

                {/* Expanded: chart + add progress */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <div className="h-24 mb-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={goal.history} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`grad-${goal.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={cat.color} stopOpacity={0.4} />
                              <stop offset="100%" stopColor={cat.color} stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis hide domain={[0, goal.targetValue]} />
                          <Area type="monotone" dataKey="value" stroke={cat.color} strokeWidth={2} fill={`url(#grad-${goal.id})`} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    {goal.status !== 'COMPLETED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-7 text-xs"
                        onClick={(e) => { e.stopPropagation(); addProgress(goal.id, Math.ceil(goal.targetValue * 0.1)); }}
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
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
