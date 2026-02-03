import { Calendar, Coins, Crown, Target, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Ranking } from "@/hooks/useRankings";

interface RankingListCardProps {
  ranking: Ranking;
  currentUserId: string | undefined;
  onOpenDetails: (ranking: Ranking) => void;
}

export function RankingListCard({ ranking, currentUserId, onOpenDetails }: RankingListCardProps) {
  const userParticipation = ranking.participants.find((p) => p.user_id === currentUserId);
  const acceptedParticipants = ranking.participants.filter((p) => p.status === "accepted");
  const isCreator = ranking.creator_id === currentUserId;
  const daysLeft = differenceInDays(new Date(ranking.end_date), new Date());

  const creatorName = ranking.creator_profile?.first_name || "Criador";

  const statusBadge = (() => {
    if (ranking.status === "active") {
      return (
        <Badge variant="outline" className="bg-success/20 text-success border-success/30">
          Ativo
        </Badge>
      );
    }
    if (ranking.status === "ended") {
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
  })();

  return (
    <div className="cave-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {isCreator && <Crown className="h-4 w-4 text-warning" />}
            <h3 className="font-semibold truncate">{ranking.name}</h3>
            {ranking.bet_amount && (
              <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30">
                <Coins className="h-3 w-3 mr-1" />
                Aposta
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">por {creatorName}</p>
        </div>
        {statusBadge}
      </div>

      {ranking.description && (
        <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{ranking.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {format(new Date(ranking.start_date), "dd MMM", { locale: ptBR })} –{" "}
          {format(new Date(ranking.end_date), "dd MMM", { locale: ptBR })}
        </div>
        {ranking.status === "active" && daysLeft > 0 && (
          <span className="text-primary">{daysLeft} dias</span>
        )}
      </div>

      <div className="mt-3">
        <Progress
          value={
            ranking.status === "active"
              ? Math.min(100, ((userParticipation?.total_points || 0) / 100) * 100)
              : 0
          }
          className="h-1.5"
        />
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {acceptedParticipants.length}/{ranking.max_participants}
          </div>
          <div className="flex items-center gap-1">
            <Target className="h-3.5 w-3.5" />
            {ranking.goals.length} metas
          </div>
          {ranking.bet_amount && (
            <div className="flex items-center gap-1">
              <Coins className="h-3.5 w-3.5 text-warning" />
              Aposta
            </div>
          )}
        </div>

        <div className="flex -space-x-2">
          {acceptedParticipants.slice(0, 3).map((p) => (
            <Avatar key={p.id} className="h-6 w-6 border-2 border-background">
              <AvatarImage src={p.profile?.avatar_url || undefined} />
              <AvatarFallback className="text-[10px]">
                {p.profile?.first_name?.[0] || "?"}
              </AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>

      {ranking.bet_amount && (
        <div className="mt-3 rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-warning">
          <span className="font-medium">Aposta:</span> {ranking.bet_amount}
        </div>
      )}

      <Button
        type="button"
        variant="secondary"
        className={cn("w-full mt-3", "bg-background text-foreground hover:bg-background/90")}
        onClick={() => onOpenDetails(ranking)}
      >
        Ver Detalhes
      </Button>
    </div>
  );
}
