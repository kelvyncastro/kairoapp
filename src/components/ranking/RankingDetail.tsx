import { useState, useEffect, useCallback } from "react";
import { format, addDays, subDays, isSameDay, isAfter, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Crown,
  Pencil,
  Trash2,
  Target,
  Users,
  Trophy,
  Loader2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Ranking } from "@/hooks/useRankings";

interface RankingDetailProps {
  ranking: Ranking;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onRefetch: () => Promise<void>;
}

interface GoalLog {
  id: string;
  goal_id: string;
  date: string;
  completed: boolean;
  points_earned: number;
}

export function RankingDetail({ ranking, onBack, onEdit, onDelete, onRefetch }: RankingDetailProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [goalLogs, setGoalLogs] = useState<GoalLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [processingGoal, setProcessingGoal] = useState<string | null>(null);
  
  const isCreator = ranking.creator_id === user?.id;
  const isActive = ranking.status === "active";
  const isEnded = ranking.status === "ended";
  const isPending = ranking.status === "pending";
  
  const startDate = parseISO(ranking.start_date);
  const endDate = parseISO(ranking.end_date);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const canNavigateBack = isAfter(selectedDate, startDate);
  const canNavigateForward = isBefore(selectedDate, endDate) && isBefore(selectedDate, today);
  const isToday = isSameDay(selectedDate, today);

  const currentUserParticipant = ranking.participants.find((p) => p.user_id === user?.id);

  // Fetch goal logs for selected date
  const fetchGoalLogs = useCallback(async () => {
    if (!user || !isActive) return;
    
    setLoadingLogs(true);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("ranking_goal_logs")
        .select("*")
        .eq("ranking_id", ranking.id)
        .eq("user_id", user.id)
        .eq("date", dateStr);

      if (error) throw error;
      setGoalLogs(data || []);
    } catch (error) {
      console.error("Error fetching goal logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  }, [user, ranking.id, selectedDate, isActive]);

  useEffect(() => {
    fetchGoalLogs();
  }, [fetchGoalLogs]);

  const handleToggleGoal = async (goalId: string) => {
    if (!user || !isActive || !isToday || processingGoal) return;

    setProcessingGoal(goalId);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const existingLog = goalLogs.find((l) => l.goal_id === goalId);
    const pointsPerGoal = 10 / ranking.goals.length;

    try {
      if (existingLog) {
        if (existingLog.completed) {
          await supabase
            .from("ranking_goal_logs")
            .update({ completed: false, points_earned: 0 })
            .eq("id", existingLog.id);

          await supabase
            .from("ranking_participants")
            .update({ total_points: Math.max(0, (currentUserParticipant?.total_points || 0) - pointsPerGoal) })
            .eq("ranking_id", ranking.id)
            .eq("user_id", user.id);

          setGoalLogs((prev) =>
            prev.map((l) => (l.id === existingLog.id ? { ...l, completed: false, points_earned: 0 } : l))
          );
        } else {
          await supabase
            .from("ranking_goal_logs")
            .update({ completed: true, points_earned: pointsPerGoal })
            .eq("id", existingLog.id);

          await supabase
            .from("ranking_participants")
            .update({ total_points: (currentUserParticipant?.total_points || 0) + pointsPerGoal })
            .eq("ranking_id", ranking.id)
            .eq("user_id", user.id);

          setGoalLogs((prev) =>
            prev.map((l) => (l.id === existingLog.id ? { ...l, completed: true, points_earned: pointsPerGoal } : l))
          );
        }
      } else {
        const { data, error } = await supabase
          .from("ranking_goal_logs")
          .insert({
            ranking_id: ranking.id,
            goal_id: goalId,
            user_id: user.id,
            date: dateStr,
            completed: true,
            points_earned: pointsPerGoal,
          })
          .select()
          .single();

        if (error) throw error;

        await supabase
          .from("ranking_participants")
          .update({ total_points: (currentUserParticipant?.total_points || 0) + pointsPerGoal })
          .eq("ranking_id", ranking.id)
          .eq("user_id", user.id);

        setGoalLogs((prev) => [...prev, data]);
      }

      await onRefetch();
    } catch (error) {
      console.error("Error toggling goal:", error);
      toast({ title: "Erro ao atualizar meta", variant: "destructive" });
    } finally {
      setTimeout(() => setProcessingGoal(null), 300);
    }
  };

  const goToPreviousDay = () => {
    if (canNavigateBack) {
      setSelectedDate((prev) => subDays(prev, 1));
    }
  };

  const goToNextDay = () => {
    if (canNavigateForward) {
      setSelectedDate((prev) => addDays(prev, 1));
    }
  };

  const getStatusBadge = () => {
    if (isActive) {
      return (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30">
          Ativo
        </Badge>
      );
    }
    if (isEnded) {
      return (
        <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30">
          Finalizado
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
        Aguardando
      </Badge>
    );
  };

  const getParticipantStatusBadge = (status: string) => {
    if (status === "accepted") {
      return (
        <Badge className="text-[10px] px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-medium">
          Aceito
        </Badge>
      );
    }
    return (
      <Badge className="text-[10px] px-2.5 py-1 bg-amber-500/20 text-amber-400 border-amber-500/30 font-medium">
        Pendente
      </Badge>
    );
  };

  const dailyTotalPoints = 10;
  const earnedToday = goalLogs.reduce((acc, l) => acc + l.points_earned, 0);

  return (
    <div className="h-full flex flex-col -m-4 md:-m-6 bg-background overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 py-5 border-b border-border/20 flex-shrink-0 bg-gradient-to-b from-muted/30 to-transparent">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl hover:bg-muted/60 transition-colors"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase">{ranking.name}</h1>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {format(startDate, "dd MMM", { locale: ptBR })} - {format(endDate, "dd MMM yyyy", { locale: ptBR })}
            </p>
            
            {/* Action buttons */}
            {isCreator && (
              <div className="flex items-center gap-3 mt-4">
                {onEdit && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 gap-2 rounded-lg border-border/40 bg-muted/30 hover:bg-muted/60 transition-colors" 
                    onClick={onEdit}
                  >
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 rounded-lg border-destructive/40 text-destructive bg-destructive/10 hover:bg-destructive/20 transition-colors"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid gap-6 lg:grid-cols-3 max-w-7xl mx-auto">
          {/* Main content - Goals */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date Navigator */}
            <div className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl hover:bg-muted/60 transition-colors"
                  onClick={goToPreviousDay}
                  disabled={!canNavigateBack}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground capitalize">
                    {format(selectedDate, "EEEE", { locale: ptBR })}
                  </p>
                  <p className="text-xl font-semibold mt-1">
                    {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-xl hover:bg-muted/60 transition-colors"
                  onClick={goToNextDay}
                  disabled={!canNavigateForward}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Goals Section */}
            <div className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50">
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <span className="font-semibold text-lg">Metas do Dia</span>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-bold text-primary">{earnedToday.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground ml-2">de {dailyTotalPoints} pontos</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-muted/40 rounded-full mb-6 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(earnedToday / dailyTotalPoints) * 100}%` }}
                />
              </div>

              {loadingLogs ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                </div>
              ) : (
                <div className="space-y-3">
                  {ranking.goals.map((goal, index) => {
                    const log = goalLogs.find((l) => l.goal_id === goal.id);
                    const isCompleted = log?.completed || false;
                    const pointsPerGoal = (10 / ranking.goals.length).toFixed(1);
                    const isProcessing = processingGoal === goal.id;
                    const canToggle = isActive && isToday && !isProcessing;

                    return (
                      <div
                        key={goal.id}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl border transition-all duration-300",
                          isCompleted
                            ? "bg-primary/5 border-primary/30 shadow-sm shadow-primary/10"
                            : "bg-muted/20 border-border/30 hover:border-border/50 hover:bg-muted/30",
                          canToggle && "cursor-pointer"
                        )}
                        onClick={() => canToggle && handleToggleGoal(goal.id)}
                      >
                        <div className={cn(
                          "flex items-center justify-center h-11 w-11 rounded-xl text-base font-bold transition-colors",
                          isCompleted 
                            ? "bg-primary/20 text-primary" 
                            : "bg-muted/60 text-muted-foreground"
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-semibold text-base transition-colors",
                            isCompleted ? "text-foreground" : "text-foreground/80"
                          )}>
                            {goal.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {pointsPerGoal} pts
                          </p>
                        </div>
                        <div className={cn(
                          "flex items-center justify-center h-7 w-7 rounded-lg border-2 transition-all duration-300",
                          isCompleted 
                            ? "bg-primary border-primary" 
                            : "bg-transparent border-muted-foreground/30",
                          isProcessing && "opacity-50"
                        )}>
                          {isCompleted && <Check className="h-4 w-4 text-primary-foreground" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Not started message */}
              {isPending && (
                <div className="text-center py-12">
                  <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-muted/30 mx-auto mb-4">
                    <Target className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground text-lg">
                    O ranking ainda não foi iniciado.
                  </p>
                </div>
              )}

              {/* Ended message */}
              {isEnded && (
                <div className="text-center py-12">
                  <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-500/10 mx-auto mb-4">
                    <Trophy className="h-8 w-8 text-amber-500/70" />
                  </div>
                  <p className="text-muted-foreground text-lg">
                    O ranking foi finalizado.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Ranking & Participants */}
          <div className="space-y-6">
            {/* Classification */}
            <div className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-500/10">
                  <Crown className="h-4 w-4 text-amber-500" />
                </div>
                <span className="font-semibold text-lg">Classificação</span>
              </div>

              {currentUserParticipant && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border/30">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-500/20">
                    <Crown className="h-5 w-5 text-amber-500" />
                  </div>
                  <Avatar className="h-12 w-12 border-2 border-primary/40 ring-2 ring-primary/10">
                    <AvatarImage src={currentUserParticipant.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                      {currentUserParticipant.profile?.first_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">
                      {currentUserParticipant.profile?.first_name || "Você"}{" "}
                      <span className="text-muted-foreground text-xs font-normal">(você)</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ID: {currentUserParticipant.profile?.public_id || "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-primary">
                      {currentUserParticipant.total_points.toFixed(1)}
                    </span>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </div>
                </div>
              )}
            </div>

            {/* Participants */}
            <div className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm p-5">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-muted/50">
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="font-semibold text-lg">Participantes</span>
              </div>

              <div className="space-y-3">
                {ranking.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 py-2"
                  >
                    <Avatar className="h-10 w-10 border border-border/30">
                      <AvatarImage src={participant.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-sm bg-muted font-medium">
                        {participant.profile?.first_name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {participant.profile?.first_name || "Usuário"}
                      </p>
                    </div>
                    {getParticipantStatusBadge(participant.status)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
