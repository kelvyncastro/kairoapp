import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Trophy, Calendar, Target, Users, Coins, X, Sparkles, User, Loader2, CheckCircle } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRankings } from "@/hooks/useRankings";
import { RankingWithDetails } from "@/types/ranking";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface UserProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  public_id: string | null;
}

interface InviteeWithProfile {
  publicId: string;
  profile: UserProfile | null;
  loading: boolean;
  notFound: boolean;
}

interface CreateRankingDialogProps {
  trigger?: React.ReactNode;
  editMode?: boolean;
  rankingToEdit?: RankingWithDetails;
  onSuccess?: () => void;
}

export function CreateRankingDialog({ trigger, editMode = false, rankingToEdit, onSuccess }: CreateRankingDialogProps) {
  const { createRanking, updateRanking } = useRankings();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const goalInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const inviteeInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
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
  const [invitees, setInvitees] = useState<InviteeWithProfile[]>([
    { publicId: "", profile: null, loading: false, notFound: false }
  ]);

  // Debounced search for user profiles
  const searchUserProfile = useCallback(async (publicId: string, index: number) => {
    if (publicId.length !== 8) {
      setInvitees(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], profile: null, loading: false, notFound: false };
        return updated;
      });
      return;
    }

    setInvitees(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], loading: true, notFound: false };
      return updated;
    });

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name, avatar_url, public_id')
        .eq('public_id', publicId.toUpperCase())
        .single();

      setInvitees(prev => {
        const updated = [...prev];
        if (error || !data) {
          updated[index] = { ...updated[index], profile: null, loading: false, notFound: true };
        } else {
          updated[index] = { ...updated[index], profile: data, loading: false, notFound: false };
        }
        return updated;
      });
    } catch {
      setInvitees(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], profile: null, loading: false, notFound: true };
        return updated;
      });
    }
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (editMode && rankingToEdit && open) {
      setName(rankingToEdit.name);
      setDescription(rankingToEdit.description || "");
      setStartDate(rankingToEdit.start_date);
      setEndDate(rankingToEdit.end_date);
      setHasBet(!!rankingToEdit.bet_description);
      setBetDescription(rankingToEdit.bet_description || "");
      setBetAmount(rankingToEdit.bet_amount || "");
      setGoals(
        rankingToEdit.goals.length > 0
          ? rankingToEdit.goals.map(g => ({ title: g.title, description: g.description || "" }))
          : [{ title: "", description: "" }]
      );
    }
  }, [editMode, rankingToEdit, open]);

  // Debounce effect for invitee search
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    invitees.forEach((invitee, index) => {
      if (invitee.publicId.length === 8 && !invitee.profile && !invitee.loading) {
        const timer = setTimeout(() => {
          searchUserProfile(invitee.publicId, index);
        }, 300);
        timers.push(timer);
      }
    });

    return () => timers.forEach(t => clearTimeout(t));
  }, [invitees, searchUserProfile]);

  const addGoal = () => {
    const newGoals = [...goals, { title: "", description: "" }];
    setGoals(newGoals);
    setTimeout(() => {
      const lastIndex = newGoals.length - 1;
      goalInputRefs.current[lastIndex]?.focus();
    }, 0);
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

  const handleGoalKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentGoalTitle = goals[index].title.trim();
      
      if (currentGoalTitle) {
        addGoal();
      } else if (index < goals.length - 1) {
        goalInputRefs.current[index + 1]?.focus();
      }
    }
  };

  const addInvitee = () => {
    const newInvitees = [...invitees, { publicId: "", profile: null, loading: false, notFound: false }];
    setInvitees(newInvitees);
    setTimeout(() => {
      const lastIndex = newInvitees.length - 1;
      inviteeInputRefs.current[lastIndex]?.focus();
    }, 0);
  };

  const removeInvitee = (index: number) => {
    if (invitees.length > 1) {
      setInvitees(invitees.filter((_, i) => i !== index));
    }
  };

  const updateInvitee = (index: number, value: string) => {
    const newInvitees = [...invitees];
    const upperValue = value.toUpperCase();
    newInvitees[index] = { 
      publicId: upperValue, 
      profile: upperValue.length === 8 ? newInvitees[index].profile : null, 
      loading: false, 
      notFound: false 
    };
    setInvitees(newInvitees);
  };

  const handleInviteeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const currentInvitee = invitees[index].publicId.trim();
      
      if (currentInvitee.length === 8) {
        addInvitee();
      } else if (index < invitees.length - 1) {
        inviteeInputRefs.current[index + 1]?.focus();
      }
    }
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
    setInvitees([{ publicId: "", profile: null, loading: false, notFound: false }]);
  };

  const handleSubmit = async () => {
    if (!name.trim() || goals.every(g => !g.title.trim())) return;

    setLoading(true);
    try {
      const validGoals = goals.filter(g => g.title.trim());
      const validInvitees = invitees.filter(i => i.publicId.trim() && i.profile).map(i => i.publicId);

      if (editMode && rankingToEdit) {
        await updateRanking(rankingToEdit.id, {
          name,
          description: description || undefined,
          start_date: startDate,
          end_date: endDate,
          bet_description: hasBet ? betDescription : undefined,
          bet_amount: hasBet ? betAmount : undefined,
          goals: validGoals,
        });
      } else {
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
      }

      resetForm();
      setOpen(false);
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  };

  const validInviteesCount = invitees.filter(i => i.profile).length;

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
            {editMode ? 'Editar Ranking' : 'Criar Novo Ranking'}
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

          {/* Goals - Improved Visual */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Target className="h-4 w-4 text-muted-foreground" />
                Metas Diárias *
              </div>
              <Button variant="outline" size="sm" onClick={addGoal} className="gap-1.5">
                <Plus className="h-3 w-3" />
                Nova Meta
              </Button>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 via-muted/30 to-transparent border border-primary/10">
              <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary" />
                Pressione <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Enter</kbd> para criar uma nova meta rapidamente
              </p>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {goals.map((goal, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="group relative"
                    >
                      <div className={cn(
                        "flex items-center gap-2 p-2 rounded-lg transition-all duration-200",
                        "bg-background/80 border border-border/50",
                        "hover:border-primary/30 hover:shadow-sm",
                        goal.title.trim() && "border-primary/20 bg-primary/5"
                      )}>
                        <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs font-bold shrink-0">
                          {index + 1}
                        </div>
                        <Input
                          ref={(el) => { goalInputRefs.current[index] = el; }}
                          placeholder={`Qual é a meta ${index + 1}?`}
                          value={goal.title}
                          onChange={(e) => updateGoal(index, 'title', e.target.value)}
                          onKeyDown={(e) => handleGoalKeyDown(index, e)}
                          className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
                        />
                        {goals.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeGoal(index)}
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {goals.filter(g => g.title.trim()).length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{goals.filter(g => g.title.trim()).length} meta(s) definida(s)</span>
                  <span className="text-primary font-medium">
                    {(10 / Math.max(goals.filter(g => g.title.trim()).length, 1)).toFixed(1)} pts/meta
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Invitees - Only show in create mode */}
          {!editMode && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Convidar Participantes
                </div>
                <Button variant="outline" size="sm" onClick={addInvitee} className="gap-1.5">
                  <Plus className="h-3 w-3" />
                  Novo Participante
                </Button>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/5 via-muted/30 to-transparent border border-blue-500/10">
                <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-blue-500" />
                  Pressione <kbd className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">Enter</kbd> para adicionar outro participante
                </p>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {invitees.map((invitee, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="group relative"
                      >
                        <div className={cn(
                          "flex items-center gap-2 p-2 rounded-lg transition-all duration-200",
                          "bg-background/80 border border-border/50",
                          "hover:border-blue-500/30 hover:shadow-sm",
                          invitee.profile && "border-green-500/30 bg-green-500/5",
                          invitee.notFound && invitee.publicId.length === 8 && "border-red-500/30 bg-red-500/5"
                        )}>
                          {/* Avatar or placeholder */}
                          <div className="flex items-center justify-center h-9 w-9 rounded-lg shrink-0 overflow-hidden">
                            {invitee.loading ? (
                              <div className="h-full w-full flex items-center justify-center bg-muted">
                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                              </div>
                            ) : invitee.profile ? (
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={invitee.profile.avatar_url || undefined} />
                                <AvatarFallback className="text-xs bg-green-500/20 text-green-600">
                                  {invitee.profile.first_name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                            ) : (
                              <div className={cn(
                                "h-full w-full flex items-center justify-center rounded-lg",
                                invitee.notFound && invitee.publicId.length === 8 
                                  ? "bg-red-500/10 text-red-500" 
                                  : "bg-gradient-to-br from-blue-500/20 to-blue-500/10 text-blue-500"
                              )}>
                                <User className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          
                          {/* Input and name display */}
                          <div className="flex-1 min-w-0">
                            <Input
                              ref={(el) => { inviteeInputRefs.current[index] = el; }}
                              placeholder="Digite o ID (8 caracteres)"
                              value={invitee.publicId}
                              onChange={(e) => updateInvitee(index, e.target.value)}
                              onKeyDown={(e) => handleInviteeKeyDown(index, e)}
                              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 uppercase font-mono"
                              maxLength={8}
                            />
                            {invitee.profile && (
                              <motion.p 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs text-green-600 font-medium px-3 -mt-1 flex items-center gap-1"
                              >
                                <CheckCircle className="h-3 w-3" />
                                {invitee.profile.first_name} {invitee.profile.last_name}
                              </motion.p>
                            )}
                            {invitee.notFound && invitee.publicId.length === 8 && (
                              <motion.p 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-xs text-red-500 px-3 -mt-1"
                              >
                                Usuário não encontrado
                              </motion.p>
                            )}
                          </div>
                          
                          {invitees.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeInvitee(index)}
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                {validInviteesCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {validInviteesCount} participante(s) encontrado(s)
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

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
              {loading 
                ? (editMode ? "Salvando..." : "Criando...") 
                : (editMode ? "Salvar Alterações" : "Criar Ranking")
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
