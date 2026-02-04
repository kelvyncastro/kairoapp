import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRankings, Ranking } from "@/hooks/useRankings";
import {
  Trophy,
  Plus,
  Calendar,
  Coins,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RankingPublicIdCard } from "@/components/ranking/RankingPublicIdCard";
import { RankingStatsRow } from "@/components/ranking/RankingStatsRow";
import { RankingFilterTabs, RankingTabKey } from "@/components/ranking/RankingFilterTabs";
import { RankingListCard } from "@/components/ranking/RankingListCard";
import { RankingDetail } from "@/components/ranking/RankingDetail";

export default function RankingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { rankings, loading, refetch } = useRankings();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedRanking, setSelectedRanking] = useState<Ranking | null>(null);
  const [creating, setCreating] = useState(false);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RankingTabKey>("active");

  // Create form state
  const [newRanking, setNewRanking] = useState({
    name: "",
    description: "",
    start_date: new Date(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    bet_amount: "",
    goals: [""],
    invites: [""],
  });

  const handleCreateRanking = async () => {
    if (!user || !newRanking.name.trim()) return;

    setCreating(true);

    try {
      // Create ranking
      const { data: rankingData, error: rankingError } = await supabase
        .from("rankings")
        .insert({
          name: newRanking.name,
          description: newRanking.description || null,
          creator_id: user.id,
          start_date: format(newRanking.start_date, "yyyy-MM-dd"),
          end_date: format(newRanking.end_date, "yyyy-MM-dd"),
          bet_amount: newRanking.bet_amount || null,
          status: "pending",
        })
        .select()
        .single();

      if (rankingError) throw rankingError;

      // Add creator as participant
      await supabase.from("ranking_participants").insert({
        ranking_id: rankingData.id,
        user_id: user.id,
        status: "accepted",
        accepted_bet: true,
        joined_at: new Date().toISOString(),
      });

      // Create goals
      const validGoals = newRanking.goals.filter((g) => g.trim());
      if (validGoals.length > 0) {
        await supabase.from("ranking_goals").insert(
          validGoals.map((title, index) => ({
            ranking_id: rankingData.id,
            title,
            order_index: index,
          }))
        );
      }

      // Invite participants by public_id using secure RPC function
      const validInvites = newRanking.invites.filter((i) => i.trim());
      if (validInvites.length > 0) {
        // Fetch all public profiles using secure function
        const { data: allPublicProfiles } = await supabase
          .rpc("get_public_user_profiles");

        for (const publicId of validInvites) {
          // Find matching profile from secure data
          const profile = (allPublicProfiles || []).find(
            (p: { public_id: string | null }) => 
              p.public_id?.toUpperCase() === publicId.toUpperCase()
          );

          if (profile && profile.user_id !== user.id) {
            await supabase.from("ranking_participants").insert({
              ranking_id: rankingData.id,
              user_id: profile.user_id,
              status: "pending",
            });

            // Send notification
            await supabase.from("notifications").insert({
              user_id: profile.user_id,
              type: "ranking_invite",
              title: "Convite para Ranking",
              message: `Você foi convidado para participar do ranking "${newRanking.name}"`,
              data: { ranking_id: rankingData.id },
            });
          }
        }
      }

      toast({ title: "Ranking criado com sucesso!" });
      setCreateDialogOpen(false);
      setNewRanking({
        name: "",
        description: "",
        start_date: new Date(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        bet_amount: "",
        goals: [""],
        invites: [""],
      });

      // Refetch immediately
      await refetch();
    } catch (error) {
      console.error("Error creating ranking:", error);
      toast({ title: "Erro ao criar ranking", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    let alive = true;
    (async () => {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("public_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!alive) return;
      if (error) {
        console.error("Error fetching public_id:", error);
        return;
      }
      setPublicId((data?.public_id as string | null) || null);
    })();

    return () => {
      alive = false;
    };
  }, [user]);

  const counts = useMemo(() => {
    const active = rankings.filter((r) => r.status === "active").length;
    const ended = rankings.filter((r) => r.status === "ended").length;
    const pending = rankings.filter((r) => {
      const part = r.participants.find((p) => p.user_id === user?.id);
      return part?.status === "pending" || r.status === "pending";
    }).length;
    return { active, pending, ended, total: rankings.length };
  }, [rankings, user?.id]);

  const filteredRankings = useMemo(() => {
    if (activeTab === "active") return rankings.filter((r) => r.status === "active");
    if (activeTab === "ended") return rankings.filter((r) => r.status === "ended");
    // pending
    return rankings.filter((r) => {
      const part = r.participants.find((p) => p.user_id === user?.id);
      return part?.status === "pending" || r.status === "pending";
    });
  }, [activeTab, rankings, user?.id]);

  const handleCopyPublicId = async () => {
    if (!publicId) return;
    try {
      await navigator.clipboard.writeText(publicId);
      toast({ title: "ID copiado!" });
    } catch {
      toast({ title: "Não foi possível copiar", variant: "destructive" });
    }
  };

  const handleAcceptInvite = async (rankingId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("ranking_participants")
        .update({
          status: "accepted",
          joined_at: new Date().toISOString(),
        })
        .eq("ranking_id", rankingId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({ title: "Convite aceito!" });

      // Check if all participants accepted to auto-start
      const ranking = rankings.find((r) => r.id === rankingId);
      if (ranking) {
        const allAccepted = ranking.participants.every(
          (p) => p.status === "accepted" || p.user_id === user.id
        );
        const today = new Date();
        const startDate = new Date(ranking.start_date);

        if (allAccepted && !isAfter(startDate, today) && ranking.status === "pending") {
          await supabase
            .from("rankings")
            .update({ status: "active" })
            .eq("id", rankingId);
        }
      }

      // Refetch immediately
      await refetch();
    } catch (error) {
      console.error("Error accepting invite:", error);
      toast({ title: "Erro ao aceitar convite", variant: "destructive" });
    }
  };

  const handleDeclineInvite = async (rankingId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("ranking_participants")
        .delete()
        .eq("ranking_id", rankingId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({ title: "Convite recusado" });
      await refetch();
    } catch (error) {
      console.error("Error declining invite:", error);
      toast({ title: "Erro ao recusar convite", variant: "destructive" });
    }
  };

  const getStatusBadge = (ranking: Ranking) => {
    const userParticipation = ranking.participants.find(
      (p) => p.user_id === user?.id
    );

    if (userParticipation?.status === "pending") {
      return (
        <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
          Convite Pendente
        </Badge>
      );
    }

    switch (ranking.status) {
      case "active":
        return (
          <Badge variant="outline" className="bg-success/20 text-success border-success/30">
            Ativo
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            Aguardando
          </Badge>
        );
      case "ended":
        return (
          <Badge variant="outline" className="bg-secondary text-secondary-foreground">
            Finalizado
          </Badge>
        );
      default:
        return null;
    }
  };

  const addGoalField = () => {
    setNewRanking((prev) => ({ ...prev, goals: [...prev.goals, ""] }));
  };

  const addInviteField = () => {
    setNewRanking((prev) => ({ ...prev, invites: [...prev.invites, ""] }));
  };

  const updateGoal = (index: number, value: string) => {
    setNewRanking((prev) => ({
      ...prev,
      goals: prev.goals.map((g, i) => (i === index ? value : g)),
    }));
  };

  const updateInvite = (index: number, value: string) => {
    setNewRanking((prev) => ({
      ...prev,
      invites: prev.invites.map((inv, i) => (i === index ? value : inv)),
    }));
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle edit ranking
  const handleEditRanking = () => {
    // TODO: Implement edit dialog
    toast({ title: "Funcionalidade de edição em breve!" });
  };

  // Handle delete ranking
  const handleDeleteRanking = async () => {
    if (!selectedRanking || !user) return;
    
    try {
      const { error } = await supabase
        .from("rankings")
        .delete()
        .eq("id", selectedRanking.id)
        .eq("creator_id", user.id);

      if (error) throw error;

      toast({ title: "Ranking excluído com sucesso!" });
      setSelectedRanking(null);
      await refetch();
    } catch (error) {
      console.error("Error deleting ranking:", error);
      toast({ title: "Erro ao excluir ranking", variant: "destructive" });
    }
  };

  // If a ranking is selected, show the detail view
  if (selectedRanking) {
    return (
      <RankingDetail
        ranking={selectedRanking}
        onBack={() => setSelectedRanking(null)}
        onEdit={handleEditRanking}
        onDelete={handleDeleteRanking}
        onRefetch={refetch}
      />
    );
  }

  return (
    <div className="h-full flex flex-col -m-4 md:-m-6 bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border/30 flex-shrink-0">
        <div>
          <h1 className="text-lg md:text-xl font-bold">Ranking entre Amigos</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">
            Compita com seus amigos e alcance suas metas juntos
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => setCreateDialogOpen(true)} className="bg-background text-foreground hover:bg-background/90">
          <Plus className="h-4 w-4 mr-1" />
          Criar Ranking
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        <RankingPublicIdCard publicId={publicId} onCopy={handleCopyPublicId} />

        <RankingStatsRow
          active={counts.active}
          pending={counts.pending}
          ended={counts.ended}
          total={counts.total}
        />

        <RankingFilterTabs
          value={activeTab}
          onChange={setActiveTab}
          counts={{ active: counts.active, pending: counts.pending, ended: counts.ended }}
        />

        {filteredRankings.length === 0 ? (
          <div className="cave-card p-10 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Nenhum ranking nessa categoria.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredRankings.map((ranking) => {
              const userParticipation = ranking.participants.find((p) => p.user_id === user?.id);
              const isPendingInvite = userParticipation?.status === "pending";

              if (isPendingInvite) {
                return (
                  <div key={ranking.id} className="cave-card p-4 border border-warning/30 bg-warning/5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{ranking.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Convite pendente
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
                        Aguardando
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAcceptInvite(ranking.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Aceitar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeclineInvite(ranking.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <RankingListCard
                  key={ranking.id}
                  ranking={ranking}
                  currentUserId={user?.id}
                  onOpenDetails={(r) => setSelectedRanking(r)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Criar Ranking
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome do Ranking</Label>
              <Input
                placeholder="Ex: Desafio de Janeiro"
                value={newRanking.name}
                onChange={(e) =>
                  setNewRanking((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Descrição (opcional)</Label>
              <Textarea
                placeholder="Descreva o objetivo do ranking..."
                value={newRanking.description}
                onChange={(e) =>
                  setNewRanking((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(newRanking.start_date, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={newRanking.start_date}
                      onSelect={(date) =>
                        date && setNewRanking((prev) => ({ ...prev, start_date: date }))
                      }
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Data Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(newRanking.end_date, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={newRanking.end_date}
                      onSelect={(date) =>
                        date && setNewRanking((prev) => ({ ...prev, end_date: date }))
                      }
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label>Valor da Aposta (opcional)</Label>
              <div className="relative">
                <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warning" />
                <Input
                  placeholder="R$ 0,00"
                  className="pl-9"
                  value={newRanking.bet_amount}
                  onChange={(e) =>
                    setNewRanking((prev) => ({ ...prev, bet_amount: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <Label>Metas Diárias</Label>
              <div className="space-y-2">
                {newRanking.goals.map((goal, index) => (
                  <Input
                    key={index}
                    placeholder={`Meta ${index + 1}`}
                    value={goal}
                    onChange={(e) => updateGoal(index, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && goal.trim()) {
                        e.preventDefault();
                        addGoalField();
                      }
                    }}
                  />
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addGoalField}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Meta
                </Button>
              </div>
            </div>

            <div>
              <Label>Convidar Participantes (ID Público)</Label>
              <div className="space-y-2">
                {newRanking.invites.map((invite, index) => (
                  <Input
                    key={index}
                    placeholder="Ex: Q7MUTYSL"
                    value={invite}
                    onChange={(e) => updateInvite(index, e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && invite.trim()) {
                        e.preventDefault();
                        addInviteField();
                      }
                    }}
                    maxLength={8}
                  />
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addInviteField}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Participante
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateRanking}
              disabled={!newRanking.name.trim() || creating}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trophy className="h-4 w-4 mr-2" />
              )}
              Criar Ranking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
