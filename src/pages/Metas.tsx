import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Target,
  Minus,
  Check,
  Pause,
  Play,
  Trash2,
  Edit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";
import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { ptBR } from "date-fns/locale";

type GoalType = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
type GoalStatus = "ACTIVE" | "COMPLETED" | "PAUSED";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  type: GoalType;
  target_value: number;
  current_value: number;
  unit_label: string;
  start_date: string;
  end_date: string;
  status: GoalStatus;
}

interface NewGoal {
  title: string;
  description: string;
  type: GoalType;
  target_value: number;
  unit_label: string;
}

function getDateRange(type: GoalType) {
  const now = new Date();
  switch (type) {
    case "DAILY":
      return {
        start: format(startOfDay(now), "yyyy-MM-dd"),
        end: format(endOfDay(now), "yyyy-MM-dd"),
      };
    case "WEEKLY":
      return {
        start: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        end: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
    case "MONTHLY":
      return {
        start: format(startOfMonth(now), "yyyy-MM-dd"),
        end: format(endOfMonth(now), "yyyy-MM-dd"),
      };
    case "YEARLY":
      return {
        start: format(startOfYear(now), "yyyy-MM-dd"),
        end: format(endOfYear(now), "yyyy-MM-dd"),
      };
  }
}

export default function Metas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<GoalType>("WEEKLY");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [newGoal, setNewGoal] = useState<NewGoal>({
    title: "",
    description: "",
    type: "WEEKLY",
    target_value: 1,
    unit_label: "vezes",
  });

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar metas", variant: "destructive" });
    } else {
      setGoals((data as Goal[]) || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleCreateGoal = async () => {
    if (!user || !newGoal.title.trim()) return;

    const { start, end } = getDateRange(newGoal.type);

    const { error } = await supabase.from("goals").insert({
      user_id: user.id,
      title: newGoal.title,
      description: newGoal.description || null,
      type: newGoal.type,
      target_value: newGoal.target_value,
      unit_label: newGoal.unit_label,
      start_date: start,
      end_date: end,
      current_value: 0,
      status: "ACTIVE",
    });

    if (error) {
      toast({ title: "Erro ao criar meta", variant: "destructive" });
      return;
    }

    toast({ title: "Meta criada" });
    setNewGoal({ title: "", description: "", type: "DAILY", target_value: 1, unit_label: "vezes" });
    setDialogOpen(false);
    fetchGoals();
  };

  const handleUpdateGoalValue = async (goal: Goal, delta: number) => {
    const newValue = Math.max(0, goal.current_value + delta);
    const completed = newValue >= goal.target_value;

    const { error } = await supabase
      .from("goals")
      .update({
        current_value: newValue,
        status: completed ? "COMPLETED" : "ACTIVE",
      })
      .eq("id", goal.id);

    if (error) {
      toast({ title: "Erro ao atualizar meta", variant: "destructive" });
      return;
    }

    if (completed && goal.status !== "COMPLETED") {
      toast({ title: "🎯 Meta batida!", description: goal.title });
    }

    fetchGoals();
  };

  const handleToggleStatus = async (goal: Goal) => {
    const newStatus: GoalStatus = goal.status === "PAUSED" ? "ACTIVE" : "PAUSED";

    const { error } = await supabase
      .from("goals")
      .update({ status: newStatus })
      .eq("id", goal.id);

    if (error) {
      toast({ title: "Erro ao atualizar meta", variant: "destructive" });
      return;
    }

    toast({ title: newStatus === "PAUSED" ? "Meta pausada" : "Meta ativada" });
    fetchGoals();
  };

  const handleDeleteGoal = async (goalId: string) => {
    const { error } = await supabase.from("goals").delete().eq("id", goalId);
    if (error) {
      toast({ title: "Erro ao excluir meta", variant: "destructive" });
      return;
    }
    toast({ title: "Meta excluída" });
    fetchGoals();
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
      })
      .eq("id", editingGoal.id);

    if (error) {
      toast({ title: "Erro ao atualizar meta", variant: "destructive" });
      return;
    }

    toast({ title: "Meta atualizada" });
    setEditingGoal(null);
    fetchGoals();
  };

  const filteredGoals = goals.filter((g) => g.type === activeTab);

  const getTypeLabel = (type: GoalType) => {
    switch (type) {
      case "DAILY": return "Diárias";
      case "WEEKLY": return "Semanais";
      case "MONTHLY": return "Mensais";
      case "YEARLY": return "Anuais";
    }
  };

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case "COMPLETED": return "text-success";
      case "PAUSED": return "text-muted-foreground";
      default: return "text-foreground";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Metas</h1>
          <p className="text-muted-foreground">
            Defina. Acompanhe. Conquiste.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  placeholder="Ex: Treinar 5x na semana"
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
                <Label>Tipo</Label>
                <Select
                  value={newGoal.type}
                  onValueChange={(v) => setNewGoal({ ...newGoal, type: v as GoalType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Semanal</SelectItem>
                    <SelectItem value="MONTHLY">Mensal</SelectItem>
                    <SelectItem value="YEARLY">Anual</SelectItem>
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
                    placeholder="vezes, litros, etc"
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
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as GoalType)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="WEEKLY">Semanais</TabsTrigger>
          <TabsTrigger value="MONTHLY">Mensais</TabsTrigger>
          <TabsTrigger value="YEARLY">Anuais</TabsTrigger>
        </TabsList>

        {(["WEEKLY", "MONTHLY", "YEARLY"] as GoalType[]).map((type) => (
          <TabsContent key={type} value={type} className="space-y-4 mt-6">
            {loading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="cave-card p-6 animate-pulse">
                    <div className="h-5 w-1/3 bg-muted rounded mb-4" />
                    <div className="h-2 w-full bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : filteredGoals.length === 0 ? (
              <div className="empty-state">
                <Target className="empty-state-icon" />
                <h3 className="empty-state-title">Nenhuma meta {getTypeLabel(type).toLowerCase()}</h3>
                <p className="empty-state-description">
                  Crie sua primeira meta para este período
                </p>
                <Button onClick={() => { setNewGoal({ ...newGoal, type }); setDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Meta
                </Button>
              </div>
            ) : (
              filteredGoals.map((goal) => {
                const progress = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
                const isCompleted = goal.status === "COMPLETED" || goal.current_value >= goal.target_value;

                return (
                  <div
                    key={goal.id}
                    className={cn(
                      "cave-card p-6 group",
                      goal.status === "PAUSED" && "opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={cn("font-semibold", getStatusColor(goal.status))}>
                            {goal.title}
                          </h3>
                          {isCompleted && (
                            <span className="cave-badge-success">
                              <Check className="h-3 w-3 mr-1" />
                              Batida
                            </span>
                          )}
                          {goal.status === "PAUSED" && (
                            <span className="cave-badge-default">Pausada</span>
                          )}
                        </div>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {goal.description}
                          </p>
                        )}
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleStatus(goal)}
                        >
                          {goal.status === "PAUSED" ? (
                            <Play className="h-3 w-3" />
                          ) : (
                            <Pause className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingGoal(goal)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {goal.current_value} / {goal.target_value} {goal.unit_label}
                        </span>
                        <span className={isCompleted ? "text-success" : ""}>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />

                      {goal.status !== "PAUSED" && (
                        <div className="flex items-center gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateGoalValue(goal, -1)}
                            disabled={goal.current_value === 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateGoalValue(goal, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <span className="text-sm text-muted-foreground ml-2">
                            Atualizar progresso
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        ))}
      </Tabs>

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
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
