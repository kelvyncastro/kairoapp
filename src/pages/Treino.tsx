import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Dumbbell,
  Play,
  Square,
  Clock,
  Trash2,
  Check,
  Timer,
  TrendingUp,
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
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface WorkoutPlan {
  id: string;
  name: string;
  description: string | null;
}

interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
}

interface WorkoutSession {
  id: string;
  plan_id: string | null;
  datetime_start: string;
  datetime_end: string | null;
  total_volume: number;
  notes: string | null;
}

interface WorkoutSet {
  id: string;
  set_number: number;
  reps: number;
  weight_kg: number;
  completed: boolean;
  rpe: number | null;
}

interface ExerciseEntry {
  id: string;
  exercise_id: string;
  exercise_name: string;
  sets: WorkoutSet[];
}

export default function Treino() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [sessionExercises, setSessionExercises] = useState<ExerciseEntry[]>([]);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restStartTime, setRestStartTime] = useState<number | null>(null);
  
  const [newPlanOpen, setNewPlanOpen] = useState(false);
  const [newExerciseOpen, setNewExerciseOpen] = useState(false);
  const [startSessionOpen, setStartSessionOpen] = useState(false);
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  
  const [newPlan, setNewPlan] = useState({ name: "", description: "" });
  const [newExercise, setNewExercise] = useState({ name: "", muscle_group: "" });
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [plansRes, exercisesRes, sessionsRes] = await Promise.all([
      supabase.from("workout_plans").select("*").eq("user_id", user.id).order("name"),
      supabase.from("exercises").select("*").eq("user_id", user.id).order("name"),
      supabase.from("workout_sessions").select("*").eq("user_id", user.id).order("datetime_start", { ascending: false }).limit(20),
    ]);

    setPlans((plansRes.data as WorkoutPlan[]) || []);
    setExercises((exercisesRes.data as Exercise[]) || []);
    setSessions((sessionsRes.data as WorkoutSession[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (restTimer === null || restStartTime === null) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - restStartTime) / 1000);
      const remaining = Math.max(0, restTimer - elapsed);
      
      if (remaining === 0) {
        setRestTimer(null);
        setRestStartTime(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimer, restStartTime]);

  const handleCreatePlan = async () => {
    if (!user || !newPlan.name.trim()) return;

    const { error } = await supabase.from("workout_plans").insert({
      user_id: user.id,
      name: newPlan.name,
      description: newPlan.description || null,
    });

    if (error) {
      toast({ title: "Erro ao criar plano", variant: "destructive" });
      return;
    }

    toast({ title: "Plano criado" });
    setNewPlan({ name: "", description: "" });
    setNewPlanOpen(false);
    fetchData();
  };

  const handleCreateExercise = async () => {
    if (!user || !newExercise.name.trim()) return;

    const { error } = await supabase.from("exercises").insert({
      user_id: user.id,
      name: newExercise.name,
      muscle_group: newExercise.muscle_group || null,
    });

    if (error) {
      toast({ title: "Erro ao criar exercício", variant: "destructive" });
      return;
    }

    toast({ title: "Exercício criado" });
    setNewExercise({ name: "", muscle_group: "" });
    setNewExerciseOpen(false);
    fetchData();
  };

  const handleStartSession = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: user.id,
        plan_id: selectedPlanId && selectedPlanId !== "none" ? selectedPlanId : null,
      })
      .select()
      .single();

    if (error || !data) {
      toast({ title: "Erro ao iniciar treino", variant: "destructive" });
      return;
    }

    setActiveSession(data as WorkoutSession);
    setSessionExercises([]);
    setStartSessionOpen(false);
    toast({ title: "Treino iniciado! 💪" });
  };

  const handleAddExerciseToSession = async () => {
    if (!activeSession || !selectedExerciseId) return;

    const exercise = exercises.find((e) => e.id === selectedExerciseId);
    if (!exercise) return;

    const { data, error } = await supabase
      .from("workout_exercise_entries")
      .insert({
        session_id: activeSession.id,
        exercise_id: selectedExerciseId,
        order_index: sessionExercises.length,
      })
      .select()
      .single();

    if (error || !data) {
      toast({ title: "Erro ao adicionar exercício", variant: "destructive" });
      return;
    }

    const { data: setData } = await supabase
      .from("workout_sets")
      .insert({
        exercise_entry_id: data.id,
        set_number: 1,
        reps: 0,
        weight_kg: 0,
      })
      .select()
      .single();

    setSessionExercises([
      ...sessionExercises,
      {
        id: data.id,
        exercise_id: selectedExerciseId,
        exercise_name: exercise.name,
        sets: setData ? [setData as WorkoutSet] : [],
      },
    ]);

    setAddExerciseOpen(false);
    setSelectedExerciseId("");
  };

  const handleAddSet = async (entryId: string) => {
    const entry = sessionExercises.find((e) => e.id === entryId);
    if (!entry) return;

    const lastSet = entry.sets[entry.sets.length - 1];
    const { data, error } = await supabase
      .from("workout_sets")
      .insert({
        exercise_entry_id: entryId,
        set_number: entry.sets.length + 1,
        reps: lastSet?.reps || 0,
        weight_kg: lastSet?.weight_kg || 0,
      })
      .select()
      .single();

    if (error || !data) return;

    setSessionExercises(
      sessionExercises.map((e) =>
        e.id === entryId ? { ...e, sets: [...e.sets, data as WorkoutSet] } : e
      )
    );
  };

  const handleUpdateSet = async (
    entryId: string,
    setId: string,
    field: "reps" | "weight_kg",
    value: number
  ) => {
    await supabase
      .from("workout_sets")
      .update({ [field]: value })
      .eq("id", setId);

    setSessionExercises(
      sessionExercises.map((e) =>
        e.id === entryId
          ? {
              ...e,
              sets: e.sets.map((s) =>
                s.id === setId ? { ...s, [field]: value } : s
              ),
            }
          : e
      )
    );
  };

  const handleCompleteSet = async (entryId: string, setId: string) => {
    await supabase
      .from("workout_sets")
      .update({ completed: true })
      .eq("id", setId);

    setSessionExercises(
      sessionExercises.map((e) =>
        e.id === entryId
          ? {
              ...e,
              sets: e.sets.map((s) =>
                s.id === setId ? { ...s, completed: true } : s
              ),
            }
          : e
      )
    );

    setRestTimer(90);
    setRestStartTime(Date.now());
  };

  const handleFinishSession = async () => {
    if (!activeSession) return;

    let totalVolume = 0;
    sessionExercises.forEach((entry) => {
      entry.sets.forEach((set) => {
        if (set.completed) {
          totalVolume += set.reps * set.weight_kg;
        }
      });
    });

    await supabase
      .from("workout_sessions")
      .update({
        datetime_end: new Date().toISOString(),
        total_volume: totalVolume,
      })
      .eq("id", activeSession.id);

    const today = format(new Date(), "yyyy-MM-dd");
    await supabase.from("consistency_days").upsert(
      {
        user_id: user?.id,
        date: today,
        is_active: true,
        reason: "workout",
      },
      { onConflict: "user_id,date" }
    );

    toast({
      title: "Treino finalizado! 🎉",
      description: `Volume total: ${totalVolume.toFixed(0)} kg`,
    });

    setActiveSession(null);
    setSessionExercises([]);
    setRestTimer(null);
    fetchData();
  };

  const handleDeletePlan = async (planId: string) => {
    await supabase.from("workout_plans").delete().eq("id", planId);
    toast({ title: "Plano excluído" });
    fetchData();
  };

  const remainingRest = restTimer !== null && restStartTime !== null
    ? Math.max(0, restTimer - Math.floor((Date.now() - restStartTime) / 1000))
    : 0;

  // Active Session View
  if (activeSession) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col -m-6 bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold">Treino em Andamento</h1>
            <p className="text-sm text-muted-foreground">
              Iniciado às {format(new Date(activeSession.datetime_start), "HH:mm")}
            </p>
          </div>
          <Button variant="destructive" onClick={handleFinishSession}>
            <Square className="h-4 w-4 mr-2" />
            Finalizar
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Rest Timer */}
          {restTimer !== null && (
            <div className="cave-card p-4 flex items-center justify-between animate-pulse-subtle">
              <div className="flex items-center gap-3">
                <Timer className="h-5 w-5" />
                <span className="font-bold uppercase tracking-wider text-sm">Descanso</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono">{remainingRest}s</span>
                <Button size="sm" variant="outline" onClick={() => { setRestTimer(null); setRestStartTime(null); }}>
                  Pular
                </Button>
              </div>
            </div>
          )}

          {/* Exercises */}
          <div className="space-y-4">
            {sessionExercises.map((entry) => (
              <div key={entry.id} className="cave-card p-5">
                <h3 className="font-bold uppercase tracking-wider text-sm mb-4">{entry.exercise_name}</h3>
                
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">
                    <div className="col-span-2">Série</div>
                    <div className="col-span-3">Peso (kg)</div>
                    <div className="col-span-3">Reps</div>
                    <div className="col-span-4" />
                  </div>

                  {entry.sets.map((set) => (
                    <div
                      key={set.id}
                      className={cn(
                        "grid grid-cols-12 gap-2 items-center p-2 rounded-md",
                        set.completed ? "bg-success/10" : "bg-secondary/50"
                      )}
                    >
                      <div className="col-span-2 text-sm font-medium">
                        {set.set_number}
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          value={set.weight_kg}
                          onChange={(e) =>
                            handleUpdateSet(entry.id, set.id, "weight_kg", Number(e.target.value))
                          }
                          disabled={set.completed}
                          className="h-8 text-center"
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          value={set.reps}
                          onChange={(e) =>
                            handleUpdateSet(entry.id, set.id, "reps", Number(e.target.value))
                          }
                          disabled={set.completed}
                          className="h-8 text-center"
                        />
                      </div>
                      <div className="col-span-4 flex justify-end">
                        {set.completed ? (
                          <span className="text-success text-sm flex items-center gap-1">
                            <Check className="h-4 w-4" /> Feito
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleCompleteSet(entry.id, set.id)}
                            disabled={set.reps === 0}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleAddSet(entry.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Série
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Exercise */}
          <Dialog open={addExerciseOpen} onOpenChange={setAddExerciseOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Exercício
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Exercício</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um exercício" />
                  </SelectTrigger>
                  <SelectContent>
                    {exercises.map((ex) => (
                      <SelectItem key={ex.id} value={ex.id}>
                        {ex.name} {ex.muscle_group && `(${ex.muscle_group})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button onClick={handleAddExerciseToSession} disabled={!selectedExerciseId}>
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col -m-6 bg-background">
        <div className="px-6 py-4 border-b border-border/30">
          <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
        </div>
        <div className="flex-1 p-6">
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-48 bg-muted/30 rounded-lg animate-pulse" />
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
          <h1 className="text-2xl font-bold">Treino</h1>
          <p className="text-sm text-muted-foreground">Força nasce da consistência.</p>
        </div>

        <Dialog open={startSessionOpen} onOpenChange={setStartSessionOpen}>
          <DialogTrigger asChild>
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Iniciar Treino
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Iniciar Treino</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Plano (opcional)</Label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem plano</SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleStartSession}>
                <Play className="h-4 w-4 mr-2" />
                Começar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Plans & Exercises */}
        <div className="px-6 py-5">
          <h2 className="text-xl font-bold text-foreground uppercase tracking-wider mb-4">
            Configuração
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Plans */}
            <div className="cave-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold uppercase tracking-wider text-sm">Planos de Treino</h3>
                <Dialog open={newPlanOpen} onOpenChange={setNewPlanOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Plano</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input
                          placeholder="Ex: Peito e Tríceps"
                          value={newPlan.name}
                          onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                          placeholder="Detalhes do plano..."
                          value={newPlan.description}
                          onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreatePlan} disabled={!newPlan.name.trim()}>
                        Criar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {plans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum plano criado</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {plans.map((plan) => (
                    <div
                      key={plan.id}
                      className="flex items-center justify-between p-3 rounded-md bg-secondary/50 group"
                    >
                      <div>
                        <p className="font-medium">{plan.name}</p>
                        {plan.description && (
                          <p className="text-xs text-muted-foreground">{plan.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 text-destructive"
                        onClick={() => handleDeletePlan(plan.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Exercises */}
            <div className="cave-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold uppercase tracking-wider text-sm">Exercícios</h3>
                <Dialog open={newExerciseOpen} onOpenChange={setNewExerciseOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Novo Exercício</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input
                          placeholder="Ex: Supino Reto"
                          value={newExercise.name}
                          onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Grupo Muscular</Label>
                        <Input
                          placeholder="Ex: Peito"
                          value={newExercise.muscle_group}
                          onChange={(e) => setNewExercise({ ...newExercise, muscle_group: e.target.value })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateExercise} disabled={!newExercise.name.trim()}>
                        Criar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {exercises.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum exercício cadastrado</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {exercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between p-3 rounded-md bg-secondary/50"
                    >
                      <div>
                        <p className="font-medium">{ex.name}</p>
                        {ex.muscle_group && (
                          <p className="text-xs text-muted-foreground">{ex.muscle_group}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="px-6 py-5 border-t border-border/30">
          <h2 className="text-xl font-bold text-foreground uppercase tracking-wider mb-4">
            Histórico
          </h2>
          <div className="cave-card p-6">
            {sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum treino registrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-md bg-secondary/50"
                  >
                    <div>
                      <p className="font-medium">
                        {format(new Date(session.datetime_start), "dd/MM/yyyy HH:mm")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Volume: {session.total_volume.toFixed(0)} kg
                      </p>
                    </div>
                    {session.total_volume > 0 && (
                      <TrendingUp className="h-4 w-4 text-success" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
