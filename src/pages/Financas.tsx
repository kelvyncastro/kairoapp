import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, subMonths, addMonths, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Sector {
  id: string;
  name: string;
  color_label: string;
}

interface Transaction {
  id: string;
  name: string;
  date: string;
  value: number;
  sector_id: string | null;
  description: string | null;
}

interface NewTransaction {
  name: string;
  value: number;
  type: "income" | "expense";
  sector_id: string;
  description: string;
}

const grayColors = [
  "#3a3a3a",
  "#4a4a4a",
  "#5a5a5a",
  "#6a6a6a",
  "#7a7a7a",
  "#8a8a8a",
];

export default function Financas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [addSectorOpen, setAddSectorOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [newTransaction, setNewTransaction] = useState<NewTransaction>({
    name: "",
    value: 0,
    type: "expense",
    sector_id: "",
    description: "",
  });
  const [newSectorName, setNewSectorName] = useState("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");

    const [sectorsRes, transactionsRes] = await Promise.all([
      supabase.from("finance_sectors").select("*").eq("user_id", user.id).order("name"),
      supabase
        .from("finance_transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .order("date", { ascending: false }),
    ]);

    setSectors((sectorsRes.data as Sector[]) || []);
    setTransactions((transactionsRes.data as Transaction[]) || []);
    setLoading(false);
  }, [user, currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSector = async () => {
    if (!user || !newSectorName.trim()) return;

    const colorIndex = sectors.length % grayColors.length;
    const { error } = await supabase.from("finance_sectors").insert({
      user_id: user.id,
      name: newSectorName,
      color_label: grayColors[colorIndex],
    });

    if (error) {
      toast({ title: "Erro ao criar setor", variant: "destructive" });
      return;
    }

    toast({ title: "Setor criado" });
    setNewSectorName("");
    setAddSectorOpen(false);
    fetchData();
  };

  const handleAddTransaction = async () => {
    if (!user || !newTransaction.name.trim()) return;

    const value = newTransaction.type === "expense" 
      ? -Math.abs(newTransaction.value)
      : Math.abs(newTransaction.value);

    const { error } = await supabase.from("finance_transactions").insert({
      user_id: user.id,
      name: newTransaction.name,
      date: format(new Date(), "yyyy-MM-dd"),
      value,
      sector_id: newTransaction.sector_id || null,
      description: newTransaction.description || null,
    });

    if (error) {
      toast({ title: "Erro ao criar transação", variant: "destructive" });
      return;
    }

    toast({ title: "Transação adicionada" });
    setNewTransaction({ name: "", value: 0, type: "expense", sector_id: "", description: "" });
    setAddTransactionOpen(false);
    fetchData();
  };

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) return;

    const { error } = await supabase
      .from("finance_transactions")
      .update({
        name: editingTransaction.name,
        value: editingTransaction.value,
        sector_id: editingTransaction.sector_id,
        description: editingTransaction.description,
      })
      .eq("id", editingTransaction.id);

    if (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
      return;
    }

    toast({ title: "Transação atualizada" });
    setEditingTransaction(null);
    fetchData();
  };

  const handleDeleteTransaction = async (id: string) => {
    await supabase.from("finance_transactions").delete().eq("id", id);
    toast({ title: "Transação excluída" });
    fetchData();
  };

  const handleDeleteSector = async (id: string) => {
    const hasTransactions = transactions.some((t) => t.sector_id === id);
    if (hasTransactions) {
      toast({ title: "Setor possui transações", description: "Remova as transações primeiro", variant: "destructive" });
      return;
    }
    await supabase.from("finance_sectors").delete().eq("id", id);
    toast({ title: "Setor excluído" });
    fetchData();
  };

  const income = transactions.filter((t) => t.value > 0).reduce((sum, t) => sum + t.value, 0);
  const expenses = transactions.filter((t) => t.value < 0).reduce((sum, t) => sum + t.value, 0);
  const balance = income + expenses;

  const expensesBySector = sectors.map((sector) => {
    const total = transactions
      .filter((t) => t.sector_id === sector.id && t.value < 0)
      .reduce((sum, t) => sum + Math.abs(t.value), 0);
    return { ...sector, total };
  }).filter((s) => s.total > 0);

  const totalExpenses = Math.abs(expenses);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  const dailyExpenses = daysInMonth.map((day) => {
    const dateStr = format(day, "yyyy-MM-dd");
    const dayTotal = transactions
      .filter((t) => t.date === dateStr && t.value < 0)
      .reduce((sum, t) => sum + Math.abs(t.value), 0);
    return { date: dateStr, day: format(day, "d"), total: dayTotal };
  });

  const maxDaily = Math.max(...dailyExpenses.map((d) => d.total), 1);

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col -m-6 bg-background">
        <div className="px-6 py-4 border-b border-border/30">
          <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
        </div>
        <div className="flex-1 p-6">
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Finanças</h1>
          <p className="text-sm text-muted-foreground">Controle é liberdade.</p>
        </div>
        <Dialog open={addTransactionOpen} onOpenChange={setAddTransactionOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  placeholder="Ex: Mercado, Salário..."
                  value={newTransaction.name}
                  onChange={(e) => setNewTransaction({ ...newTransaction, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={newTransaction.type}
                  onValueChange={(v) => setNewTransaction({ ...newTransaction, type: v as "income" | "expense" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Gasto</SelectItem>
                    <SelectItem value="income">Ganho</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={newTransaction.value}
                  onChange={(e) => setNewTransaction({ ...newTransaction, value: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Setor</Label>
                <Select
                  value={newTransaction.sector_id || "none"}
                  onValueChange={(v) => setNewTransaction({ ...newTransaction, sector_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem setor</SelectItem>
                    {sectors.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddTransaction} disabled={!newTransaction.name.trim() || newTransaction.value === 0}>
                Adicionar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Month Navigation */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between cave-card p-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-bold uppercase tracking-wider">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Stats Cards */}
          <h2 className="text-xl font-bold text-foreground uppercase tracking-wider mb-4">
            Resumo
          </h2>
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <div className="cave-card p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-success" />
                <span className="text-sm text-muted-foreground">Ganhos</span>
              </div>
              <p className="text-2xl font-bold text-success">
                R$ {income.toFixed(2)}
              </p>
            </div>

            <div className="cave-card p-6">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                <span className="text-sm text-muted-foreground">Gastos</span>
              </div>
              <p className="text-2xl font-bold text-destructive">
                R$ {Math.abs(expenses).toFixed(2)}
              </p>
            </div>

            <div className="cave-card p-6">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Sobra</span>
              </div>
              <p className={cn(
                "text-2xl font-bold",
                balance >= 0 ? "text-success" : "text-destructive"
              )}>
                R$ {balance.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-t border-border/30">
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="transactions">Transações</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Daily Chart */}
              <div className="cave-card p-6">
                <h3 className="font-bold uppercase tracking-wider text-sm mb-4">Gastos Diários</h3>
                <div className="flex items-end gap-1 h-32">
                  {dailyExpenses.map((day) => (
                    <div
                      key={day.date}
                      className="flex-1 flex flex-col items-center group"
                    >
                      <div
                        className="w-full bg-primary/70 rounded-t transition-all hover:bg-primary"
                        style={{ height: `${(day.total / maxDaily) * 100}%`, minHeight: day.total > 0 ? "4px" : "0" }}
                        title={`R$ ${day.total.toFixed(2)}`}
                      />
                      <span className="text-[10px] text-muted-foreground mt-1">
                        {Number(day.day) % 5 === 0 || Number(day.day) === 1 ? day.day : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* By Sector - Pie Chart */}
              <div className="cave-card p-6">
                <h3 className="font-bold uppercase tracking-wider text-sm mb-4">Gastos por Setor</h3>
                {expensesBySector.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum gasto categorizado
                  </p>
                ) : (
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    {/* Pie Chart */}
                    <div className="w-48 h-48 relative">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {(() => {
                          let cumulativePercent = 0;
                          return expensesBySector.map((sector) => {
                            const percent = totalExpenses > 0 ? (sector.total / totalExpenses) * 100 : 0;
                            const startPercent = cumulativePercent;
                            cumulativePercent += percent;
                            
                            const startAngle = (startPercent / 100) * 360;
                            const endAngle = (cumulativePercent / 100) * 360;
                            const largeArcFlag = percent > 50 ? 1 : 0;
                            
                            const startX = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                            const startY = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                            const endX = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
                            const endY = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
                            
                            const pathD = percent === 100
                              ? `M 50 10 A 40 40 0 1 1 49.99 10 Z`
                              : `M 50 50 L ${startX} ${startY} A 40 40 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
                            
                            return (
                              <path
                                key={sector.id}
                                d={pathD}
                                fill={sector.color_label}
                                className="hover:opacity-80 transition-opacity cursor-pointer"
                              />
                            );
                          });
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <p className="text-lg font-bold">R$ {totalExpenses.toFixed(0)}</p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Legend */}
                    <div className="flex-1 space-y-2">
                      {expensesBySector.map((sector) => {
                        const percent = totalExpenses > 0 ? (sector.total / totalExpenses) * 100 : 0;
                        return (
                          <div key={sector.id} className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: sector.color_label }}
                            />
                            <span className="text-sm flex-1">{sector.name}</span>
                            <span className="text-sm text-muted-foreground">
                              R$ {sector.total.toFixed(2)} ({percent.toFixed(0)}%)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Sectors Management */}
              <div className="cave-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold uppercase tracking-wider text-sm">Setores</h3>
                  <Dialog open={addSectorOpen} onOpenChange={setAddSectorOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Novo Setor</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Nome</Label>
                          <Input
                            placeholder="Ex: Mercado, Transporte..."
                            value={newSectorName}
                            onChange={(e) => setNewSectorName(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddSector} disabled={!newSectorName.trim()}>
                          Criar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {sectors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum setor criado
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {sectors.map((sector) => (
                      <div
                        key={sector.id}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary group"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: sector.color_label }}
                        />
                        <span className="text-sm">{sector.name}</span>
                        <button
                          onClick={() => handleDeleteSector(sector.id)}
                          className="opacity-0 group-hover:opacity-100 text-destructive transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              {transactions.length === 0 ? (
                <div className="empty-state">
                  <PiggyBank className="empty-state-icon" />
                  <h3 className="empty-state-title">Nenhuma transação</h3>
                  <p className="empty-state-description">
                    Adicione sua primeira transação do mês
                  </p>
                </div>
              ) : (
                <div className="cave-card overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Data</th>
                        <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome</th>
                        <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Setor</th>
                        <th className="text-right p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Valor</th>
                        <th className="w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((t) => (
                        <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/30 group">
                          <td className="p-4 text-sm text-muted-foreground">
                            {format(new Date(t.date), "dd/MM")}
                          </td>
                          <td className="p-4 text-sm font-medium">{t.name}</td>
                          <td className="p-4 text-sm">
                            {t.sector_id ? (
                              <span 
                                className="px-2 py-0.5 rounded text-xs"
                                style={{ 
                                  backgroundColor: `${sectors.find(s => s.id === t.sector_id)?.color_label}20`,
                                  color: sectors.find(s => s.id === t.sector_id)?.color_label
                                }}
                              >
                                {sectors.find(s => s.id === t.sector_id)?.name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className={cn(
                            "p-4 text-sm font-medium text-right",
                            t.value >= 0 ? "text-success" : "text-destructive"
                          )}>
                            {t.value >= 0 ? "+" : ""}R$ {Math.abs(t.value).toFixed(2)}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setEditingTransaction(t)}
                                className="p-1 hover:bg-secondary rounded"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(t.id)}
                                className="p-1 hover:bg-secondary rounded text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Transaction Dialog */}
      <Dialog open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={editingTransaction.name}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  value={Math.abs(editingTransaction.value)}
                  onChange={(e) => setEditingTransaction({ 
                    ...editingTransaction, 
                    value: editingTransaction.value >= 0 ? Number(e.target.value) : -Number(e.target.value)
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Setor</Label>
                <Select
                  value={editingTransaction.sector_id || "none"}
                  onValueChange={(v) => setEditingTransaction({ ...editingTransaction, sector_id: v === "none" ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem setor</SelectItem>
                    {sectors.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdateTransaction}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
