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
  Check,
  Search,
  CalendarIcon,
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
import { format, startOfMonth, endOfMonth, subMonths, addMonths, eachDayOfInterval, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FolderIconRenderer } from "@/components/tasks/FolderIconRenderer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface Sector {
  id: string;
  name: string;
  color_label: string;
  icon: string;
}

interface Transaction {
  id: string;
  name: string;
  date: string;
  value: number;
  sector_id: string | null;
  description: string | null;
  status: string;
}

interface NewTransaction {
  name: string;
  value: number;
  type: "income" | "expense";
  sector_id: string;
  description: string;
  status: string;
  date: string;
}

interface NewSector {
  name: string;
  color_label: string;
  icon: string;
}

type TransactionFilter = "all" | "paid" | "received" | "pending" | "to_receive";

// Mesmas cores usadas na Rotina
const sectorColors = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#0ea5e9", // sky
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#d946ef", // fuchsia
  "#ec4899", // pink
  "#f43f5e", // rose
  "#6b7280", // gray
];

// Ícones mais relevantes para finanças
const sectorIcons = [
  "wallet", "credit-card", "banknote", "coins", "piggy-bank", "chart-line", "chart-bar",
  "shopping-bag", "shopping-cart", "car", "plane", "utensils", "coffee", "pizza",
  "home", "building", "briefcase", "graduation-cap", "book", "gamepad", "tv",
  "smartphone", "laptop", "headphones", "music", "heart", "gift", "star",
  "dumbbell", "trophy", "medal", "gem", "diamond", "receipt", "tag",
];

// Setores padrão
const defaultSectors: { name: string; color_label: string; icon: string }[] = [
  { name: "Mercado", color_label: "#22c55e", icon: "shopping-bag" },
  { name: "Transporte", color_label: "#3b82f6", icon: "car" },
  { name: "Cartão", color_label: "#6b7280", icon: "credit-card" },
  { name: "Lazer e Entretenimento", color_label: "#a855f7", icon: "gamepad" },
  { name: "Investimentos", color_label: "#10b981", icon: "chart-line" },
  { name: "Vestuário", color_label: "#ec4899", icon: "shopping-bag" },
  { name: "Educação", color_label: "#0ea5e9", icon: "graduation-cap" },
  { name: "Alimentação", color_label: "#f97316", icon: "utensils" },
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
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newTransaction, setNewTransaction] = useState<NewTransaction>({
    name: "",
    value: 0,
    type: "expense",
    sector_id: "",
    description: "",
    status: "paid",
    date: format(new Date(), "yyyy-MM-dd"),
  });
  
  const [newSector, setNewSector] = useState<NewSector>({
    name: "",
    color_label: sectorColors[0],
    icon: "wallet",
  });

  const createDefaultSectors = useCallback(async () => {
    if (!user) return;
    
    const insertPromises = defaultSectors.map((sector) =>
      supabase.from("finance_sectors").insert({
        user_id: user.id,
        name: sector.name,
        color_label: sector.color_label,
        icon: sector.icon,
      })
    );
    
    await Promise.all(insertPromises);
  }, [user]);

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

    const sectorsData = (sectorsRes.data as Sector[]) || [];
    
    // Se não houver setores, criar os padrões
    if (sectorsData.length === 0) {
      await createDefaultSectors();
      const newSectorsRes = await supabase.from("finance_sectors").select("*").eq("user_id", user.id).order("name");
      setSectors((newSectorsRes.data as Sector[]) || []);
    } else {
      setSectors(sectorsData);
    }
    
    setTransactions((transactionsRes.data as Transaction[]) || []);
    setLoading(false);
  }, [user, currentMonth, createDefaultSectors]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSector = async () => {
    if (!user || !newSector.name.trim()) return;

    const { error } = await supabase.from("finance_sectors").insert({
      user_id: user.id,
      name: newSector.name,
      color_label: newSector.color_label,
      icon: newSector.icon,
    });

    if (error) {
      toast({ title: "Erro ao criar setor", variant: "destructive" });
      return;
    }

    toast({ title: "Setor criado" });
    setNewSector({ name: "", color_label: sectorColors[0], icon: "wallet" });
    setAddSectorOpen(false);
    fetchData();
  };

  const handleUpdateSector = async () => {
    if (!editingSector) return;

    const { error } = await supabase
      .from("finance_sectors")
      .update({
        name: editingSector.name,
        color_label: editingSector.color_label,
        icon: editingSector.icon,
      })
      .eq("id", editingSector.id);

    if (error) {
      toast({ title: "Erro ao atualizar setor", variant: "destructive" });
      return;
    }

    toast({ title: "Setor atualizado" });
    setEditingSector(null);
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
      date: newTransaction.date,
      value,
      sector_id: newTransaction.sector_id || null,
      description: newTransaction.description || null,
      status: newTransaction.status,
    });

    if (error) {
      toast({ title: "Erro ao criar transação", variant: "destructive" });
      return;
    }

    toast({ title: "Transação adicionada" });
    setNewTransaction({ 
      name: "", 
      value: 0, 
      type: "expense", 
      sector_id: "", 
      description: "", 
      status: "paid",
      date: format(new Date(), "yyyy-MM-dd"),
    });
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
        status: editingTransaction.status,
        date: editingTransaction.date,
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

  // Filtrar transações
  const filteredTransactions = transactions.filter((t) => {
    // Filtro por status/tipo
    if (transactionFilter === "paid" && t.status !== "paid") return false;
    if (transactionFilter === "pending" && t.status !== "pending") return false;
    if (transactionFilter === "to_receive" && t.status !== "to_receive") return false;
    if (transactionFilter === "received" && !(t.value > 0 && t.status === "paid")) return false;
    
    // Filtro por pesquisa
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const sector = sectors.find(s => s.id === t.sector_id);
      const matchesName = t.name.toLowerCase().includes(query);
      const matchesSector = sector?.name.toLowerCase().includes(query);
      if (!matchesName && !matchesSector) return false;
    }
    
    return true;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "paid": return "Pago";
      case "pending": return "A pagar";
      case "to_receive": return "A receber";
      default: return "Pago";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "text-success";
      case "pending": return "text-amber-500";
      case "to_receive": return "text-blue-500";
      default: return "text-success";
    }
  };

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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Transação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  placeholder="Ex: Mercado, Salário..."
                  value={newTransaction.name}
                  onChange={(e) => setNewTransaction({ ...newTransaction, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={newTransaction.value || ""}
                  onChange={(e) => setNewTransaction({ ...newTransaction, value: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={newTransaction.sector_id || "none"}
                  onValueChange={(v) => setNewTransaction({ ...newTransaction, sector_id: v === "none" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {sectors.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="income">Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={newTransaction.status}
                  onValueChange={(v) => setNewTransaction({ ...newTransaction, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="pending">A pagar</SelectItem>
                    <SelectItem value="to_receive">A receber</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newTransaction.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newTransaction.date 
                        ? format(parse(newTransaction.date, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")
                        : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newTransaction.date ? parse(newTransaction.date, "yyyy-MM-dd", new Date()) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setNewTransaction({ ...newTransaction, date: format(date, "yyyy-MM-dd") });
                        }
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddTransaction} 
                disabled={!newTransaction.name.trim() || newTransaction.value === 0}
                className="w-full"
              >
                Adicionar Transação
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
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="transactions">Transações</TabsTrigger>
              <TabsTrigger value="sectors">Setores</TabsTrigger>
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
                            <FolderIconRenderer 
                              icon={sector.icon || "wallet"} 
                              color={sector.color_label} 
                              className="h-4 w-4 shrink-0" 
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
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              {/* Filters and Search */}
              <div className="cave-card p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold uppercase tracking-wider text-sm">Transações</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Verifique suas transações completas.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Filter Tabs */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: "all", label: "Todas" },
                        { value: "paid", label: "Pagos" },
                        { value: "received", label: "Recebidos" },
                        { value: "pending", label: "A pagar" },
                        { value: "to_receive", label: "A receber" },
                      ].map((filter) => (
                        <Button
                          key={filter.value}
                          variant={transactionFilter === filter.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setTransactionFilter(filter.value as TransactionFilter)}
                        >
                          {filter.label}
                        </Button>
                      ))}
                    </div>
                    
                    {/* Search */}
                    <div className="relative flex-1 md:max-w-xs">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Pesquisar por descrição, categoria..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="empty-state">
                  <PiggyBank className="empty-state-icon" />
                  <h3 className="empty-state-title">Nenhuma transação</h3>
                  <p className="empty-state-description">
                    {transactions.length === 0 
                      ? "Adicione sua primeira transação do mês"
                      : "Nenhuma transação encontrada com os filtros selecionados"}
                  </p>
                </div>
              ) : (
                <div className="cave-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição</th>
                          <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Valor</th>
                          <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Categoria</th>
                          <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Tipo</th>
                          <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                          <th className="text-left p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Data</th>
                          <th className="text-right p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((t) => {
                          const sector = sectors.find(s => s.id === t.sector_id);
                          const isExpense = t.value < 0;
                          return (
                            <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/30 group">
                              <td className="p-4 text-sm font-medium">{t.name}</td>
                              <td className={cn(
                                "p-4 text-sm font-medium",
                                isExpense ? "text-primary" : "text-success"
                              )}>
                                R$ {Math.abs(t.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="p-4 text-sm">
                                {sector ? sector.name : "-"}
                              </td>
                              <td className="p-4">
                                <Badge variant={isExpense ? "destructive" : "default"} className="text-xs">
                                  {isExpense ? "Despesa" : "Receita"}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <span className={cn("text-sm font-medium", getStatusColor(t.status || "paid"))}>
                                  {getStatusLabel(t.status || "paid")}
                                </span>
                              </td>
                              <td className="p-4 text-sm text-muted-foreground">
                                {format(parse(t.date, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")}
                              </td>
                              <td className="p-4">
                                <div className="flex gap-1 justify-end">
                                  <button
                                    onClick={() => setEditingTransaction(t)}
                                    className="p-2 hover:bg-secondary rounded"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTransaction(t.id)}
                                    className="p-2 hover:bg-secondary rounded text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Sectors Tab */}
            <TabsContent value="sectors" className="space-y-6">
              <div className="cave-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold uppercase tracking-wider text-sm">Gerenciar Setores</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Personalize seus setores para uma análise financeira mais precisa.
                    </p>
                  </div>
                  <Dialog open={addSectorOpen} onOpenChange={setAddSectorOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Setor
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Novo Setor</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Nome do Setor</Label>
                          <Input
                            placeholder="Ex: Alimentação, Transporte..."
                            value={newSector.name}
                            onChange={(e) => setNewSector({ ...newSector, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Cor do Setor</Label>
                          <div className="flex flex-wrap gap-2">
                            {sectorColors.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setNewSector({ ...newSector, color_label: color })}
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                  newSector.color_label === color ? "ring-2 ring-offset-2 ring-offset-background ring-primary" : ""
                                )}
                                style={{ backgroundColor: color }}
                              >
                                {newSector.color_label === color && (
                                  <Check className="h-4 w-4 text-white" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Ícone do Setor</Label>
                          <ScrollArea className="h-32 rounded-md border p-2">
                            <div className="flex flex-wrap gap-2">
                              {sectorIcons.map((icon) => (
                                <button
                                  key={icon}
                                  type="button"
                                  onClick={() => setNewSector({ ...newSector, icon })}
                                  className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center transition-all border",
                                    newSector.icon === icon 
                                      ? "bg-primary/20 border-primary" 
                                      : "bg-secondary/50 border-transparent hover:bg-secondary"
                                  )}
                                >
                                  <FolderIconRenderer 
                                    icon={icon} 
                                    color={newSector.color_label}
                                    className="h-5 w-5" 
                                  />
                                </button>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleAddSector} disabled={!newSector.name.trim()}>
                          Criar Setor
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {sectors.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum setor criado
                  </p>
                ) : (
                  <div className="space-y-2">
                    {sectors.map((sector) => (
                      <div
                        key={sector.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <FolderIconRenderer 
                            icon={sector.icon || "wallet"} 
                            color={sector.color_label}
                            className="h-5 w-5" 
                          />
                          <span className="font-medium">{sector.name}</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingSector(sector)}
                            className="p-2 hover:bg-secondary rounded"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSector(sector.id)}
                            className="p-2 hover:bg-secondary rounded text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Transaction Dialog */}
      <Dialog open={!!editingTransaction} onOpenChange={() => setEditingTransaction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          {editingTransaction && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input
                  value={editingTransaction.name}
                  onChange={(e) => setEditingTransaction({ ...editingTransaction, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={Math.abs(editingTransaction.value).toFixed(2)}
                  onChange={(e) => setEditingTransaction({ 
                    ...editingTransaction, 
                    value: editingTransaction.value >= 0 ? Number(e.target.value) : -Number(e.target.value)
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={editingTransaction.sector_id || "none"}
                  onValueChange={(v) => setEditingTransaction({ ...editingTransaction, sector_id: v === "none" ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem categoria</SelectItem>
                    {sectors.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={editingTransaction.value >= 0 ? "income" : "expense"}
                  onValueChange={(v) => setEditingTransaction({ 
                    ...editingTransaction, 
                    value: v === "expense" ? -Math.abs(editingTransaction.value) : Math.abs(editingTransaction.value)
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="income">Receita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editingTransaction.status || "paid"}
                  onValueChange={(v) => setEditingTransaction({ ...editingTransaction, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="pending">A pagar</SelectItem>
                    <SelectItem value="to_receive">A receber</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editingTransaction.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingTransaction.date 
                        ? format(parse(editingTransaction.date, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")
                        : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editingTransaction.date ? parse(editingTransaction.date, "yyyy-MM-dd", new Date()) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setEditingTransaction({ 
                            ...editingTransaction, 
                            date: format(date, "yyyy-MM-dd") 
                          });
                        }
                      }}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdateTransaction} className="w-full">
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Sector Dialog */}
      <Dialog open={!!editingSector} onOpenChange={() => setEditingSector(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Setor</DialogTitle>
          </DialogHeader>
          {editingSector && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Setor</Label>
                <Input
                  placeholder="Ex: Alimentação, Transporte..."
                  value={editingSector.name}
                  onChange={(e) => setEditingSector({ ...editingSector, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Cor do Setor</Label>
                <div className="flex flex-wrap gap-2">
                  {sectorColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setEditingSector({ ...editingSector, color_label: color })}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                        editingSector.color_label === color ? "ring-2 ring-offset-2 ring-offset-background ring-primary" : ""
                      )}
                      style={{ backgroundColor: color }}
                    >
                      {editingSector.color_label === color && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ícone do Setor</Label>
                <ScrollArea className="h-32 rounded-md border p-2">
                  <div className="flex flex-wrap gap-2">
                    {sectorIcons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setEditingSector({ ...editingSector, icon })}
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-all border",
                          editingSector.icon === icon 
                            ? "bg-primary/20 border-primary" 
                            : "bg-secondary/50 border-transparent hover:bg-secondary"
                        )}
                      >
                        <FolderIconRenderer 
                          icon={icon} 
                          color={editingSector.color_label}
                          className="h-5 w-5" 
                        />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdateSector} disabled={!editingSector?.name.trim()}>
              Salvar Setor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
