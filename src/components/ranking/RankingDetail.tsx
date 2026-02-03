import { useState, useEffect, useRef } from "react";
import { 
  Trophy, Calendar, Target, Users, Coins, ArrowLeft, 
  Check, ChevronLeft, ChevronRight, Crown, Medal, Pencil, Sparkles, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RankingWithDetails, RankingGoalLog } from "@/types/ranking";
import { useAuth } from "@/contexts/AuthContext";
import { useRankings } from "@/hooks/useRankings";
import { CreateRankingDialog } from "./CreateRankingDialog";
import { RankingWinnerCelebration } from "./RankingWinnerCelebration";
import { format, addDays, subDays, isWithinInterval, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface RankingDetailProps {
  ranking: RankingWithDetails;
  onBack: () => void;
}

export function RankingDetail({ ranking: initialRanking, onBack }: RankingDetailProps) {
  const { user } = useAuth();
  const { 
    toggleGoalCompletion, 
    getGoalLogs, 
    fetchRankings, 
    rankings, 
    deleteRanking,
    requestDeletion,
    consentToDeletion,
    cancelDeletionRequest
  } = useRankings();
  
  // Get the latest ranking data from the hook
  const ranking = rankings.find(r => r.id === initialRanking.id) || initialRanking;
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [goalLogs, setGoalLogs] = useState<RankingGoalLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const [showWinnerCelebration, setShowWinnerCelebration] = useState(false);
  const celebrationShownRef = useRef(false);

  const startDate = parseISO(ranking.start_date);
  const endDate = parseISO(ranking.end_date);
  const isActive = ranking.status === 'active';
  const isCreator = ranking.creator_id === user?.id;
  const canEdit = isCreator && ranking.status === 'pending';
  const canDeleteDirectly = isCreator && (ranking.status === 'pending' || ranking.status === 'completed');
  const canRequestDeletion = isCreator && ranking.status === 'active' && !ranking.deletion_requested;
  
  // Check deletion consent status
  const acceptedParticipants = ranking.participants.filter(p => p.status === 'accepted');
  const allConsented = acceptedParticipants.every(p => p.deletion_consent === true);
  const currentUserParticipant = ranking.participants.find(p => p.user_id === user?.id);
  const userHasConsented = currentUserParticipant?.deletion_consent === true;
  const consentCount = acceptedParticipants.filter(p => p.deletion_consent).length;
  
  const isDateInRange = isWithinInterval(selectedDate, { start: startDate, end: endDate });
  const canEditGoals = isActive && isDateInRange;

  const leaderboard = [...ranking.participants]
    .filter(p => p.status === 'accepted')
    .sort((a, b) => b.total_points - a.total_points);

  const winner = leaderboard.length > 0 ? leaderboard[0] : null;

  // Show celebration when ranking is completed
  useEffect(() => {
    if (ranking.status === 'completed' && winner && !celebrationShownRef.current) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setShowWinnerCelebration(true);
        celebrationShownRef.current = true;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ranking.status, winner]);

  useEffect(() => {
    const loadGoalLogs = async () => {
      setLoading(true);
      const logs = await getGoalLogs(ranking.id, format(selectedDate, 'yyyy-MM-dd'));
      setGoalLogs(logs);
      setLoading(false);
    };
    loadGoalLogs();
  }, [selectedDate, ranking.id]);

  const handleToggleGoal = async (goalId: string, completed: boolean) => {
    if (!canEditGoals) return;
    
    await toggleGoalCompletion(
      ranking.id,
      goalId,
      format(selectedDate, 'yyyy-MM-dd'),
      completed
    );
    
    // Refresh goal logs
    const logs = await getGoalLogs(ranking.id, format(selectedDate, 'yyyy-MM-dd'));
    setGoalLogs(logs);
    await fetchRankings();
  };

  const isGoalCompleted = (goalId: string) => {
    return goalLogs.some(log => log.goal_id === goalId && log.completed);
  };

  const completedGoalsCount = goalLogs.filter(log => log.completed).length;
  const dailyProgress = ranking.goals.length > 0 
    ? (completedGoalsCount / ranking.goals.length) * 100 
    : 0;
  const dailyPoints = (dailyProgress / 100) * 10;

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1));
  };

  const handleDeleteRanking = async () => {
    setDeleting(true);
    const success = await deleteRanking(ranking.id);
    if (success) {
      onBack();
    }
    setDeleting(false);
  };

  const handleRequestDeletion = async () => {
    setRequestingDeletion(true);
    await requestDeletion(ranking.id);
    setRequestingDeletion(false);
  };

  const handleCancelDeletionRequest = async () => {
    await cancelDeletionRequest(ranking.id);
  };

  const handleConsentToDeletion = async (consent: boolean) => {
    await consentToDeletion(ranking.id, consent);
  };

  const canNavigatePrev = selectedDate > startDate;
  const canNavigateNext = selectedDate < endDate;

  return (
    <>
      {/* Winner Celebration Modal */}
      <RankingWinnerCelebration
        winner={showWinnerCelebration ? winner : null}
        podium={leaderboard}
        rankingName={ranking.name}
        onClose={() => setShowWinnerCelebration(false)}
      />

      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            {ranking.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(startDate, "dd MMM", { locale: ptBR })} - {format(endDate, "dd MMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canEdit && (
            <CreateRankingDialog
              editMode
              rankingToEdit={ranking}
              onSuccess={() => fetchRankings()}
              trigger={
                <Button variant="outline" size="sm" className="gap-2">
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
              }
            />
          )}
          {/* Direct delete for pending/completed rankings */}
          {canDeleteDirectly && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Ranking</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir o ranking "{ranking.name}"? 
                    Esta ação não pode ser desfeita e todos os dados serão perdidos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteRanking}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Excluindo..." : "Excluir"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          
          {/* Request deletion for active rankings */}
          {canRequestDeletion && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Solicitar Exclusão
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Solicitar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Como este ranking está ativo, todos os participantes precisam consentir com a exclusão.
                    Será enviada uma notificação para cada participante solicitando o consentimento.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleRequestDeletion}
                    disabled={requestingDeletion}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {requestingDeletion ? "Enviando..." : "Solicitar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Show deletion request status for creator */}
          {isCreator && ranking.deletion_requested && (
            <div className="flex items-center gap-2">
              {allConsented ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Confirmar Exclusão
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Todos Consentiram</AlertDialogTitle>
                      <AlertDialogDescription>
                        Todos os participantes concordaram com a exclusão. Deseja prosseguir?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteRanking}
                        disabled={deleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting ? "Excluindo..." : "Excluir Definitivamente"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <>
                  <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                    Aguardando consentimento ({consentCount}/{acceptedParticipants.length})
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCancelDeletionRequest}
                    className="text-muted-foreground"
                  >
                    Cancelar solicitação
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Show consent buttons for non-creator participants */}
          {!isCreator && ranking.deletion_requested && !userHasConsented && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-yellow-500 border-yellow-500">
                Exclusão solicitada
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleConsentToDeletion(true)}
                className="text-destructive hover:text-destructive"
              >
                Concordar
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleConsentToDeletion(false)}
              >
                Recusar
              </Button>
            </div>
          )}

          {/* Show consent status for non-creator who already consented */}
          {!isCreator && ranking.deletion_requested && userHasConsented && (
            <Badge variant="outline" className="text-muted-foreground">
              Você concordou com a exclusão
            </Badge>
          )}

          {/* Button to replay winner celebration */}
          {ranking.status === 'completed' && winner && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
              onClick={() => setShowWinnerCelebration(true)}
            >
              <Trophy className="h-4 w-4" />
              Ver Celebração
            </Button>
          )}

          <Badge className={cn(
            ranking.status === 'active' && "bg-green-500/20 text-green-500",
            ranking.status === 'pending' && "bg-yellow-500/20 text-yellow-500",
            ranking.status === 'completed' && "bg-muted text-muted-foreground"
          )}>
            {ranking.status === 'active' && 'Ativo'}
            {ranking.status === 'pending' && 'Aguardando'}
            {ranking.status === 'completed' && 'Finalizado'}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Goals */}
        <div className="lg:col-span-2 space-y-4">
          {/* Date Navigator */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateDate('prev')}
                  disabled={!canNavigatePrev}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {format(selectedDate, "EEEE", { locale: ptBR })}
                  </p>
                  <p className="text-lg font-semibold">
                    {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigateDate('next')}
                  disabled={!canNavigateNext}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Daily Progress */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  Metas do Dia
                </CardTitle>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{dailyPoints.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">de 10 pontos</p>
                </div>
              </div>
              <Progress value={dailyProgress} className="h-2 mt-2" />
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {ranking.goals.map((goal, index) => {
                    const completed = isGoalCompleted(goal.id);
                    const pointsPerGoal = 10 / ranking.goals.length;
                    
                    return (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn(
                          "group relative flex items-center gap-4 p-4 rounded-xl transition-all duration-300",
                          "border-2",
                          completed 
                            ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30 shadow-sm" 
                            : "bg-gradient-to-r from-muted/50 via-muted/30 to-transparent border-border/50 hover:border-primary/20",
                          !canEditGoals && "opacity-60 pointer-events-none"
                        )}
                      >
                        {/* Goal Number Badge */}
                        <div className={cn(
                          "flex items-center justify-center h-10 w-10 rounded-xl shrink-0 transition-all duration-300",
                          "text-sm font-bold",
                          completed 
                            ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20" 
                            : "bg-gradient-to-br from-muted to-muted/60 text-muted-foreground"
                        )}>
                          {completed ? <Check className="h-5 w-5" /> : index + 1}
                        </div>

                        {/* Goal Content */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "font-semibold text-base transition-all duration-300",
                            completed && "text-primary"
                          )}>
                            {goal.title}
                          </p>
                          {goal.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {goal.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-medium",
                              completed 
                                ? "bg-primary/20 text-primary" 
                                : "bg-muted text-muted-foreground"
                            )}>
                              {completed ? `+${pointsPerGoal.toFixed(1)} pts` : `${pointsPerGoal.toFixed(1)} pts`}
                            </span>
                            {completed && (
                              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <Sparkles className="h-3 w-3 text-primary" />
                                Completo
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Checkbox */}
                        <Checkbox
                          checked={completed}
                          onCheckedChange={(checked) => handleToggleGoal(goal.id, !!checked)}
                          disabled={!canEditGoals || loading}
                          className={cn(
                            "h-6 w-6 rounded-lg border-2 transition-all duration-300",
                            completed 
                              ? "border-primary bg-primary data-[state=checked]:bg-primary" 
                              : "border-muted-foreground/30 hover:border-primary/50"
                          )}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {!isActive && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <Target className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {ranking.status === 'pending' 
                        ? 'O ranking ainda não foi iniciado.' 
                        : 'O ranking foi finalizado.'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bet Info */}
          {ranking.bet_description && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-yellow-500">
                  <Coins className="h-4 w-4" />
                  Aposta: {ranking.bet_amount}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{ranking.bet_description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Leaderboard */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="h-4 w-4 text-yellow-500" />
                Classificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {leaderboard.map((participant, index) => (
                <motion.div
                  key={participant.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-all",
                    participant.user_id === user?.id && "bg-primary/10 border border-primary/20",
                    index === 0 && participant.total_points > 0 && "bg-yellow-500/10"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm",
                    index === 0 && "bg-yellow-500/20 text-yellow-500",
                    index === 1 && "bg-gray-400/20 text-gray-400",
                    index === 2 && "bg-orange-600/20 text-orange-600",
                    index > 2 && "bg-muted text-muted-foreground"
                  )}>
                    {index === 0 ? <Crown className="h-4 w-4" /> : index + 1}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={participant.user_profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {participant.user_profile?.first_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {participant.user_profile?.first_name || 'Usuário'}
                      {participant.user_id === user?.id && (
                        <span className="text-muted-foreground ml-1">(você)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ID: {participant.user_profile?.public_id || '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{participant.total_points.toFixed(1)}</p>
                    <p className="text-[10px] text-muted-foreground">pontos</p>
                  </div>
                </motion.div>
              ))}

              {leaderboard.length === 0 && (
                <p className="text-sm text-center text-muted-foreground py-4">
                  Nenhum participante ainda
                </p>
              )}
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Participantes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ranking.participants.map((participant) => (
                <div key={participant.id} className="flex items-center gap-2 text-sm">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={participant.user_profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-[10px]">
                      {participant.user_profile?.first_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 truncate">
                    {participant.user_profile?.first_name || 'Usuário'}
                  </span>
                  <Badge variant="outline" className={cn(
                    "text-[10px]",
                    participant.status === 'accepted' && "text-green-500 border-green-500/30",
                    participant.status === 'pending' && "text-yellow-500 border-yellow-500/30",
                    participant.status === 'rejected' && "text-red-500 border-red-500/30"
                  )}>
                    {participant.status === 'accepted' && 'Aceito'}
                    {participant.status === 'pending' && 'Pendente'}
                    {participant.status === 'rejected' && 'Recusado'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}
