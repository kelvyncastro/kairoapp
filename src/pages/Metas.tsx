import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";
import {
  Plus,
  Target,
  TrendingUp,
  Trash2,
  Edit2,
  DollarSign,
  Dumbbell,
  Heart,
  User,
  MoreHorizontal,
  Eye,
  CalendarIcon,
  Clock,
  Star,
  Trophy,
  Rocket,
  Lightbulb,
  Book,
  GraduationCap,
  Briefcase,
  Home,
  Car,
  Plane,
  Music,
  Camera,
  Coffee,
  ShoppingBag,
  CreditCard,
  PiggyBank,
  BarChart3,
  Calendar,
  Bell,
  Gamepad2,
  Palette,
  Gem,
  Award,
  Crown,
  Zap,
  Flame,
  Leaf,
  Mountain,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { GoalDetailModal } from "@/components/goals/GoalDetailModal";
import { CreateCategoryDialog } from "@/components/goals/CreateCategoryDialog";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  category_id: string | null;
  target_value: number;
  current_value: number;
  unit_label: string;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  created_at: string;
  end_date: string;
}

interface GoalCategoryData {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default?: boolean;
}

interface ProgressEntry {
  id: string;
  goal_id: string;
  value: number;
  note: string | null;
  created_at: string;
}

interface NewGoal {
  title: string;
  description: string;
  category_id: string;
  target_value: number;
  unit_label: string;
  end_date: Date | undefined;
}

// Icon map for rendering category icons
const ICON_MAP: Record<string, LucideIcon> = {
  "dollar-sign": DollarSign,
  "dumbbell": Dumbbell,
  "heart": Heart,
  "user": User,
  "star": Star,
  "target": Target,
  "trophy": Trophy,
  "rocket": Rocket,
  "lightbulb": Lightbulb,
  "book": Book,
  "graduation-cap": GraduationCap,
  "briefcase": Briefcase,
  "home": Home,
  "car": Car,
  "plane": Plane,
  "music": Music,
  "camera": Camera,
  "coffee": Coffee,
  "shopping-bag": ShoppingBag,
  "credit-card": CreditCard,
  "piggy-bank": PiggyBank,
  "chart-bar": BarChart3,
  "calendar": Calendar,
  "clock": Clock,
  "bell": Bell,
  "gamepad": Gamepad2,
  "palette": Palette,
  "gem": Gem,
  "award": Award,
  "crown": Crown,
  "zap": Zap,
  "flame": Flame,
  "leaf": Leaf,
  "mountain": Mountain,
};

// Default categories for fallback
const DEFAULT_CATEGORIES: GoalCategoryData[] = [
  { id: "FINANCIAL", name: "Financeira", icon: "dollar-sign", color: "#22c55e" },
  { id: "FITNESS", name: "Fitness", icon: "dumbbell", color: "#f59e0b" },
  { id: "HEALTH", name: "Saúde", icon: "heart", color: "#ef4444" },
  { id: "PERSONAL", name: "Pessoal", icon: "user", color: "#8b5cf6" },
];

function getCategoryIcon(iconKey: string, className = "h-4 w-4") {
  const IconComponent = ICON_MAP[iconKey] || Star;
  return <IconComponent className={className} />;
}

export default function Metas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<GoalCategoryData[]>([]);
  const [progressHistory, setProgressHistory] = useState<Record<string, ProgressEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [progressMode, setProgressMode] = useState<"absolute" | "increment">("increment");
  const [progressValue, setProgressValue] = useState("");
  const [progressNote, setProgressNote] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [detailGoal, setDetailGoal] = useState<Goal | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createCategoryDialogOpen, setCreateCategoryDialogOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<NewGoal>({
    title: "",
    description: "",
    category_id: "",
    target_value: 1,
    unit_label: "",
    end_date: undefined,
  });

  // Combined categories (DB + defaults for backwards compatibility)
  const allCategories = useMemo(() => {
    if (categories.length > 0) return categories;
    return DEFAULT_CATEGORIES;
  }, [categories]);

  // Get category config by ID or legacy category name
  const getCategoryConfig = useCallback((goal: Goal): { label: string; icon: React.ReactNode; color: string } => {
    // First try by category_id
    if (goal.category_id) {
      const cat = allCategories.find(c => c.id === goal.category_id);
      if (cat) {
        return {
          label: cat.name,
          icon: getCategoryIcon(cat.icon),
          color: cat.color,
        };
      }
    }
    // Fallback to legacy category field
    if (goal.category) {
      const cat = allCategories.find(c => c.id === goal.category || c.name.toUpperCase() === goal.category?.toUpperCase());
      if (cat) {
        return {
          label: cat.name,
          icon: getCategoryIcon(cat.icon),
          color: cat.color,
        };
      }
      // Try default categories
      const defaultCat = DEFAULT_CATEGORIES.find(c => c.id === goal.category);
      if (defaultCat) {
        return {
          label: defaultCat.name,
          icon: getCategoryIcon(defaultCat.icon),
          color: defaultCat.color,
        };
      }
    }
    // Ultimate fallback
    return {
      label: "Pessoal",
      icon: getCategoryIcon("user"),
      color: "#8b5cf6",
    };
  }, [allCategories]);

  const fetchCategories = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("goal_categories")
      .select("*")
      .eq("user_id", user.id)
      .order("order", { ascending: true });

    if (!error && data && data.length > 0) {
      setCategories(data.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon || "star",
        color: c.color || "#6366f1",
        is_default: c.is_default || false,
      })));
    } else {
      // If no categories, create defaults
      await createDefaultCategories();
    }
  }, [user]);

  const createDefaultCategories = async () => {
    if (!user) return;

    // Double-check: don't create if already exists (prevent duplicates)
    const { data: existing } = await supabase
      .from("goal_categories")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);

    if (existing && existing.length > 0) {
      // Already has categories, just refetch
      await fetchCategories();
      return;
    }

    const defaultCats = [
      { name: "Financeira", icon: "dollar-sign", color: "#22c55e", order: 0 },
      { name: "Fitness", icon: "dumbbell", color: "#f59e0b", order: 1 },
      { name: "Saúde", icon: "heart", color: "#ef4444", order: 2 },
      { name: "Pessoal", icon: "user", color: "#8b5cf6", order: 3 },
    ];

    const { data, error } = await supabase
      .from("goal_categories")
      .insert(defaultCats.map(c => ({ ...c, user_id: user.id, is_default: true })))
      .select();

    if (!error && data) {
      setCategories(data.map(c => ({
        id: c.id,
        name: c.name,
        icon: c.icon || "star",
        color: c.color || "#6366f1",
        is_default: c.is_default || false,
      })));
    }
  };

  const fetchGoals = useCallback(async (showLoading = true) => {
    if (!user) return;
    if (showLoading) setLoading(true);

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar metas", variant: "destructive" });
    } else {
      setGoals((data as Goal[]) || []);
      
      // Fetch progress history for all goals
      const goalIds = (data || []).map((g: { id: string }) => g.id);
      if (goalIds.length > 0) {
        const { data: historyData } = await supabase
          .from("goal_progress_history")
          .select("*")
          .in("goal_id", goalIds)
          .order("created_at", { ascending: true });
        
        const historyByGoal: Record<string, ProgressEntry[]> = {};
        (historyData || []).forEach((entry: ProgressEntry) => {
          if (!historyByGoal[entry.goal_id]) {
            historyByGoal[entry.goal_id] = [];
          }
          historyByGoal[entry.goal_id].push(entry);
        });
        setProgressHistory(historyByGoal);
      }
    }
    if (showLoading) setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchCategories();
    fetchGoals();
  }, [fetchCategories, fetchGoals]);

  // Set default category for new goal when categories load
  useEffect(() => {
    if (allCategories.length > 0 && !newGoal.category_id) {
      setNewGoal(prev => ({ ...prev, category_id: allCategories[0].id }));
    }
  }, [allCategories, newGoal.category_id]);

  const handleCreateCategory = async (categoryData: { name: string; icon: string; color: string }) => {
    if (!user) return;

    const { error } = await supabase.from("goal_categories").insert({
      user_id: user.id,
      name: categoryData.name,
      icon: categoryData.icon,
      color: categoryData.color,
      order: categories.length,
      is_default: false,
    });

    if (error) {
      toast({ title: "Erro ao criar setor", variant: "destructive" });
      return;
    }

    toast({ title: "Setor criado com sucesso!" });
    await fetchCategories();
  };

  const handleCreateGoal = async () => {
    if (!user || !newGoal.title.trim()) return;

    const endDate = newGoal.end_date 
      ? format(newGoal.end_date, "yyyy-MM-dd")
      : format(new Date(new Date().getFullYear() + 1, 11, 31), "yyyy-MM-dd");

    const { error } = await supabase.from("goals").insert({
      user_id: user.id,
      title: newGoal.title,
      description: newGoal.description || null,
      type: "YEARLY",
      category_id: newGoal.category_id,
      target_value: newGoal.target_value,
      unit_label: newGoal.unit_label,
      start_date: format(new Date(), "yyyy-MM-dd"),
      end_date: endDate,
      current_value: 0,
      status: "ACTIVE",
    });

    if (error) {
      toast({ title: "Erro ao criar meta", variant: "destructive" });
      return;
    }

    toast({ title: "Meta criada com sucesso!" });
    setNewGoal({ title: "", description: "", category_id: allCategories[0]?.id || "", target_value: 1, unit_label: "", end_date: undefined });
    setDialogOpen(false);
    await fetchGoals(false);
  };

  const handleAddProgress = async () => {
    if (!selectedGoalId || !progressValue) return;

    const goal = goals.find(g => g.id === selectedGoalId);
    if (!goal) return;

    const numValue = parseFloat(progressValue);
    if (isNaN(numValue)) return;

    const delta = progressMode === "increment" ? numValue : numValue - goal.current_value;
    const newCurrentValue = goal.current_value + delta;

    const { error: historyError } = await supabase
      .from("goal_progress_history")
      .insert({
        goal_id: selectedGoalId,
        value: delta,
        note: progressNote || null,
      });

    if (historyError) {
      toast({ title: "Erro ao registrar progresso", variant: "destructive" });
      return;
    }

    const completed = newCurrentValue >= goal.target_value;
    const { error } = await supabase
      .from("goals")
      .update({
        current_value: newCurrentValue,
        status: completed ? "COMPLETED" : "ACTIVE",
      })
      .eq("id", selectedGoalId);

    if (error) {
      toast({ title: "Erro ao atualizar meta", variant: "destructive" });
      return;
    }

    if (completed && goal.status !== "COMPLETED") {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.5, x: 0.3 },
        });
        confetti({
          particleCount: 100,
          spread: 100,
          origin: { y: 0.5, x: 0.7 },
        });
      }, 200);
      toast({ title: "🎯 Meta alcançada!", description: goal.title });
    } else {
      toast({ title: "Progresso registrado!" });
    }

    setProgressDialogOpen(false);
    setProgressValue("");
    setProgressNote("");
    setSelectedGoalId(null);
    await fetchGoals(false);
  };

  const handleDeleteGoal = async (goalId: string) => {
    const { error } = await supabase.from("goals").delete().eq("id", goalId);
    if (error) {
      toast({ title: "Erro ao excluir meta", variant: "destructive" });
      return;
    }
    toast({ title: "Meta excluída" });
    await fetchGoals(false);
  };

  const handleSaveEdit = async () => {
    if (!editingGoal) return;

    const isCompleted = editingGoal.current_value >= editingGoal.target_value;
    const newStatus = isCompleted ? "COMPLETED" : "ACTIVE";

    const { error } = await supabase
      .from("goals")
      .update({
        title: editingGoal.title,
        description: editingGoal.description,
        target_value: editingGoal.target_value,
        unit_label: editingGoal.unit_label,
        category_id: editingGoal.category_id,
        end_date: editingGoal.end_date,
        status: newStatus,
      })
      .eq("id", editingGoal.id);

    if (error) {
      toast({ title: "Erro ao atualizar meta", variant: "destructive" });
      return;
    }

    toast({ title: "Meta atualizada" });
    setEditingGoal(null);
    await fetchGoals(false);
  };

  const openProgressDialog = (goalId: string) => {
    setSelectedGoalId(goalId);
    setProgressMode("increment");
    setProgressValue("");
    setProgressNote("");
    setProgressDialogOpen(true);
  };

  const openDetailModal = (goal: Goal) => {
    setDetailGoal(goal);
    setDetailModalOpen(true);
  };

  const filteredGoals = activeCategory === "ALL" 
    ? goals 
    : goals.filter((g) => g.category_id === activeCategory || g.category === activeCategory);

  const getProgressChartData = (goalId: string) => {
    const history = [...(progressHistory[goalId] || [])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    let runningTotal = 0;
    return history.map((entry, index) => {
      runningTotal += entry.value;
      return {
        index: index + 1,
        value: runningTotal,
        date: format(new Date(entry.created_at), "dd/MM", { locale: ptBR }),
      };
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Metas</h1>
          <p className="text-muted-foreground">
            Defina objetivos e acompanhe seu progresso
          </p>
        </div>

        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <Button
          variant={activeCategory === "ALL" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCategory("ALL")}
        >
          Todas
        </Button>
        {allCategories.map((cat) => (
          <Button
            key={cat.id}
            variant={activeCategory === cat.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat.id)}
            className="gap-2"
          >
            <span style={{ color: activeCategory === cat.id ? undefined : cat.color }}>
              {getCategoryIcon(cat.icon)}
            </span>
            {cat.name}
          </Button>
        ))}
        {/* Add new category button */}
        <button
          type="button"
          onClick={() => setCreateCategoryDialogOpen(true)}
          className="h-9 w-9 flex items-center justify-center rounded-md border-2 border-dashed border-border bg-background hover:bg-accent hover:border-primary transition-colors"
          title="Adicionar novo setor"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Goals grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="cave-card p-6 animate-pulse">
              <div className="h-5 w-1/3 bg-muted rounded mb-4" />
              <div className="h-2 w-full bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : filteredGoals.length === 0 ? (
        <div className="empty-state">
          <Target className="empty-state-icon" />
          <h3 className="empty-state-title">Nenhuma meta encontrada</h3>
          <p className="empty-state-description">
            Crie sua primeira meta para começar a acompanhar seu progresso
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Meta
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredGoals.map((goal) => {
            const progress = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
            const isCompleted = goal.status === "COMPLETED" || goal.current_value >= goal.target_value;
            const categoryConfig = getCategoryConfig(goal);
            const chartData = getProgressChartData(goal.id);
            const daysRemaining = goal.end_date ? differenceInDays(parseISO(goal.end_date), new Date()) : null;

            return (
              <div
                key={goal.id}
                className={cn(
                  "cave-card p-6 group cursor-pointer",
                  isCompleted && "border-success/30"
                )}
                onClick={() => openDetailModal(goal)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="p-1.5 rounded"
                        style={{ backgroundColor: `${categoryConfig.color}20`, color: categoryConfig.color }}
                      >
                        {categoryConfig.icon}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        {categoryConfig.label}
                      </span>
                      {isCompleted && (
                        <span className="cave-badge-success text-xs">
                          ✓ Alcançada
                        </span>
                      )}
                      {!isCompleted && daysRemaining !== null && (
                        <span className={cn(
                          "flex items-center gap-1 text-xs px-2 py-0.5 rounded",
                          daysRemaining <= 7 ? "bg-destructive/20 text-destructive" :
                          daysRemaining <= 30 ? "bg-warning/20 text-warning" :
                          "bg-muted text-muted-foreground"
                        )}>
                          <Clock className="h-3 w-3" />
                          {daysRemaining <= 0 ? "Vencida" : `${daysRemaining}d restantes`}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold">{goal.title}</h3>
                    {goal.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {goal.description}
                      </p>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem onClick={() => openDetailModal(goal)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingGoal(goal)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteGoal(goal.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Progress */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {goal.current_value.toLocaleString('pt-BR')} / {goal.target_value.toLocaleString('pt-BR')} {goal.unit_label}
                    </span>
                    <span className={isCompleted ? "text-success font-semibold" : "text-muted-foreground"}>
                      {progress}%
                    </span>
                  </div>
                  <Progress 
                    value={progress} 
                    className="h-3"
                    indicatorColor={isCompleted ? 'hsl(var(--success))' : `${categoryConfig.color}cc`}
                  />

                  {/* Progress chart */}
                  {chartData.length > 1 && (
                    <div className="h-24 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id={`gradient-${goal.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={categoryConfig.color} stopOpacity={0.4} />
                              <stop offset="100%" stopColor={categoryConfig.color} stopOpacity={0.05} />
                            </linearGradient>
                          </defs>
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                          />
                          <YAxis hide />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
                                    <p className="text-xs text-muted-foreground">{payload[0].payload.date}</p>
                                    <p className="text-sm font-semibold">
                                      {Number(payload[0].value).toLocaleString('pt-BR')} {goal.unit_label}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke={categoryConfig.color}
                            strokeWidth={2}
                            fill={`url(#gradient-${goal.id})`}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Update button */}
                  {!isCompleted && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        openProgressDialog(goal.id);
                      }}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Atualizar Progresso
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Goal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Meta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                placeholder="Ex: Economizar R$10.000"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                placeholder="Detalhes da meta..."
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Setor</Label>
              <Select
                value={newGoal.category_id}
                onValueChange={(v) => setNewGoal({ ...newGoal, category_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um setor" />
                </SelectTrigger>
                <SelectContent>
                  {allCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <span style={{ color: cat.color }}>{getCategoryIcon(cat.icon)}</span>
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor alvo</Label>
                <Input
                  type="number"
                  min={1}
                  value={newGoal.target_value}
                  onChange={(e) => setNewGoal({ ...newGoal, target_value: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Input
                  placeholder="R$, km, kg..."
                  value={newGoal.unit_label}
                  onChange={(e) => setNewGoal({ ...newGoal, unit_label: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data limite (opcional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !newGoal.end_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newGoal.end_date ? format(newGoal.end_date, "PPP", { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={newGoal.end_date}
                    onSelect={(date) => setNewGoal({ ...newGoal, end_date: date })}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    fixedWeeks
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateGoal} disabled={!newGoal.title.trim()}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Progresso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Modo de atualização</Label>
              <Select
                value={progressMode}
                onValueChange={(v) => setProgressMode(v as "absolute" | "increment")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increment">Adicionar ao valor atual</SelectItem>
                  <SelectItem value="absolute">Definir valor total</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                {progressMode === "increment" ? "Quanto adicionar?" : "Novo valor total"}
              </Label>
              <Input
                type="number"
                placeholder={progressMode === "increment" ? "+100" : "1500"}
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Nota (opcional)</Label>
              <Input
                placeholder="Ex: Depósito do mês"
                value={progressNote}
                onChange={(e) => setProgressNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProgressDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddProgress} disabled={!progressValue}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingGoal} onOpenChange={(open) => !open && setEditingGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Meta</DialogTitle>
          </DialogHeader>
          {editingGoal && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={editingGoal.description || ""}
                  onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Setor</Label>
                <Select
                  value={editingGoal.category_id || ""}
                  onValueChange={(v) => setEditingGoal({ ...editingGoal, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <span style={{ color: cat.color }}>{getCategoryIcon(cat.icon)}</span>
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor alvo</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editingGoal.target_value}
                    onChange={(e) => setEditingGoal({ ...editingGoal, target_value: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Input
                    value={editingGoal.unit_label}
                    onChange={(e) => setEditingGoal({ ...editingGoal, unit_label: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Data limite</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editingGoal.end_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editingGoal.end_date 
                        ? format(parseISO(editingGoal.end_date), "PPP", { locale: ptBR }) 
                        : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={editingGoal.end_date ? parseISO(editingGoal.end_date) : undefined}
                      onSelect={(date) => setEditingGoal({ 
                        ...editingGoal, 
                        end_date: date ? format(date, "yyyy-MM-dd") : editingGoal.end_date 
                      })}
                      initialFocus
                      fixedWeeks
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGoal(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <CreateCategoryDialog
        open={createCategoryDialogOpen}
        onOpenChange={setCreateCategoryDialogOpen}
        onCreateCategory={handleCreateCategory}
      />

      {/* Goal Detail Modal */}
      <GoalDetailModal
        goal={detailGoal}
        progressHistory={detailGoal ? progressHistory[detailGoal.id] || [] : []}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onRefresh={() => fetchGoals(false)}
      />
    </div>
  );
}
