import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  Dumbbell,
  Heart,
  User,
  Edit2,
  Trash2,
  TrendingUp,
  Calendar,
  X,
  Check,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

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

interface GoalDetailModalProps {
  goal: Goal | null;
  progressHistory: ProgressEntry[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

const CATEGORY_CONFIG: Record<GoalCategory, { label: string; icon: React.ReactNode; color: string }> = {
  FINANCIAL: { label: "Financeira", icon: <DollarSign className="h-4 w-4" />, color: "#22c55e" },
  FITNESS: { label: "Fitness", icon: <Dumbbell className="h-4 w-4" />, color: "#f59e0b" },
  HEALTH: { label: "Saúde", icon: <Heart className="h-4 w-4" />, color: "#ef4444" },
  PERSONAL: { label: "Pessoal", icon: <User className="h-4 w-4" />, color: "#8b5cf6" },
};

export function GoalDetailModal({
  goal,
  progressHistory,
  open,
  onOpenChange,
  onRefresh,
}: GoalDetailModalProps) {
  const { toast } = useToast();
  const [editingEntry, setEditingEntry] = useState<ProgressEntry | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editNote, setEditNote] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!goal) return null;

  const progress = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
  const isCompleted = goal.status === "COMPLETED" || goal.current_value >= goal.target_value;
  const categoryConfig = CATEGORY_CONFIG[goal.category] || CATEGORY_CONFIG.PERSONAL;

  const chartData = progressHistory.map((entry, index) => ({
    index: index + 1,
    value: entry.value,
    date: format(new Date(entry.created_at), "dd/MM", { locale: ptBR }),
  }));

  const handleStartEdit = (entry: ProgressEntry) => {
    setEditingEntry(entry);
    setEditValue(entry.value.toString());
    setEditNote(entry.note || "");
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditValue("");
    setEditNote("");
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    const newValue = parseFloat(editValue);
    if (isNaN(newValue)) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("goal_progress_history")
      .update({
        value: newValue,
        note: editNote || null,
      })
      .eq("id", editingEntry.id);

    if (error) {
      toast({ title: "Erro ao atualizar registro", variant: "destructive" });
      return;
    }

    // Update goal current_value to the latest entry value
    const latestValue = progressHistory.reduce((latest, entry) => {
      if (entry.id === editingEntry.id) {
        return { ...entry, value: newValue };
      }
      return new Date(entry.created_at) > new Date(latest.created_at) ? entry : latest;
    }, progressHistory[0]);

    // If we edited the latest entry, update the goal
    const sortedHistory = [...progressHistory].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    if (sortedHistory[0]?.id === editingEntry.id) {
      await supabase
        .from("goals")
        .update({
          current_value: newValue,
          status: newValue >= goal.target_value ? "COMPLETED" : "ACTIVE",
        })
        .eq("id", goal.id);
    }

    toast({ title: "Registro atualizado" });
    handleCancelEdit();
    onRefresh();
  };

  const handleDeleteEntry = async (entryId: string) => {
    const { error } = await supabase
      .from("goal_progress_history")
      .delete()
      .eq("id", entryId);

    if (error) {
      toast({ title: "Erro ao excluir registro", variant: "destructive" });
      return;
    }

    // Recalculate current value from remaining history
    const remainingHistory = progressHistory.filter((e) => e.id !== entryId);
    const sortedRemaining = remainingHistory.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const newCurrentValue = sortedRemaining[0]?.value ?? 0;

    await supabase
      .from("goals")
      .update({
        current_value: newCurrentValue,
        status: newCurrentValue >= goal.target_value ? "COMPLETED" : "ACTIVE",
      })
      .eq("id", goal.id);

    toast({ title: "Registro excluído" });
    setDeleteConfirmId(null);
    onRefresh();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${categoryConfig.color}20`, color: categoryConfig.color }}
              >
                {categoryConfig.icon}
              </span>
              <div>
                <DialogTitle className="text-xl">{goal.title}</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {categoryConfig.label} • Criada em {format(new Date(goal.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-6 py-4">
            {/* Description */}
            {goal.description && (
              <p className="text-muted-foreground">{goal.description}</p>
            )}

            {/* Progress Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Progresso</span>
                <div className="flex items-center gap-2">
                  {isCompleted && (
                    <span className="cave-badge-success text-xs">✓ Alcançada</span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>
                  {goal.current_value.toLocaleString("pt-BR")} / {goal.target_value.toLocaleString("pt-BR")} {goal.unit_label}
                </span>
                <span style={{ color: categoryConfig.color }}>{progress}%</span>
              </div>
              <Progress
                value={progress}
                className="h-4"
                style={{
                  // @ts-ignore
                  "--progress-color": isCompleted ? "hsl(var(--success))" : categoryConfig.color,
                }}
              />
            </div>

            {/* Chart */}
            {chartData.length > 1 && (
              <div className="h-32 border rounded-lg p-3 bg-muted/30">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Evolução
                </h4>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`gradient-detail-${goal.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={categoryConfig.color} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={categoryConfig.color} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    />
                    <YAxis hide />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-background border border-border rounded-lg px-3 py-2 shadow-lg">
                              <p className="text-xs text-muted-foreground">{payload[0].payload.date}</p>
                              <p className="text-sm font-semibold">
                                {Number(payload[0].value).toLocaleString("pt-BR")} {goal.unit_label}
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
                      fill={`url(#gradient-detail-${goal.id})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* History */}
            <div className="flex-1 min-h-0">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Histórico de Atualizações
              </h4>
              
              {progressHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum registro de progresso ainda</p>
                </div>
              ) : (
                <ScrollArea className="h-[200px] pr-4">
                  <div className="space-y-2">
                    {[...progressHistory]
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                        >
                          {editingEntry?.id === entry.id ? (
                            <div className="flex-1 flex items-center gap-2">
                              <div className="flex-1 space-y-2">
                                <div className="flex gap-2">
                                  <Input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    className="h-8"
                                    placeholder="Valor"
                                  />
                                  <Input
                                    value={editNote}
                                    onChange={(e) => setEditNote(e.target.value)}
                                    className="h-8"
                                    placeholder="Nota (opcional)"
                                  />
                                </div>
                              </div>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveEdit}>
                                <Check className="h-4 w-4 text-success" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {entry.value.toLocaleString("pt-BR")} {goal.unit_label}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {format(new Date(entry.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  </span>
                                </div>
                                {entry.note && (
                                  <p className="text-sm text-muted-foreground mt-0.5">{entry.note}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8"
                                  onClick={() => handleStartEdit(entry)}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteConfirmId(entry.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será removido permanentemente do histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmId && handleDeleteEntry(deleteConfirmId)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
