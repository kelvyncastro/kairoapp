import { useState } from "react";
import { Plus, Trophy, Calendar, Target, Users, Coins, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRankings } from "@/hooks/useRankings";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

interface CreateRankingDialogProps {
  trigger?: React.ReactNode;
}

export function CreateRankingDialog({ trigger }: CreateRankingDialogProps) {
  const { createRanking } = useRankings();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
  const [hasBet, setHasBet] = useState(false);
  const [betDescription, setBetDescription] = useState("");
  const [betAmount, setBetAmount] = useState("");
  const [goals, setGoals] = useState<{ title: string; description: string }[]>([
    { title: "", description: "" }
  ]);
  const [invitees, setInvitees] = useState<string[]>([""]);

  const addGoal = () => {
    setGoals([...goals, { title: "", description: "" }]);
  };

  const removeGoal = (index: number) => {
    if (goals.length > 1) {
      setGoals(goals.filter((_, i) => i !== index));
    }
  };

  const updateGoal = (index: number, field: 'title' | 'description', value: string) => {
    const newGoals = [...goals];
    newGoals[index][field] = value;
    setGoals(newGoals);
  };

  const addInvitee = () => {
    setInvitees([...invitees, ""]);
  };

  const removeInvitee = (index: number) => {
    if (invitees.length > 1) {
      setInvitees(invitees.filter((_, i) => i !== index));
    }
  };

  const updateInvitee = (index: number, value: string) => {
    const newInvitees = [...invitees];
    newInvitees[index] = value;
    setInvitees(newInvitees);
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setStartDate(format(new Date(), 'yyyy-MM-dd'));
    setEndDate(format(addDays(new Date(), 7), 'yyyy-MM-dd'));
    setHasBet(false);
    setBetDescription("");
    setBetAmount("");
    setGoals([{ title: "", description: "" }]);
    setInvitees([""]);
  };

  const handleSubmit = async () => {
    if (!name.trim() || goals.every(g => !g.title.trim())) return;

    setLoading(true);
    try {
      const validGoals = goals.filter(g => g.title.trim());
      const validInvitees = invitees.filter(i => i.trim());

      await createRanking({
        name,
        description: description || undefined,
        start_date: startDate,
        end_date: endDate,
        bet_description: hasBet ? betDescription : undefined,
        bet_amount: hasBet ? betAmount : undefined,
        goals: validGoals,
        invitees: validInvitees
      });

      resetForm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Criar Ranking
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Criar Novo Ranking
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Ranking *</Label>
              <Input
                id="name"
                placeholder="Ex: Desafio Fitness Janeiro"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o objetivo do ranking..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Período
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Término</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Goals */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Target className="h-4 w-4 text-muted-foreground" />
                Metas Diárias *
              </div>
              <Button variant="outline" size="sm" onClick={addGoal}>
                <Plus className="h-3 w-3 mr-1" />
                Adicionar Meta
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cada participante precisará cumprir estas metas diariamente. Pontuação proporcional às metas completadas (máx. 10 pts/dia).
            </p>
            <div className="space-y-3">
              {goals.map((goal, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder={`Meta ${index + 1}`}
                      value={goal.title}
                      onChange={(e) => updateGoal(index, 'title', e.target.value)}
                    />
                  </div>
                  {goals.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGoal(index)}
                      className="h-10 w-10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Invitees */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-muted-foreground" />
                Convidar Participantes
              </div>
              <Button variant="outline" size="sm" onClick={addInvitee}>
                <Plus className="h-3 w-3 mr-1" />
                Adicionar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Insira o ID público (8 caracteres) dos usuários que deseja convidar.
            </p>
            <div className="space-y-2">
              {invitees.map((invitee, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="ID do usuário (ex: ABC12345)"
                    value={invitee}
                    onChange={(e) => updateInvitee(index, e.target.value.toUpperCase())}
                    className="uppercase"
                    maxLength={8}
                  />
                  {invitees.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeInvitee(index)}
                      className="h-10 w-10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bet */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Coins className="h-4 w-4 text-muted-foreground" />
                Aposta
              </div>
              <Switch checked={hasBet} onCheckedChange={setHasBet} />
            </div>
            {hasBet && (
              <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  Ao aceitar o convite, os participantes concordam com os termos da aposta.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="betAmount">Valor da Aposta</Label>
                  <Input
                    id="betAmount"
                    placeholder="Ex: R$ 50,00"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="betDescription">Descrição/Regras da Aposta</Label>
                  <Textarea
                    id="betDescription"
                    placeholder="Descreva as regras e o que o vencedor ganha..."
                    value={betDescription}
                    onChange={(e) => setBetDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !name.trim() || goals.every(g => !g.title.trim())}
            >
              {loading ? "Criando..." : "Criar Ranking"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
