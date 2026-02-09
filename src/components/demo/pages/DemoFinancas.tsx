import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, PiggyBank, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

interface DemoTransaction {
  id: string;
  name: string;
  value: number;
  sector: string;
  sectorColor: string;
  sectorIcon: string;
  status: string;
  date: string;
}

const SECTORS = [
  { name: 'Mercado', color: '#22c55e', icon: '🛒' },
  { name: 'Transporte', color: '#3b82f6', icon: '🚗' },
  { name: 'Alimentação', color: '#f97316', icon: '🍽️' },
  { name: 'Lazer', color: '#a855f7', icon: '🎮' },
  { name: 'Educação', color: '#0ea5e9', icon: '📚' },
  { name: 'Cartão', color: '#6b7280', icon: '💳' },
  { name: 'Salário', color: '#10b981', icon: '💼' },
];

const initialTransactions: DemoTransaction[] = [
  { id: 't1', name: 'Salário', value: 7000, sector: 'Salário', sectorColor: '#10b981', sectorIcon: '💼', status: 'Recebido', date: '05/02' },
  { id: 't2', name: 'Freelance', value: 1500, sector: 'Salário', sectorColor: '#10b981', sectorIcon: '💼', status: 'Recebido', date: '10/02' },
  { id: 't3', name: 'Supermercado Extra', value: -450, sector: 'Mercado', sectorColor: '#22c55e', sectorIcon: '🛒', status: 'Pago', date: '03/02' },
  { id: 't4', name: 'Uber', value: -85, sector: 'Transporte', sectorColor: '#3b82f6', sectorIcon: '🚗', status: 'Pago', date: '04/02' },
  { id: 't5', name: 'iFood', value: -120, sector: 'Alimentação', sectorColor: '#f97316', sectorIcon: '🍽️', status: 'Pago', date: '06/02' },
  { id: 't6', name: 'Netflix + Spotify', value: -65, sector: 'Lazer', sectorColor: '#a855f7', sectorIcon: '🎮', status: 'Pago', date: '01/02' },
  { id: 't7', name: 'Curso React', value: -200, sector: 'Educação', sectorColor: '#0ea5e9', sectorIcon: '📚', status: 'Pago', date: '08/02' },
  { id: 't8', name: 'Gasolina', value: -280, sector: 'Transporte', sectorColor: '#3b82f6', sectorIcon: '🚗', status: 'Pago', date: '07/02' },
  { id: 't9', name: 'Mercado Atacadão', value: -320, sector: 'Mercado', sectorColor: '#22c55e', sectorIcon: '🛒', status: 'Pago', date: '12/02' },
  { id: 't10', name: 'Restaurante', value: -95, sector: 'Alimentação', sectorColor: '#f97316', sectorIcon: '🍽️', status: 'Pago', date: '09/02' },
  { id: 't11', name: 'Cartão de crédito', value: -850, sector: 'Cartão', sectorColor: '#6b7280', sectorIcon: '💳', status: 'A pagar', date: '15/02' },
  { id: 't12', name: 'Aluguel', value: -1500, sector: 'Cartão', sectorColor: '#6b7280', sectorIcon: '💳', status: 'Pago', date: '05/02' },
];

export function DemoFinancas() {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  const income = transactions.filter(t => t.value > 0).reduce((s, t) => s + t.value, 0);
  const expenses = transactions.filter(t => t.value < 0).reduce((s, t) => s + t.value, 0);
  const balance = income + expenses;

  // Expenses by sector for pie chart
  const expensesBySector = useMemo(() => {
    const map = new Map<string, { name: string; total: number; color: string }>();
    transactions.filter(t => t.value < 0).forEach(t => {
      const existing = map.get(t.sector) || { name: t.sector, total: 0, color: t.sectorColor };
      existing.total += Math.abs(t.value);
      map.set(t.sector, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [transactions]);

  // Daily expenses for bar chart
  const dailyData = useMemo(() => {
    const days = Array.from({ length: 28 }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      const total = transactions.filter(t => t.value < 0 && t.date.startsWith(day)).reduce((s, t) => s + Math.abs(t.value), 0);
      return { day: String(i + 1), total };
    });
    return days.filter(d => d.total > 0);
  }, [transactions]);

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const statusColors: Record<string, string> = {
    'Pago': 'text-success',
    'Recebido': 'text-blue-500',
    'A pagar': 'text-amber-500',
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 flex-shrink-0">
        <div>
          <h2 className="text-base font-bold">Finanças</h2>
          <p className="text-xs text-muted-foreground hidden sm:block">Controle é liberdade.</p>
        </div>
        <Button size="sm" className="h-8">
          <Plus className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Nova Transação</span>
        </Button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Month + Stats */}
        <div className="flex-shrink-0 px-4 py-2">
          <div className="flex items-center justify-between rounded-lg border border-border/30 p-2 mb-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-bold uppercase tracking-wider text-xs">
              {format(currentMonth, 'MMM yyyy', { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border/30 p-2">
              <div className="flex items-center gap-1 mb-0.5">
                <TrendingUp className="h-3 w-3 text-success" />
                <span className="text-[10px] text-muted-foreground">Ganhos</span>
              </div>
              <p className="text-xs font-bold text-success">R$ {income.toLocaleString('pt-BR')}</p>
            </div>
            <div className="rounded-lg border border-border/30 p-2">
              <div className="flex items-center gap-1 mb-0.5">
                <TrendingDown className="h-3 w-3 text-destructive" />
                <span className="text-[10px] text-muted-foreground">Gastos</span>
              </div>
              <p className="text-xs font-bold text-destructive">R$ {Math.abs(expenses).toLocaleString('pt-BR')}</p>
            </div>
            <div className="rounded-lg border border-border/30 p-2">
              <div className="flex items-center gap-1 mb-0.5">
                <PiggyBank className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Sobra</span>
              </div>
              <p className={cn("text-xs font-bold", balance >= 0 ? "text-success" : "text-destructive")}>
                R$ {balance.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-1 flex flex-col overflow-hidden px-4 pb-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-2 h-9 bg-muted/50 p-0.5 rounded-lg mb-2 flex-shrink-0">
              <TabsTrigger value="overview" className="text-xs rounded-md">Visão Geral</TabsTrigger>
              <TabsTrigger value="transactions" className="text-xs rounded-md">Transações</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="flex-1 overflow-y-auto mt-0 space-y-3">
              {/* Pie chart */}
              <div className="rounded-lg border border-border/30 p-3">
                <h3 className="text-xs font-semibold mb-2">Gastos por Categoria</h3>
                <div className="flex items-center gap-4">
                  <div className="w-28 h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expensesBySector} dataKey="total" cx="50%" cy="50%" outerRadius={50} innerRadius={25}>
                          {expensesBySector.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {expensesBySector.slice(0, 5).map(s => (
                      <div key={s.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                          <span>{s.name}</span>
                        </div>
                        <span className="font-medium">R$ {s.total.toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bar chart */}
              <div className="rounded-lg border border-border/30 p-3">
                <h3 className="text-xs font-semibold mb-2">Gastos Diários</h3>
                <div className="h-28">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis hide />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload?.[0]) {
                            return (
                              <div className="bg-popover border border-border rounded-lg px-2 py-1.5 shadow-lg">
                                <p className="text-[10px] text-muted-foreground">Dia {payload[0].payload.day}</p>
                                <p className="text-xs font-semibold">R$ {Number(payload[0].value).toLocaleString('pt-BR')}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="total" radius={[3, 3, 0, 0]} fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="flex-1 overflow-y-auto mt-0">
              <div className="space-y-1">
                {transactions.map(t => (
                  <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/20 transition-colors group">
                    <span className="text-lg">{t.sectorIcon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-[10px] text-muted-foreground">{t.sector} • {t.date}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-sm font-bold", t.value > 0 ? "text-success" : "text-foreground")}>
                        {t.value > 0 ? '+' : ''}R$ {Math.abs(t.value).toLocaleString('pt-BR')}
                      </p>
                      <p className={cn("text-[10px]", statusColors[t.status] || 'text-muted-foreground')}>{t.status}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => deleteTransaction(t.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
