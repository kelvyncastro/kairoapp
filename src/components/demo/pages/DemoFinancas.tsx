import { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, PiggyBank, Plus, Trash2, Edit2,
  Tags, ChartLine, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { FolderIconRenderer } from '@/components/tasks/FolderIconRenderer';

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

interface DemoSector {
  name: string;
  color: string;
  icon: string;
}

const SECTORS: DemoSector[] = [
  { name: 'Mercado', color: '#22c55e', icon: 'shopping-bag' },
  { name: 'Transporte', color: '#3b82f6', icon: 'car' },
  { name: 'Alimentação', color: '#f97316', icon: 'utensils' },
  { name: 'Lazer', color: '#a855f7', icon: 'gamepad' },
  { name: 'Educação', color: '#0ea5e9', icon: 'graduation-cap' },
  { name: 'Cartão', color: '#6b7280', icon: 'credit-card' },
  { name: 'Investimentos', color: '#10b981', icon: 'chart-line' },
  { name: 'Vestuário', color: '#ec4899', icon: 'shopping-bag' },
];

const initialTransactions: DemoTransaction[] = [
  { id: 't1', name: 'Salário', value: 7000, sector: 'Salário', sectorColor: '#10b981', sectorIcon: 'wallet', status: 'received', date: '05/02' },
  { id: 't2', name: 'Freelance', value: 1500, sector: 'Salário', sectorColor: '#10b981', sectorIcon: 'wallet', status: 'received', date: '10/02' },
  { id: 't3', name: 'Supermercado Extra', value: -450, sector: 'Mercado', sectorColor: '#22c55e', sectorIcon: 'shopping-bag', status: 'paid', date: '03/02' },
  { id: 't4', name: 'Uber', value: -85, sector: 'Transporte', sectorColor: '#3b82f6', sectorIcon: 'car', status: 'paid', date: '04/02' },
  { id: 't5', name: 'iFood', value: -120, sector: 'Alimentação', sectorColor: '#f97316', sectorIcon: 'utensils', status: 'paid', date: '06/02' },
  { id: 't6', name: 'Netflix + Spotify', value: -65, sector: 'Lazer', sectorColor: '#a855f7', sectorIcon: 'gamepad', status: 'paid', date: '01/02' },
  { id: 't7', name: 'Curso React', value: -200, sector: 'Educação', sectorColor: '#0ea5e9', sectorIcon: 'graduation-cap', status: 'paid', date: '08/02' },
  { id: 't8', name: 'Gasolina', value: -280, sector: 'Transporte', sectorColor: '#3b82f6', sectorIcon: 'car', status: 'paid', date: '07/02' },
  { id: 't9', name: 'Mercado Atacadão', value: -320, sector: 'Mercado', sectorColor: '#22c55e', sectorIcon: 'shopping-bag', status: 'paid', date: '12/02' },
  { id: 't10', name: 'Restaurante', value: -95, sector: 'Alimentação', sectorColor: '#f97316', sectorIcon: 'utensils', status: 'paid', date: '09/02' },
  { id: 't11', name: 'Cartão de crédito', value: -850, sector: 'Cartão', sectorColor: '#6b7280', sectorIcon: 'credit-card', status: 'pending', date: '15/02' },
  { id: 't12', name: 'Aluguel', value: -1500, sector: 'Cartão', sectorColor: '#6b7280', sectorIcon: 'credit-card', status: 'paid', date: '05/02' },
];

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'paid': return 'Pago';
    case 'pending': return 'A pagar';
    case 'to_receive': return 'A receber';
    case 'received': return 'Recebido';
    default: return 'Pago';
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid': return 'text-success';
    case 'received': return 'text-blue-500';
    case 'pending': return 'text-amber-500';
    case 'to_receive': return 'text-amber-500';
    default: return 'text-muted-foreground';
  }
};

const getStatusBg = (status: string) => {
  switch (status) {
    case 'paid': return 'bg-success/10 text-success border-success/20';
    case 'received': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'pending': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    default: return 'bg-muted text-muted-foreground';
  }
};

export function DemoFinancas() {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionFilter, setTransactionFilter] = useState('all');

  const income = transactions.filter(t => t.value > 0).reduce((s, t) => s + t.value, 0);
  const expenses = transactions.filter(t => t.value < 0).reduce((s, t) => s + t.value, 0);
  const balance = income + expenses;

  const expensesBySector = useMemo(() => {
    const map = new Map<string, { name: string; total: number; color: string }>();
    transactions.filter(t => t.value < 0).forEach(t => {
      const existing = map.get(t.sector) || { name: t.sector, total: 0, color: t.sectorColor };
      existing.total += Math.abs(t.value);
      map.set(t.sector, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [transactions]);

  const totalExpenses = Math.abs(expenses);

  const dailyData = useMemo(() => {
    const days = Array.from({ length: 28 }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      const total = transactions.filter(t => t.value < 0 && t.date.startsWith(day)).reduce((s, t) => s + Math.abs(t.value), 0);
      return { day: String(i + 1), total };
    });
    return days.filter(d => d.total > 0);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let result = transactions;
    const effectiveStatus = (t: DemoTransaction) => t.value > 0 ? 'received' : t.status;
    if (transactionFilter !== 'all') {
      result = result.filter(t => effectiveStatus(t) === transactionFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.name.toLowerCase().includes(q) || t.sector.toLowerCase().includes(q));
    }
    return result;
  }, [transactions, transactionFilter, searchQuery]);

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const filterButtons = [
    { id: 'all', label: 'Todas' },
    { id: 'paid', label: 'Pagas' },
    { id: 'received', label: 'Recebidas' },
    { id: 'pending', label: 'Pendentes' },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header - matches real Financas */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border/30 flex-shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Finanças</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">Controle é liberdade.</p>
        </div>
        <Button size="sm" className="h-8 gap-1.5">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nova Transação</span>
        </Button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Month Navigation + Stats */}
        <div className="flex-shrink-0 px-4 md:px-6 py-3">
          <div className="flex items-center justify-between rounded-xl border border-border/30 p-2.5 mb-3">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-bold uppercase tracking-wider text-xs">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border/30 p-3 bg-card/50">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-success" />
                <span className="text-xs text-muted-foreground">Ganhos</span>
              </div>
              <p className="text-sm font-bold text-success">R$ {income.toLocaleString('pt-BR')}</p>
            </div>
            <div className="rounded-xl border border-border/30 p-3 bg-card/50">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                <span className="text-xs text-muted-foreground">Gastos</span>
              </div>
              <p className="text-sm font-bold text-destructive">R$ {Math.abs(expenses).toLocaleString('pt-BR')}</p>
            </div>
            <div className="rounded-xl border border-border/30 p-3 bg-card/50">
              <div className="flex items-center gap-1.5 mb-1">
                <PiggyBank className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Sobra</span>
              </div>
              <p className={cn("text-sm font-bold", balance >= 0 ? "text-success" : "text-destructive")}>
                R$ {balance.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs - matches real Financas (4 tabs) */}
        <div className="flex-1 flex flex-col overflow-hidden px-4 md:px-6 pb-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-4 h-10 bg-muted/50 p-0.5 rounded-xl mb-3 flex-shrink-0">
              <TabsTrigger value="overview" className="text-xs rounded-lg gap-1.5">
                <ChartLine className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="text-xs rounded-lg gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Transações</span>
              </TabsTrigger>
              <TabsTrigger value="sectors" className="text-xs rounded-lg gap-1.5">
                <Tags className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Setores</span>
              </TabsTrigger>
              <TabsTrigger value="investments" className="text-xs rounded-lg gap-1.5">
                <PiggyBank className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Investimentos</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="flex-1 overflow-y-auto mt-0 space-y-4">
              {/* Pie chart */}
              <div className="rounded-xl border border-border/30 p-4 bg-card/50">
                <h3 className="text-sm font-semibold mb-3">Gastos por Categoria</h3>
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expensesBySector} dataKey="total" cx="50%" cy="50%" outerRadius={55} innerRadius={30}>
                          {expensesBySector.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {expensesBySector.map(s => {
                      const pct = totalExpenses > 0 ? Math.round((s.total / totalExpenses) * 100) : 0;
                      return (
                        <div key={s.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                            <span className="font-medium">{s.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{pct}%</span>
                            <span className="font-semibold">R$ {s.total.toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bar chart */}
              <div className="rounded-xl border border-border/30 p-4 bg-card/50">
                <h3 className="text-sm font-semibold mb-3">Gastos Diários</h3>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis hide />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload?.[0]) {
                            return (
                              <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                                <p className="text-xs text-muted-foreground">Dia {payload[0].payload.day}</p>
                                <p className="text-sm font-semibold">R$ {Number(payload[0].value).toLocaleString('pt-BR')}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="flex-1 overflow-y-auto mt-0">
              {/* Filter buttons */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {filterButtons.map(btn => (
                  <Button
                    key={btn.id}
                    variant={transactionFilter === btn.id ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setTransactionFilter(btn.id)}
                  >
                    {btn.label}
                  </Button>
                ))}
                <div className="flex-1" />
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar..."
                    className="h-7 text-xs pl-7 w-32"
                  />
                </div>
              </div>

              <div className="space-y-1">
                {filteredTransactions.map(t => {
                  const effectiveStatus = t.value > 0 ? 'received' : t.status;
                  return (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/20 transition-colors group border border-transparent hover:border-border/20">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${t.sectorColor}15` }}>
                        <FolderIconRenderer icon={t.sectorIcon} color={t.sectorColor} className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.name}</p>
                        <p className="text-[10px] text-muted-foreground">{t.sector} • {t.date}</p>
                      </div>
                      <div className="text-right">
                        <p className={cn("text-sm font-bold", t.value > 0 ? "text-success" : "text-foreground")}>
                          {t.value > 0 ? '+' : ''}R$ {Math.abs(t.value).toLocaleString('pt-BR')}
                        </p>
                        <Badge variant="outline" className={cn("text-[10px] h-4 px-1.5", getStatusBg(effectiveStatus))}>
                          {getStatusLabel(effectiveStatus)}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => deleteTransaction(t.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Sectors Tab */}
            <TabsContent value="sectors" className="flex-1 overflow-y-auto mt-0">
              <div className="grid grid-cols-2 gap-3">
                {SECTORS.map(sector => {
                  const sectorTotal = transactions
                    .filter(t => t.sector === sector.name && t.value < 0)
                    .reduce((s, t) => s + Math.abs(t.value), 0);
                  return (
                    <div key={sector.name} className="rounded-xl border border-border/30 p-3 bg-card/50 hover:border-primary/20 transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${sector.color}15` }}>
                          <FolderIconRenderer icon={sector.icon} color={sector.color} className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{sector.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Total: <span className="font-semibold text-foreground">R$ {sectorTotal.toLocaleString('pt-BR')}</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {/* Investments Tab */}
            <TabsContent value="investments" className="flex-1 overflow-y-auto mt-0">
              <div className="rounded-xl border border-border/30 p-4 bg-card/50 mb-4">
                <h3 className="text-sm font-semibold mb-1">Total Investido</h3>
                <p className="text-2xl font-bold text-success">R$ 12.500,00</p>
                <p className="text-xs text-muted-foreground mt-1">Este mês: <span className="text-success font-medium">+R$ 2.000,00</span></p>
              </div>
              <div className="space-y-3">
                {[
                  { name: 'Tesouro Selic', value: 5000, pct: 1.2 },
                  { name: 'CDB 120% CDI', value: 3500, pct: 1.5 },
                  { name: 'Ações (PETR4)', value: 2500, pct: -0.8 },
                  { name: 'FII (XPLG11)', value: 1500, pct: 0.5 },
                ].map(inv => (
                  <div key={inv.name} className="rounded-xl border border-border/30 p-3 bg-card/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{inv.name}</span>
                      <span className="text-sm font-bold">R$ {inv.value.toLocaleString('pt-BR')}</span>
                    </div>
                    <p className={cn("text-xs mt-1", inv.pct >= 0 ? "text-success" : "text-destructive")}>
                      {inv.pct >= 0 ? '+' : ''}{inv.pct}% este mês
                    </p>
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
