import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Trash2,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { format, addDays, subDays, isToday, isTomorrow, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Task {
  id: string;
  title: string;
  description: string | null;
  date: string;
  completed: boolean;
  priority: number;
  is_recurring: boolean;
  recurring_rule: string | null;
  completed_at: string | null;
}

interface NewTask {
  title: string;
  description: string;
  priority: number;
  is_recurring: boolean;
  recurring_rule: string;
}

export default function Rotina() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const [newTask, setNewTask] = useState<NewTask>({
    title: "",
    description: "",
    priority: 2,
    is_recurring: false,
    recurring_rule: "DAILY",
  });

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true });

    if (error) {
      toast({ title: "Erro ao carregar tarefas", variant: "destructive" });
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  }, [user, dateStr, toast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const updateConsistency = async () => {
    if (!user) return;
    
    // Check if user has completed any task today or has any workout/diet logged
    const { data: tasksToday } = await supabase
      .from("daily_tasks")
      .select("id")
      .eq("user_id", user.id)
      .eq("date", dateStr)
      .eq("completed", true)
      .limit(1);

    const isActive = (tasksToday?.length || 0) > 0;

    // Upsert consistency day
    await supabase.from("consistency_days").upsert(
      {
        user_id: user.id,
        date: dateStr,
        is_active: isActive,
        reason: isActive ? "tasks" : null,
      },
      { onConflict: "user_id,date" }
    );
  };

  const handleCreateTask = async () => {
    if (!user || !newTask.title.trim()) return;

    if (newTask.is_recurring) {
      // Create tasks for next 30 days if recurring
      const dates = [];
      for (let i = 0; i < 30; i++) {
        const date = addDays(selectedDate, i);
        const dayOfWeek = date.getDay();

        if (newTask.recurring_rule === "DAILY") {
          dates.push(format(date, "yyyy-MM-dd"));
        } else if (newTask.recurring_rule === "WEEKDAYS" && dayOfWeek >= 1 && dayOfWeek <= 5) {
          dates.push(format(date, "yyyy-MM-dd"));
        }
      }

      const tasksToInsert = dates.map((date) => ({
        user_id: user.id,
        title: newTask.title,
        description: newTask.description || null,
        date,
        priority: newTask.priority,
        is_recurring: true,
        recurring_rule: newTask.recurring_rule,
      }));

      const { error } = await supabase.from("daily_tasks").insert(tasksToInsert);
      if (error) {
        toast({ title: "Erro ao criar tarefas", variant: "destructive" });
        return;
      }
      toast({ title: "Tarefas recorrentes criadas", description: `${dates.length} tarefas criadas` });
    } else {
      const { error } = await supabase.from("daily_tasks").insert({
        user_id: user.id,
        title: newTask.title,
        description: newTask.description || null,
        date: dateStr,
        priority: newTask.priority,
        is_recurring: false,
      });

      if (error) {
        toast({ title: "Erro ao criar tarefa", variant: "destructive" });
        return;
      }
      toast({ title: "Tarefa criada" });
    }

    setNewTask({ title: "", description: "", priority: 2, is_recurring: false, recurring_rule: "DAILY" });
    setDialogOpen(false);
    fetchTasks();
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;

    const { error } = await supabase
      .from("daily_tasks")
      .update({
        title: editingTask.title,
        description: editingTask.description,
        priority: editingTask.priority,
      })
      .eq("id", editingTask.id);

    if (error) {
      toast({ title: "Erro ao atualizar tarefa", variant: "destructive" });
      return;
    }

    toast({ title: "Tarefa atualizada" });
    setEditingTask(null);
    fetchTasks();
  };

  const handleToggleTask = async (task: Task) => {
    const completed = !task.completed;
    const { error } = await supabase
      .from("daily_tasks")
      .update({
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .eq("id", task.id);

    if (error) {
      toast({ title: "Erro ao atualizar tarefa", variant: "destructive" });
      return;
    }

    fetchTasks();
    updateConsistency();
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase.from("daily_tasks").delete().eq("id", taskId);
    if (error) {
      toast({ title: "Erro ao excluir tarefa", variant: "destructive" });
      return;
    }
    toast({ title: "Tarefa excluída" });
    fetchTasks();
    updateConsistency();
  };

  const getDateLabel = () => {
    if (isToday(selectedDate)) return "Hoje";
    if (isTomorrow(selectedDate)) return "Amanhã";
    if (isYesterday(selectedDate)) return "Ontem";
    return format(selectedDate, "d 'de' MMMM", { locale: ptBR });
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "pending") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 3: return "Alta";
      case 2: return "Média";
      default: return "Baixa";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Rotina</h1>
          <p className="text-muted-foreground">
            Marca e segue. Sem desculpas.
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  placeholder="O que você precisa fazer?"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateTask()}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea
                  placeholder="Detalhes da tarefa..."
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={String(newTask.priority)}
                  onValueChange={(v) => setNewTask({ ...newTask, priority: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Baixa</SelectItem>
                    <SelectItem value="2">Média</SelectItem>
                    <SelectItem value="3">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Tarefa recorrente</Label>
                <Switch
                  checked={newTask.is_recurring}
                  onCheckedChange={(v) => setNewTask({ ...newTask, is_recurring: v })}
                />
              </div>
              {newTask.is_recurring && (
                <div className="space-y-2">
                  <Label>Repetir</Label>
                  <Select
                    value={newTask.recurring_rule}
                    onValueChange={(v) => setNewTask({ ...newTask, recurring_rule: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Todo dia</SelectItem>
                      <SelectItem value="WEEKDAYS">Dias úteis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateTask} disabled={!newTask.title.trim()}>
                Criar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-between cave-card p-4">
        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{getDateLabel()}</span>
          <span className="text-sm text-muted-foreground">
            {format(selectedDate, "dd/MM/yyyy")}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress */}
      <div className="cave-card p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            {completedCount} de {tasks.length} concluídas
          </span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "pending", "completed"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Todas" : f === "pending" ? "Pendentes" : "Concluídas"}
          </Button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="cave-card p-4 animate-pulse">
                <div className="h-5 w-2/3 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <Calendar className="empty-state-icon" />
            <h3 className="empty-state-title">
              {filter === "all" ? "Nenhuma tarefa" : filter === "pending" ? "Nenhuma pendente" : "Nenhuma concluída"}
            </h3>
            <p className="empty-state-description">
              {filter === "all"
                ? "Crie sua primeira tarefa para este dia"
                : "Continue trabalhando!"}
            </p>
            {filter === "all" && (
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Tarefa
              </Button>
            )}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                "cave-card p-4 flex items-center gap-4 group transition-all",
                task.completed && "opacity-60"
              )}
            >
              <Checkbox
                checked={task.completed}
                onCheckedChange={() => handleToggleTask(task)}
                className="h-5 w-5"
              />

              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "font-medium truncate",
                    task.completed && "line-through text-muted-foreground"
                  )}
                >
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-sm text-muted-foreground truncate">
                    {task.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs px-2 py-1 rounded",
                    task.priority === 3
                      ? "bg-primary/20 text-primary"
                      : task.priority === 2
                      ? "bg-muted text-muted-foreground"
                      : "bg-secondary text-secondary-foreground"
                  )}
                >
                  {getPriorityLabel(task.priority)}
                </span>

                {task.is_recurring && (
                  <span className="text-xs text-muted-foreground">🔄</span>
                )}

                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingTask(task)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDeleteTask(task.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTask} onOpenChange={(open) => !open && setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select
                  value={String(editingTask.priority)}
                  onValueChange={(v) => setEditingTask({ ...editingTask, priority: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Baixa</SelectItem>
                    <SelectItem value="2">Média</SelectItem>
                    <SelectItem value="3">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateTask}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
