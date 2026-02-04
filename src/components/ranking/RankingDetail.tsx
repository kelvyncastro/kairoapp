import { useState, useEffect, useRef, useCallback } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
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

  const acceptedParticipants = ranking.participants
    .filter((p) => p.status === "accepted")
    .sort((a, b) => b.total_points - a.total_points);

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
    const goal = ranking.goals.find((g) => g.id === goalId);
    const pointsPerGoal = 10 / ranking.goals.length;

    try {
      if (existingLog) {
        // Toggle off
        if (existingLog.completed) {
          await supabase
            .from("ranking_goal_logs")
            .update({ completed: false, points_earned: 0 })
            .eq("id", existingLog.id);

          // Update participant points
          await supabase
            .from("ranking_participants")
            .update({ total_points: Math.max(0, (currentUserParticipant?.total_points || 0) - pointsPerGoal) })
            .eq("ranking_id", ranking.id)
            .eq("user_id", user.id);

          setGoalLogs((prev) =>
            prev.map((l) => (l.id === existingLog.id ? { ...l, completed: false, points_earned: 0 } : l))
          );
        } else {
          // Toggle on
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
        // Create new log as completed
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

      // Refetch to sync state
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
        <Badge variant="outline" className="bg-success/20 text-success border-success/30">
          Ativo
        </Badge>
      );
    }
    if (isEnded) {
      return (
        <Badge variant="outline" className="bg-secondary text-secondary-foreground">
          Finalizado
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-muted text-muted-foreground">
        Aguardando
      </Badge>
    );
  };

  const getParticipantStatusBadge = (status: string, acceptedBet?: boolean) => {
    if (status === "accepted") {
      return (
        <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-success/20 text-success border-success/30">
          Aceito
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-warning/20 text-warning border-warning/30">
        Pendente
      </Badge>
    );
  };

  const dailyTotalPoints = 10;
  const completedToday = goalLogs.filter((l) => l.completed).length;
  const earnedToday = goalLogs.reduce((acc, l) => acc + l.points_earned, 0);

  return (
    <div className="h-full flex flex-col -m-4 md:-m-6 bg-background overflow-hidden">
      {/* Header */}
      <div className="px-4 md:px-6 py-4 border-b border-border/30 flex-shrink-0">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 mt-0.5 hover:bg-muted/50"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Trophy className="h-5 w-5 text-primary flex-shrink-0" />
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">{ranking.name}</h1>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {format(startDate, "dd MMM", { locale: ptBR })} - {format(endDate, "dd MMM yyyy", { locale: ptBR })}
            </p>
            
            {/* Action buttons - styled like reference */}
            {isCreator && (
              <div className="flex items-center gap-2 mt-3">
                {onEdit && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 gap-2 border-border/50 hover:bg-muted/50" 
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
                    className="h-9 gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
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
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content - Goals */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date Navigator */}
            <div className="cave-card p-5 rounded-xl">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-muted/50"
                  onClick={goToPreviousDay}
                  disabled={!canNavigateBack}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {format(selectedDate, "EEEE", { locale: ptBR })}
                  </p>
                  <p className="text-lg font-semibold mt-0.5">
                    {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-muted/50"
                  onClick={goToNextDay}
                  disabled={!canNavigateForward}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Goals Section */}
            <div className="cave-card p-5 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">Metas do Dia</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">{earnedToday.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground ml-1.5">de {dailyTotalPoints} pontos</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-muted/30 rounded-full mb-5 overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${(earnedToday / dailyTotalPoints) * 100}%` }}
                />
              </div>

              {loadingLogs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
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
                          "flex items-center gap-4 p-4 rounded-xl border transition-all duration-200",
                          isCompleted
                            ? "bg-primary/5 border-primary/20"
                            : "bg-muted/20 border-border/30 hover:border-border/50",
                          canToggle && "cursor-pointer"
                        )}
                        onClick={() => canToggle && handleToggleGoal(goal.id)}
                      >
                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted/50 text-base font-semibold text-muted-foreground">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-medium",
                            isCompleted && "text-foreground"
                          )}>
                            {goal.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {pointsPerGoal} pts
                          </p>
                        </div>
                        <Checkbox
                          checked={isCompleted}
                          disabled={!canToggle}
                          className={cn(
                            "h-6 w-6 rounded-md border-2",
                            isCompleted && "bg-primary border-primary",
                            isProcessing && "opacity-50"
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Not started message */}
              {isPending && (
                <div className="text-center py-10 mt-4">
                  <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    O ranking ainda não foi iniciado.
                  </p>
                </div>
              )}

              {/* Ended message */}
              {isEnded && (
                <div className="text-center py-10 mt-4">
                  <Trophy className="h-12 w-12 text-warning/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    O ranking foi finalizado.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Ranking & Participants */}
          <div className="space-y-6">
            {/* Classification */}
            <div className="cave-card p-5 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="h-5 w-5 text-warning" />
                <span className="font-semibold">Classificação</span>
              </div>

              {currentUserParticipant && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/20 border border-border/30">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-warning/20">
                    <Crown className="h-5 w-5 text-warning" />
                  </div>
                  <Avatar className="h-11 w-11 border-2 border-primary/30">
                    <AvatarImage src={currentUserParticipant.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {currentUserParticipant.profile?.first_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {currentUserParticipant.profile?.first_name || "Você"}{" "}
                      <span className="text-muted-foreground text-xs">(você)</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {currentUserParticipant.profile?.public_id || "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-primary">
                      {currentUserParticipant.total_points.toFixed(1)}
                    </span>
                    <p className="text-[11px] text-muted-foreground">pontos</p>
                  </div>
                </div>
              )}
            </div>

            {/* Participants */}
            <div className="cave-card p-5 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">Participantes</span>
              </div>

              <div className="space-y-3">
                {ranking.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-3 py-2"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={participant.profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-sm bg-muted">
                        {participant.profile?.first_name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {participant.profile?.first_name || "Usuário"}
                      </p>
                    </div>
                    {getParticipantStatusBadge(participant.status, participant.accepted_bet)}
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
