import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
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

type GoalCategory = "FINANCIAL" | "FITNESS" | "HEALTH" | "PERSONAL" | string;

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  target_value: number;
  current_value: number;
  unit_label: string;
  status: "ACTIVE" | "COMPLETED" | "PAUSED";
  created_at: string;
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
  category: GoalCategory;
  target_value: number;
  unit_label: string;
}

const CATEGORY_CONFIG: Record<GoalCategory, { label: string; icon: React.ReactNode; color: string }> = {
  FINANCIAL: { label: "Financeira", icon: <DollarSign className="h-4 w-4" />, color: "#22c55e" },
  FITNESS: { label: "Fitness", icon: <Dumbbell className="h-4 w-4" />, color: "#f59e0b" },
  HEALTH: { label: "Saúde", icon: <Heart className="h-4 w-4" />, color: "#ef4444" },
  PERSONAL: { label: "Pessoal", icon: <User className="h-4 w-4" />, color: "#8b5cf6" },
};

export default function Metas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progressHistory, setProgressHistory] = useState<Record<string, ProgressEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [progressMode, setProgressMode] = useState<"absolute" | "increment">("increment");
  const [progressValue, setProgressValue] = useState("");
  const [progressNote, setProgressNote] = useState("");
  const [activeCategory, setActiveCategory] = useState<GoalCategory | "ALL">("ALL");
  const [detailGoal, setDetailGoal] = useState<Goal | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [newGoal, setNewGoal] = useState<NewGoal>({
    title: "",
    description: "",
    category: "PERSONAL",
    target_value: 1,
    unit_label: "",
  });

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
    fetchGoals();
  }, [fetchGoals]);

  const handleCreateGoal = async () => {
    if (!user || !newGoal.title.trim()) return;

    const { error } = await supabase.from("goals").insert({
      user_id: user.id,
      title: newGoal.title,
      description: newGoal.description || null,
      type: "YEARLY", // Keep for compatibility
      category: newGoal.category,
      target_value: newGoal.target_value,
      unit_label: newGoal.unit_label,
      start_date: format(new Date(), "yyyy-MM-dd"),
      end_date: format(new Date(new Date().getFullYear() + 1, 11, 31), "yyyy-MM-dd"),
      current_value: 0,
      status: "ACTIVE",
    });

    if (error) {
      toast({ title: "Erro ao criar meta", variant: "destructive" });
      return;
    }

    toast({ title: "Meta criada com sucesso!" });
    setNewGoal({ title: "", description: "", category: "PERSONAL", target_value: 1, unit_label: "" });
    setDialogOpen(false);
    await fetchGoals(false);
  };

  const handleAddProgress = async () => {
    if (!selectedGoalId || !progressValue) return;

    const goal = goals.find(g => g.id === selectedGoalId);
    if (!goal) return;

    const numValue = parseFloat(progressValue);
    if (isNaN(numValue)) return;

    const newValue = progressMode === "increment" 
      ? goal.current_value + numValue 
      : numValue;

    // Add to progress history
    const { error: historyError } = await supabase
      .from("goal_progress_history")
      .insert({
        goal_id: selectedGoalId,
        value: newValue,
        note: progressNote || null,
      });

    if (historyError) {
      toast({ title: "Erro ao registrar progresso", variant: "destructive" });
      return;
    }

    // Update goal current value
    const completed = newValue >= goal.target_value;
    const { error } = await supabase
      .from("goals")
      .update({
        current_value: newValue,
        status: completed ? "COMPLETED" : "ACTIVE",
      })
      .eq("id", selectedGoalId);

    if (error) {
      toast({ title: "Erro ao atualizar meta", variant: "destructive" });
      return;
    }

    if (completed && goal.status !== "COMPLETED") {
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

    const { error } = await supabase
      .from("goals")
      .update({
        title: editingGoal.title,
        description: editingGoal.description,
        target_value: editingGoal.target_value,
        unit_label: editingGoal.unit_label,
        category: editingGoal.category,
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
    : goals.filter((g) => g.category === activeCategory);

  const getProgressChartData = (goalId: string) => {
    const history = progressHistory[goalId] || [];
    return history.map((entry, index) => ({
      index: index + 1,
      value: entry.value,
      date: format(new Date(entry.created_at), "dd/MM", { locale: ptBR }),
    }));
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
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={activeCategory === "ALL" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveCategory("ALL")}
        >
          Todas
        </Button>
        {(Object.keys(CATEGORY_CONFIG) as GoalCategory[]).map((cat) => (
          <Button
            key={cat}
            variant={activeCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCategory(cat)}
            className="gap-2"
          >
            {CATEGORY_CONFIG[cat].icon}
            {CATEGORY_CONFIG[cat].label}
          </Button>
        ))}
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
            const categoryConfig = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG.PERSONAL;
            const chartData = getProgressChartData(goal.id);

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
                    <DropdownMenuContent align="end">
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
                    style={{ 
                      // @ts-ignore
                      '--progress-color': isCompleted ? 'hsl(var(--success))' : categoryConfig.color 
                    }}
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
              <Label>Categoria</Label>
              <Select
                value={newGoal.category}
                onValueChange={(v) => setNewGoal({ ...newGoal, category: v as GoalCategory })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CATEGORY_CONFIG) as GoalCategory[]).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      <div className="flex items-center gap-2">
                        {CATEGORY_CONFIG[cat].icon}
                        {CATEGORY_CONFIG[cat].label}
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
                <Label>Categoria</Label>
                <Select
                  value={editingGoal.category}
                  onValueChange={(v) => setEditingGoal({ ...editingGoal, category: v as GoalCategory })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORY_CONFIG) as GoalCategory[]).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        <div className="flex items-center gap-2">
                          {CATEGORY_CONFIG[cat].icon}
                          {CATEGORY_CONFIG[cat].label}
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
