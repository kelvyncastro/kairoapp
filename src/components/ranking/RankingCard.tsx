import { useState } from "react";
import { Trophy, Calendar, Users, Target, Coins, ChevronRight, Check, X, Play } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { RankingWithDetails } from "@/types/ranking";
import { useAuth } from "@/contexts/AuthContext";
import { useRankings } from "@/hooks/useRankings";
import { format, differenceInDays, isAfter, isBefore, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface RankingCardProps {
  ranking: RankingWithDetails;
  onSelect: () => void;
}

export function RankingCard({ ranking, onSelect }: RankingCardProps) {
  const { user } = useAuth();
  const { respondToInvite, startRanking } = useRankings();
  const [respondingInvite, setRespondingInvite] = useState(false);

  const isCreator = ranking.creator_id === user?.id;
  const userParticipation = ranking.participants.find(p => p.user_id === user?.id);
  const isPending = userParticipation?.status === 'pending';
  const isAccepted = userParticipation?.status === 'accepted' || isCreator;
  
  const acceptedParticipants = ranking.participants.filter(p => p.status === 'accepted');
  const pendingParticipants = ranking.participants.filter(p => p.status === 'pending');
  
  const startDate = new Date(ranking.start_date);
  const endDate = new Date(ranking.end_date);
  const today = new Date();
  
  const totalDays = differenceInDays(endDate, startDate) + 1;
  const daysElapsed = Math.max(0, differenceInDays(today, startDate) + 1);
  const progress = ranking.status === 'active' ? Math.min(100, (daysElapsed / totalDays) * 100) : 0;
  
  const canStart = isCreator && ranking.status === 'pending' && acceptedParticipants.length >= 2;

  const getStatusBadge = () => {
    switch (ranking.status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">Aguardando</Badge>;
      case 'active':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Ativo</Badge>;
      case 'completed':
        return <Badge variant="secondary">Finalizado</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return null;
    }
  };

  const handleRespondInvite = async (accept: boolean) => {
    setRespondingInvite(true);
    try {
      await respondToInvite(ranking.id, accept, ranking.bet_description ? true : false);
    } finally {
      setRespondingInvite(false);
    }
  };

  const handleStartRanking = async () => {
    await startRanking(ranking.id);
  };

  // Sort participants by points
  const leaderboard = [...acceptedParticipants].sort((a, b) => b.total_points - a.total_points);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center",
                (ranking.bet_description || ranking.bet_amount) 
                  ? "bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 ring-1 ring-yellow-500/30" 
                  : "bg-primary/10"
              )}>
                {(ranking.bet_description || ranking.bet_amount) ? (
                  <Coins className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Trophy className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{ranking.name}</CardTitle>
                  {(ranking.bet_description || ranking.bet_amount) && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-yellow-500/40 text-yellow-500 bg-yellow-500/10">
                      💰 Aposta
                    </Badge>
                  )}
                </div>
                {ranking.creator_profile && (
                  <p className="text-xs text-muted-foreground">
                    por {ranking.creator_profile.first_name || 'Usuário'}
                  </p>
                )}
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Description */}
          {ranking.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{ranking.description}</p>
          )}

          {/* Dates and Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(startDate, "dd MMM", { locale: ptBR })} - {format(endDate, "dd MMM", { locale: ptBR })}
              </div>
              <span>{totalDays} dias</span>
            </div>
            {ranking.status === 'active' && (
              <Progress value={progress} className="h-1.5" />
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {acceptedParticipants.length} participante{acceptedParticipants.length !== 1 ? 's' : ''}
              {pendingParticipants.length > 0 && (
                <span className="text-yellow-500"> (+{pendingParticipants.length} pendente{pendingParticipants.length !== 1 ? 's' : ''})</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {ranking.goals.length} meta{ranking.goals.length !== 1 ? 's' : ''}
            </div>
            {(ranking.bet_description || ranking.bet_amount) && (
              <div className="flex items-center gap-1 text-yellow-500">
                <Coins className="h-3 w-3" />
                Aposta
              </div>
            )}
          </div>

          {/* Mini Leaderboard */}
          {ranking.status === 'active' && leaderboard.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Top 3</p>
              <div className="space-y-1.5">
                {leaderboard.slice(0, 3).map((participant, index) => (
                  <div key={participant.id} className="flex items-center gap-2 text-sm">
                    <span className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold",
                      index === 0 && "bg-yellow-500/20 text-yellow-500",
                      index === 1 && "bg-gray-400/20 text-gray-400",
                      index === 2 && "bg-orange-600/20 text-orange-600"
                    )}>
                      {index + 1}
                    </span>
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={participant.user_profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {participant.user_profile?.first_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="flex-1 truncate text-xs">
                      {participant.user_profile?.first_name || 'Usuário'}
                    </span>
                    <span className="text-xs font-medium text-primary">
                      {participant.total_points.toFixed(1)} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bet Info */}
          {(ranking.bet_description || ranking.bet_amount) && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-center gap-2 text-yellow-500 text-xs font-medium mb-1">
                <Coins className="h-3 w-3" />
                {ranking.bet_amount ? `Aposta: ${ranking.bet_amount}` : 'Com Aposta'}
              </div>
              {ranking.bet_description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{ranking.bet_description}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {isPending && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleRespondInvite(false)}
                  disabled={respondingInvite}
                >
                  <X className="h-4 w-4 mr-1" />
                  Recusar
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleRespondInvite(true)}
                  disabled={respondingInvite}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Aceitar{ranking.bet_description ? ' e Apostar' : ''}
                </Button>
              </>
            )}
            
            {isAccepted && !isPending && (
              <>
                {canStart && (
                  <Button size="sm" onClick={handleStartRanking} className="gap-2">
                    <Play className="h-4 w-4" />
                    Iniciar Ranking
                  </Button>
                )}
                <Button
                  size="sm"
                  variant={canStart ? "outline" : "default"}
                  className="flex-1"
                  onClick={onSelect}
                >
                  Ver Detalhes
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
