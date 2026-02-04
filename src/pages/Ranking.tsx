import { useState } from "react";
import { Trophy, Users, Clock, CheckCircle, Plus, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRankings } from "@/hooks/useRankings";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useNotifications } from "@/hooks/useNotifications";
import { RankingCard } from "@/components/ranking/RankingCard";
import { RankingDetail } from "@/components/ranking/RankingDetail";
import { CreateRankingDialog } from "@/components/ranking/CreateRankingDialog";
import { RankingWithDetails, Notification } from "@/types/ranking";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Ranking() {
  const { rankings, loading, respondToInvite } = useRankings();
  const { profile } = useUserProfile();
  const { notifications, markAsRead } = useNotifications();
  const { toast } = useToast();
  
  const [selectedRanking, setSelectedRanking] = useState<RankingWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [copied, setCopied] = useState(false);

  const activeRankings = rankings.filter(r => r.status === 'active');
  const pendingRankings = rankings.filter(r => r.status === 'pending');
  const completedRankings = rankings.filter(r => r.status === 'completed');

  // Ranking invites from notifications
  const rankingInvites = notifications.filter(
    n => n.type === 'ranking_invite' && !n.read
  );

  const copyPublicId = async () => {
    if (profile?.public_id) {
      await navigator.clipboard.writeText(profile.public_id);
      setCopied(true);
      toast({
        title: "ID copiado!",
        description: "Compartilhe com seus amigos para receber convites."
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (selectedRanking) {
    return (
      <div className="h-full overflow-y-auto">
        <RankingDetail 
          ranking={selectedRanking} 
          onBack={() => setSelectedRanking(null)} 
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Trophy className="h-7 w-7 text-primary" />
            Ranking entre Amigos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Compita com seus amigos e alcance suas metas juntos
          </p>
        </div>
        <CreateRankingDialog />
      </div>

      {/* User ID Card */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Seu ID público</p>
            <p className="text-2xl font-mono font-bold tracking-wider text-primary">
              {profile?.public_id || '--------'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Compartilhe este ID para receber convites de rankings
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={copyPublicId}
            className="gap-2"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copiado!' : 'Copiar ID'}
          </Button>
        </CardContent>
      </Card>

      {/* Pending Invites */}
      {rankingInvites.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2 text-yellow-500">
              <Users className="h-4 w-4" />
              Convites Pendentes ({rankingInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {rankingInvites.map((notification) => (
              <div key={notification.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50">
                <div>
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">{notification.message}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => markAsRead(notification.id)}
                >
                  Ver
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center mx-auto mb-2">
              <Trophy className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{activeRankings.length}</p>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-2">
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold">{pendingRankings.length}</p>
            <p className="text-xs text-muted-foreground">Aguardando</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
            <p className="text-2xl font-bold">{completedRankings.length}</p>
            <p className="text-xs text-muted-foreground">Finalizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-2">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold">{rankings.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Rankings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="gap-2">
            <Trophy className="h-4 w-4" />
            Ativos
            {activeRankings.length > 0 && (
              <span className="text-xs bg-primary/20 px-1.5 rounded-full">
                {activeRankings.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Aguardando
            {pendingRankings.length > 0 && (
              <span className="text-xs bg-yellow-500/20 text-yellow-500 px-1.5 rounded-full">
                {pendingRankings.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Finalizados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {activeRankings.map((ranking) => (
                <RankingCard 
                  key={ranking.id} 
                  ranking={ranking}
                  onSelect={() => setSelectedRanking(ranking)}
                />
              ))}
            </AnimatePresence>
          </div>
          {activeRankings.length === 0 && (
            <EmptyState 
              icon={<Trophy className="h-12 w-12 text-muted-foreground/50" />}
              title="Nenhum ranking ativo"
              description="Crie um novo ranking ou aguarde convites de amigos"
            />
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {pendingRankings.map((ranking) => (
                <RankingCard 
                  key={ranking.id} 
                  ranking={ranking}
                  onSelect={() => setSelectedRanking(ranking)}
                />
              ))}
            </AnimatePresence>
          </div>
          {pendingRankings.length === 0 && (
            <EmptyState 
              icon={<Clock className="h-12 w-12 text-muted-foreground/50" />}
              title="Nenhum ranking aguardando"
              description="Rankings criados aparecem aqui até todos aceitarem"
            />
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {completedRankings.map((ranking) => (
                <RankingCard 
                  key={ranking.id} 
                  ranking={ranking}
                  onSelect={() => setSelectedRanking(ranking)}
                />
              ))}
            </AnimatePresence>
          </div>
          {completedRankings.length === 0 && (
            <EmptyState 
              icon={<CheckCircle className="h-12 w-12 text-muted-foreground/50" />}
              title="Nenhum ranking finalizado"
              description="Rankings concluídos aparecem aqui"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon}
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      <CreateRankingDialog 
        trigger={
          <Button className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Criar Ranking
          </Button>
        }
      />
    </div>
  );
}
