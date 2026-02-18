import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
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
  MessageCircle,
  Brain,
  Tags,
  ChartLine,
} from "lucide-react";
import { FinanceChat } from "@/components/finance/FinanceChat";
import { FinanceAnalysis } from "@/components/finance/FinanceAnalysis";
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
import { ExpensesBySectorChart } from "@/components/finance/ExpensesBySectorChart";
import { DailyExpensesChart } from "@/components/finance/DailyExpensesChart";
import { InvestmentsTab } from "@/components/finance/InvestmentsTab";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { AnimatedNumber } from "@/components/ui/animated-number";

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

// Ícones para setores financeiros (apenas os suportados pelo FolderIconRenderer
// para evitar vários ícones iguais aparecendo como fallback)
const sectorIcons = [
  // Finanças
  "wallet",
  "credit-card",
  "banknote",
  "coins",
  "piggy-bank",
  "receipt",
  // Gráficos
  "chart-line",
  "chart-bar",
  // Compras
  "shopping-bag",
  "tag",
  "gift",
  // Casa
  "home",
  "building",
  "lightbulb",
  "droplet",
  "flame",
  // Transporte
  "car",
  "plane",
  "bike",
  // Alimentação
  "utensils",
  "coffee",
  "pizza",
  "apple",
  "wine",
  "beer",
  "cake",
  // Educação/Trabalho
  "briefcase",
  "graduation-cap",
  "book",
  "pencil",
  // Tecnologia
  "laptop",
  "smartphone",
  "camera",
  "headphones",
  "globe",
  // Entretenimento
  "tv",
  "gamepad",
  "music",
  "puzzle",
  "dice",
  // Saúde/Fitness
  "heart",
  "dumbbell",
  // Conquistas
  "trophy",
  "medal",
  "crown",
  "star",
  "target",
  // Natureza/Pets
  "sun",
  "cloud",
  "umbrella",
  "tree",
  "flower",
  "leaf",
  "dog",
  "cat",
  // Utilitários
  "calendar",
  "clock",
  "alarm-clock",
  "bell",
  "shield",
  "key",
  "wrench",
  "hammer",
  "lock",
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
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]); // For investment evolution
  const [loading, setLoading] = useState(true);
  
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [addSectorOpen, setAddSectorOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const [transactionFilter, setTransactionFilter] = useState<TransactionFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
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

    const [sectorsRes, transactionsRes, allTransactionsRes] = await Promise.all([
      supabase.from("finance_sectors").select("*").eq("user_id", user.id).order("name"),
      supabase
        .from("finance_transactions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .order("date", { ascending: false }),
      // Get all transactions for investment evolution chart
      supabase
        .from("finance_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true }),
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
    setAllTransactions((allTransactionsRes.data as Transaction[]) || []);
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

    const isIncome = newTransaction.type === "income";
    const value = isIncome 
      ? Math.abs(newTransaction.value)
      : -Math.abs(newTransaction.value);

    // Receitas sempre têm status "received"
    const status = isIncome ? "received" : newTransaction.status;

    const { error } = await supabase.from("finance_transactions").insert({
      user_id: user.id,
      name: newTransaction.name,
      date: newTransaction.date,
      value,
      sector_id: newTransaction.sector_id || null,
      description: newTransaction.description || null,
      status,
    });

    if (error) {
      toast({ title: "Erro ao criar transação", variant: "destructive" });
      return;
    }

    toast({ title: "Transação adicionada" });
    // Mark streak
    if (user) { const today = new Date().toISOString().split("T")[0]; await supabase.from("consistency_days").upsert({ user_id: user.id, date: today, is_active: true, reason: "finance" }, { onConflict: "user_id,date" }); }
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

    const isIncome = editingTransaction.value > 0;
    const status = isIncome ? "received" : (editingTransaction.status || "paid");

    const { error } = await supabase
      .from("finance_transactions")
      .update({
        name: editingTransaction.name,
        value: editingTransaction.value,
        sector_id: editingTransaction.sector_id,
        description: editingTransaction.description,
        status,
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

  // Apenas despesas no gráfico de setores (receitas excluídas)
  const expensesBySector = sectors.map((sector) => {
    const total = transactions
      .filter((t) => t.sector_id === sector.id && t.value < 0 && t.status !== "received")
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

  // Status efetivo: transações de ganho são sempre "received" (Recebimento)
  const getEffectiveStatus = (t: { value: number; status?: string | null }) => {
    if (t.value > 0) return "received";
    return t.status || "paid";
  };

  // Filtrar transações
  const filteredTransactions = transactions.filter((t) => {
    const effectiveStatus = getEffectiveStatus(t);

    // Filtro por status/tipo
    if (transactionFilter === "paid" && effectiveStatus !== "paid") return false;
    if (transactionFilter === "pending" && effectiveStatus !== "pending") return false;
    if (transactionFilter === "to_receive" && effectiveStatus !== "to_receive") return false;
    if (transactionFilter === "received" && effectiveStatus !== "received") return false;
    
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
      case "received": return "Recebido";
      default: return "Pago";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "text-success";
      case "pending": return "text-amber-500";
      case "to_receive": return "text-blue-500";
      case "received": return "text-blue-500";
      default: return "text-success";
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col -m-4 md:-m-6 bg-background overflow-hidden">
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
    <div className="h-full flex flex-col -m-4 md:-m-6 bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border/30 flex-shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg md:text-2xl font-bold truncate">Finanças</h1>
          <p className="text-xs md:text-sm text-muted-foreground hidden md:block">Controle é liberdade.</p>
        </div>
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <Button
            variant={analysisOpen ? "secondary" : "outline"}
            size="sm"
            className={cn(
              "h-8 md:h-9 px-2 md:px-3 gap-1.5 transition-all",
              !analysisOpen && "bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 hover:border-primary/50 hover:from-primary/20 hover:to-accent/20"
            )}
            onClick={() => setAnalysisOpen(!analysisOpen)}
          >
            <Brain className={cn("h-4 w-4", !analysisOpen && "text-primary")} />
            <span className="text-xs font-medium">Análise IA</span>
          </Button>
          <Link to="/chat-financeiro">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 md:h-9 md:w-9 relative"
              title="Chat Financeiro"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </Link>
          <Dialog open={addTransactionOpen} onOpenChange={setAddTransactionOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 md:h-9 px-2 md:px-4">
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Nova Transação</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={newTransaction.type}
                    onValueChange={(v) =>
                      setNewTransaction((prev) => {
                        const type = v as "income" | "expense";
                        const nextStatus =
                          type === "income"
                            ? "received"
                            : prev.status === "received"
                              ? "paid"
                              : prev.status;
                        return { ...prev, type, status: nextStatus };
                      })
                    }
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
                    disabled={newTransaction.type === "income"}
                    value={newTransaction.status}
                    onValueChange={(v) => setNewTransaction({ ...newTransaction, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="received">Recebido</SelectItem>
                      <SelectItem value="pending">A pagar</SelectItem>
                      <SelectItem value="to_receive">A receber</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
      </div>

      {/* Content - Full height with internal scroll */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed: Month Navigation + Stats */}
        <div className="flex-shrink-0 px-4 md:px-6 py-2 md:py-3">
          <div className="flex items-center justify-between cave-card p-2 md:p-3 mb-2 md:mb-3">
            <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-bold uppercase tracking-wider text-xs md:text-sm">
              {format(currentMonth, "MMM yyyy", { locale: ptBR })}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

        </div>

        {/* Fixed: Tabs header */}
        <div className="flex-shrink-0 px-4 md:px-6 pt-3 pb-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-4 h-10 md:h-11 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger 
                value="overview" 
                className={cn(
                  "text-xs md:text-sm px-1 md:px-4 rounded-lg font-medium transition-all duration-200",
                  "data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground/80"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 hidden md:inline" />
                  <span className="hidden md:inline">Visão Geral</span>
                  <span className="md:hidden">Geral</span>
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="transactions" 
                className={cn(
                  "text-xs md:text-sm px-1 md:px-4 rounded-lg font-medium transition-all duration-200",
                  "data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground/80"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <PiggyBank className="h-3.5 w-3.5 hidden md:inline" />
                  Transações
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="investments" 
                className={cn(
                  "text-xs md:text-sm px-1 md:px-4 rounded-lg font-medium transition-all duration-200",
                  "data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground/80"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <ChartLine className="h-3.5 w-3.5 hidden md:inline" />
                  <span className="hidden md:inline">Investimentos</span>
                  <span className="md:hidden">Invest.</span>
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="sectors" 
                className={cn(
                  "text-xs md:text-sm px-1 md:px-4 rounded-lg font-medium transition-all duration-200",
                  "data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground",
                  "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground/80"
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Tags className="h-3.5 w-3.5 hidden md:inline" />
                  Setores
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Scrollable: Tab Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 md:px-6 pb-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="overview" className="space-y-3 md:space-y-4 mt-0">
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-2 md:gap-3">
                <div className="cave-card p-2 md:p-4">
                  <div className="flex items-center gap-1 mb-0.5 md:mb-1">
                    <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-success flex-shrink-0" />
                    <span className="text-[10px] md:text-xs text-muted-foreground truncate">Ganhos</span>
                  </div>
                  <p className="text-xs md:text-lg font-bold text-success truncate">
                    <AnimatedNumber value={income} currency decimals={0} />
                  </p>
                </div>
                <div className="cave-card p-2 md:p-4">
                  <div className="flex items-center gap-1 mb-0.5 md:mb-1">
                    <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-destructive flex-shrink-0" />
                    <span className="text-[10px] md:text-xs text-muted-foreground truncate">Gastos</span>
                  </div>
                  <p className="text-xs md:text-lg font-bold text-destructive truncate">
                    <AnimatedNumber value={Math.abs(expenses)} currency decimals={0} />
                  </p>
                </div>
                <div className="cave-card p-2 md:p-4">
                  <div className="flex items-center gap-1 mb-0.5 md:mb-1">
                    <PiggyBank className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-[10px] md:text-xs text-muted-foreground truncate">Sobra</span>
                  </div>
                  <p className={cn(
                    "text-xs md:text-lg font-bold truncate",
                    balance >= 0 ? "text-success" : "text-destructive"
                  )}>
                    <AnimatedNumber value={balance} currency decimals={0} />
                  </p>
                </div>
              </div>

              {/* Daily Chart - Similar to Habits */}
              <div className="cave-card p-3 md:p-4">
                <h3 className="font-bold text-sm md:text-base mb-3 md:mb-4">Gastos Diários</h3>
                <DailyExpensesChart 
                  dailyExpenses={dailyExpenses} 
                  transactions={transactions}
                  sectors={sectors}
                />
              </div>

              {/* By Sector - Pie Chart Redesigned */}
              <ExpensesBySectorChart 
                sectors={sectors}
                transactions={transactions}
              />
            </TabsContent>

            <TabsContent value="transactions" className="space-y-3 md:space-y-4 mt-0">
              {/* Filters and Search */}
              <div className="cave-card p-3 md:p-6">
                <div className="flex flex-col gap-3 md:gap-4">
                  <div>
                    <h3 className="font-bold uppercase tracking-wider text-xs md:text-sm">Transações</h3>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1 hidden md:block">
                      Verifique suas transações completas.
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3 md:gap-4">
                    {/* Filter Tabs - Horizontal scroll on mobile */}
                    <div className="overflow-x-auto -mx-3 px-3 md:mx-0 md:px-0">
                      <div className="flex gap-1 md:gap-2 min-w-max md:flex-wrap">
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
                            className="h-7 md:h-8 text-xs md:text-sm px-2 md:px-3 flex-shrink-0"
                            onClick={() => setTransactionFilter(filter.value as TransactionFilter)}
                          >
                            {filter.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Pesquisar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-8 md:h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="empty-state py-8">
                  <PiggyBank className="empty-state-icon h-10 w-10" />
                  <h3 className="empty-state-title text-sm">Nenhuma transação</h3>
                  <p className="empty-state-description text-xs">
                    {transactions.length === 0 
                      ? "Adicione sua primeira transação"
                      : "Nenhuma transação encontrada"}
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
                          const effectiveStatus = getEffectiveStatus(t);
                          return (
                            <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors group">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full flex-shrink-0",
                                    isExpense ? "bg-red-500" : "bg-emerald-500"
                                  )} />
                                  <span className="text-sm font-medium">{t.name}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={cn(
                                  "text-sm font-semibold",
                                  isExpense ? "text-red-500" : "text-emerald-500"
                                )}>
                                  {isExpense ? "- " : "+ "}R$ {Math.abs(t.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </td>
                              <td className="p-4">
                                {sector ? (
                                  <div className="flex items-center gap-2">
                                    <FolderIconRenderer 
                                      icon={sector.icon || "wallet"} 
                                      color={sector.color_label} 
                                      className="h-4 w-4" 
                                    />
                                    <span className="text-sm">{sector.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-muted-foreground">-</span>
                                )}
                              </td>
                              <td className="p-4">
                                {(() => {
                                  const isInvestment = sector?.name.toLowerCase().includes("investimento");
                                  if (isInvestment) {
                                    return (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                                        <ChartLine className="h-3 w-3" />
                                        Investimento
                                      </span>
                                    );
                                  }
                                  return (
                                    <span className={cn(
                                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                                      isExpense 
                                        ? "bg-red-500/10 text-red-500" 
                                        : "bg-emerald-500/10 text-emerald-500"
                                    )}>
                                      {isExpense ? (
                                        <TrendingDown className="h-3 w-3" />
                                      ) : (
                                        <TrendingUp className="h-3 w-3" />
                                      )}
                                      {isExpense ? "Despesa" : "Receita"}
                                    </span>
                                  );
                                })()}
                              </td>
                              <td className="p-4">
                                <span className={cn(
                                  "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                                  effectiveStatus === "paid" && "bg-emerald-500/15 text-emerald-500",
                                  effectiveStatus === "received" && "bg-blue-500/15 text-blue-500",
                                  effectiveStatus === "pending" && "bg-amber-500/15 text-amber-500",
                                  effectiveStatus === "to_receive" && "bg-sky-500/15 text-sky-500"
                                )}>
                                  {getStatusLabel(effectiveStatus)}
                                </span>
                              </td>
                              <td className="p-4 text-sm text-muted-foreground">
                                {format(parse(t.date, "yyyy-MM-dd", new Date()), "dd/MM/yyyy")}
                              </td>
                              <td className="p-4">
                                <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => setEditingTransaction(t)}
                                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                                  >
                                    <Edit2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTransaction(t.id)}
                                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
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

            {/* Investments Tab */}
            <TabsContent value="investments" className="mt-0">
              <InvestmentsTab
                transactions={transactions}
                sectors={sectors}
                allTransactions={allTransactions}
                onEditTransaction={setEditingTransaction}
                onDeleteTransaction={handleDeleteTransaction}
              />
            </TabsContent>

            {/* Sectors Tab */}
            <TabsContent value="sectors" className="space-y-3 md:space-y-4 mt-0">
              <div className="cave-card p-3 md:p-6">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div>
                    <h3 className="font-bold uppercase tracking-wider text-xs md:text-sm">Setores</h3>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1 hidden md:block">
                      Gerencie suas categorias de gastos
                    </p>
                  </div>
                  <Dialog open={addSectorOpen} onOpenChange={setAddSectorOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="h-7 md:h-8 text-xs md:text-sm">
                        <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        Novo
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
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
                                  "w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all",
                                  newSector.color_label === color ? "ring-2 ring-offset-2 ring-offset-background ring-primary" : ""
                                )}
                                style={{ backgroundColor: color }}
                              >
                                {newSector.color_label === color && (
                                  <Check className="h-3 w-3 md:h-4 md:w-4 text-white" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Ícone do Setor</Label>
                          <ScrollArea className="h-28 md:h-32 rounded-md border p-2">
                            <div className="flex flex-wrap gap-1.5 md:gap-2">
                              {sectorIcons.map((icon) => (
                                <button
                                  key={icon}
                                  type="button"
                                  onClick={() => setNewSector({ ...newSector, icon })}
                                  className={cn(
                                    "w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center transition-all border",
                                    newSector.icon === icon 
                                      ? "bg-primary/20 border-primary" 
                                      : "bg-secondary/50 border-transparent hover:bg-secondary"
                                  )}
                                >
                                  <FolderIconRenderer 
                                    icon={icon} 
                                    color={newSector.color_label}
                                    className="h-4 w-4 md:h-5 md:w-5" 
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
                  <p className="text-xs md:text-sm text-muted-foreground text-center py-6">
                    Nenhum setor criado
                  </p>
                ) : (
                  <div className="space-y-1.5 md:space-y-2">
                    {sectors.map((sector) => (
                      <div
                        key={sector.id}
                        className="flex items-center justify-between p-2.5 md:p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors group"
                      >
                        <div className="flex items-center gap-2 md:gap-3 min-w-0">
                          <FolderIconRenderer 
                            icon={sector.icon || "wallet"} 
                            color={sector.color_label}
                            className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" 
                          />
                          <span className="font-medium text-sm truncate">{sector.name}</span>
                        </div>
                        <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => setEditingSector(sector)}
                            className="p-1.5 md:p-2 hover:bg-secondary rounded"
                          >
                            <Edit2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSector(sector.id)}
                            className="p-1.5 md:p-2 hover:bg-secondary rounded text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
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
                  onValueChange={(v) =>
                    setEditingTransaction((prev) => {
                      if (!prev) return prev;
                      const nextValue =
                        v === "expense" ? -Math.abs(prev.value) : Math.abs(prev.value);
                      const nextStatus =
                        v === "income"
                          ? "received"
                          : prev.status === "received"
                            ? "paid"
                            : prev.status;
                      return { ...prev, value: nextValue, status: nextStatus };
                    })
                  }
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
                  disabled={editingTransaction.value > 0}
                  value={getEffectiveStatus(editingTransaction)}
                  onValueChange={(v) => setEditingTransaction({ ...editingTransaction, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="received">Recebido</SelectItem>
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

      {/* Finance Chat */}
      <FinanceChat
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        sectors={sectors.map((s) => ({ id: s.id, name: s.name }))}
        onTransactionAdded={fetchData}
      />

      {/* Finance Analysis Panel */}
      {analysisOpen && (
        <div className="fixed top-16 right-0 bottom-0 z-40">
          <FinanceAnalysis
            userId={user?.id || ""}
            transactions={transactions}
            sectors={sectors}
            income={income}
            expenses={expenses}
            balance={balance}
            isOpen={analysisOpen}
            onClose={() => setAnalysisOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
