import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Ranking, RankingParticipant, RankingGoal, RankingGoalLog, RankingWithDetails } from "@/types/ranking";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export function useRankings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rankings, setRankings] = useState<RankingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRankings = useCallback(async () => {
    if (!user) return;
    
    try {
      // Fetch rankings where user is creator or participant
      const { data: rankingsData, error: rankingsError } = await supabase
        .from('rankings')
        .select('*')
        .order('created_at', { ascending: false });

      if (rankingsError) throw rankingsError;

      // For each ranking, fetch participants and goals
      const rankingsWithDetails: RankingWithDetails[] = await Promise.all(
        (rankingsData || []).map(async (ranking) => {
          const [participantsRes, goalsRes] = await Promise.all([
            supabase
              .from('ranking_participants')
              .select('*')
              .eq('ranking_id', ranking.id),
            supabase
              .from('ranking_goals')
              .select('*')
              .eq('ranking_id', ranking.id)
              .order('order_index', { ascending: true })
          ]);

          // Fetch user profiles for participants
          const participantsWithProfiles = await Promise.all(
            (participantsRes.data || []).map(async (participant) => {
              const { data: profileData } = await supabase
                .from('user_profiles')
                .select('first_name, last_name, avatar_url, public_id')
                .eq('user_id', participant.user_id)
                .single();

              return {
                ...participant,
                user_profile: profileData || undefined
              } as RankingParticipant;
            })
          );

          // Fetch creator profile
          const { data: creatorProfile } = await supabase
            .from('user_profiles')
            .select('first_name, last_name, avatar_url')
            .eq('user_id', ranking.creator_id)
            .single();

          return {
            ...ranking,
            participants: participantsWithProfiles,
            goals: goalsRes.data || [],
            creator_profile: creatorProfile || undefined
          } as RankingWithDetails;
        })
      );

      setRankings(rankingsWithDetails);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      toast({
        title: "Erro ao carregar rankings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  const createRanking = async (
    data: {
      name: string;
      description?: string;
      start_date: string;
      end_date: string;
      bet_description?: string;
      bet_amount?: string;
      goals: { title: string; description?: string }[];
      invitees: string[]; // public_ids or emails
    }
  ) => {
    if (!user) return null;

    try {
      // Create ranking
      const { data: ranking, error: rankingError } = await supabase
        .from('rankings')
        .insert({
          name: data.name,
          description: data.description || null,
          creator_id: user.id,
          start_date: data.start_date,
          end_date: data.end_date,
          bet_description: data.bet_description || null,
          bet_amount: data.bet_amount || null,
        })
        .select()
        .single();

      if (rankingError) throw rankingError;

      // Add creator as participant (auto-accepted)
      await supabase
        .from('ranking_participants')
        .insert({
          ranking_id: ranking.id,
          user_id: user.id,
          status: 'accepted',
          accepted_bet: true,
          joined_at: new Date().toISOString()
        });

      // Create goals
      if (data.goals.length > 0) {
        const goalsToInsert = data.goals.map((goal, index) => ({
          ranking_id: ranking.id,
          title: goal.title,
          description: goal.description || null,
          order_index: index
        }));

        const { error: goalsError } = await supabase
          .from('ranking_goals')
          .insert(goalsToInsert);

        if (goalsError) throw goalsError;
      }

      // Invite participants
      for (const invitee of data.invitees) {
        // Try to find user by public_id or email
        let targetUserId: string | null = null;

        // First try public_id
        const { data: profileByPublicId } = await supabase
          .from('user_profiles')
          .select('user_id')
          .eq('public_id', invitee.toUpperCase())
          .single();

        if (profileByPublicId) {
          targetUserId = profileByPublicId.user_id;
        }

        if (targetUserId && targetUserId !== user.id) {
          // Add participant
          await supabase
            .from('ranking_participants')
            .insert({
              ranking_id: ranking.id,
              user_id: targetUserId,
              status: 'pending'
            });

          // Create notification
          await supabase
            .from('notifications')
            .insert({
              user_id: targetUserId,
              type: 'ranking_invite',
              title: 'Convite para Ranking',
              message: `Você foi convidado para participar do ranking "${data.name}"`,
              data: { ranking_id: ranking.id }
            });
        }
      }

      toast({
        title: "Ranking criado!",
        description: "Convites enviados para os participantes."
      });

      await fetchRankings();
      return ranking;
    } catch (error) {
      console.error('Error creating ranking:', error);
      toast({
        title: "Erro ao criar ranking",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateRanking = async (
    rankingId: string,
    data: {
      name: string;
      description?: string;
      start_date: string;
      end_date: string;
      bet_description?: string;
      bet_amount?: string;
      goals: { title: string; description?: string }[];
      newInvitees?: string[]; // New participants to invite
    }
  ) => {
    if (!user) return null;

    try {
      // Update ranking
      const { error: rankingError } = await supabase
        .from('rankings')
        .update({
          name: data.name,
          description: data.description || null,
          start_date: data.start_date,
          end_date: data.end_date,
          bet_description: data.bet_description || null,
          bet_amount: data.bet_amount || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', rankingId)
        .eq('creator_id', user.id);

      if (rankingError) throw rankingError;

      // Delete existing goals and recreate them
      await supabase
        .from('ranking_goals')
        .delete()
        .eq('ranking_id', rankingId);

      // Create new goals
      if (data.goals.length > 0) {
        const goalsToInsert = data.goals.map((goal, index) => ({
          ranking_id: rankingId,
          title: goal.title,
          description: goal.description || null,
          order_index: index
        }));

        const { error: goalsError } = await supabase
          .from('ranking_goals')
          .insert(goalsToInsert);

        if (goalsError) throw goalsError;
      }

      // Invite new participants if any
      if (data.newInvitees && data.newInvitees.length > 0) {
        for (const invitee of data.newInvitees) {
          // Find user by public_id
          const { data: profileByPublicId } = await supabase
            .from('user_profiles')
            .select('user_id')
            .eq('public_id', invitee.toUpperCase())
            .single();

          if (profileByPublicId && profileByPublicId.user_id !== user.id) {
            // Check if participant already exists
            const { data: existingParticipant } = await supabase
              .from('ranking_participants')
              .select('id')
              .eq('ranking_id', rankingId)
              .eq('user_id', profileByPublicId.user_id)
              .single();

            if (!existingParticipant) {
              // Add participant
              await supabase
                .from('ranking_participants')
                .insert({
                  ranking_id: rankingId,
                  user_id: profileByPublicId.user_id,
                  status: 'pending'
                });

              // Create notification
              await supabase
                .from('notifications')
                .insert({
                  user_id: profileByPublicId.user_id,
                  type: 'ranking_invite',
                  title: 'Convite para Ranking',
                  message: `Você foi convidado para participar do ranking "${data.name}"`,
                  data: { ranking_id: rankingId }
                });
            }
          }
        }
      }

      toast({
        title: "Ranking atualizado!",
        description: data.newInvitees && data.newInvitees.length > 0 
          ? "Alterações salvas e convites enviados."
          : "As alterações foram salvas com sucesso."
      });

      await fetchRankings();
      return true;
    } catch (error) {
      console.error('Error updating ranking:', error);
      toast({
        title: "Erro ao atualizar ranking",
        variant: "destructive"
      });
      return null;
    }
  };

  const respondToInvite = async (rankingId: string, accept: boolean, acceptBet: boolean = false) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('ranking_participants')
        .update({
          status: accept ? 'accepted' : 'rejected',
          accepted_bet: acceptBet,
          joined_at: accept ? new Date().toISOString() : null
        })
        .eq('ranking_id', rankingId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: accept ? "Convite aceito!" : "Convite recusado",
      });

      await fetchRankings();
    } catch (error) {
      console.error('Error responding to invite:', error);
      toast({
        title: "Erro ao responder convite",
        variant: "destructive"
      });
    }
  };

  const toggleGoalCompletion = async (
    rankingId: string,
    goalId: string,
    date: string,
    completed: boolean
  ) => {
    if (!user) return;

    // Get ranking to calculate points
    const ranking = rankings.find(r => r.id === rankingId);
    if (!ranking) return;

    // Prevent changes if ranking is completed
    if (ranking.status === 'completed') {
      toast({
        title: "Ranking finalizado",
        description: "Não é possível alterar metas de um ranking finalizado.",
        variant: "destructive"
      });
      return;
    }

    const totalGoals = ranking.goals.length;
    const pointsPerGoal = totalGoals > 0 ? 10 / totalGoals : 0;

    // OPTIMISTIC UPDATE: Update UI immediately before database operation
    const previousRankings = [...rankings];
    
    // We don't have goal logs in the state, but we trigger a visual update by forcing re-render
    // The actual UI component should handle optimistic state locally

    try {
      // Check if log exists
      const { data: existingLog } = await supabase
        .from('ranking_goal_logs')
        .select('*')
        .eq('goal_id', goalId)
        .eq('user_id', user.id)
        .eq('date', date)
        .single();

      if (existingLog) {
        // Update existing log
        const { error: updateError } = await supabase
          .from('ranking_goal_logs')
          .update({
            completed,
            points_earned: completed ? pointsPerGoal : 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLog.id);

        if (updateError) throw updateError;
      } else {
        // Create new log
        const { error: insertError } = await supabase
          .from('ranking_goal_logs')
          .insert({
            ranking_id: rankingId,
            goal_id: goalId,
            user_id: user.id,
            date,
            completed,
            points_earned: completed ? pointsPerGoal : 0
          });

        if (insertError) throw insertError;
      }

      // Update total points for participant
      const { data: allLogs } = await supabase
        .from('ranking_goal_logs')
        .select('points_earned')
        .eq('ranking_id', rankingId)
        .eq('user_id', user.id);

      const totalPoints = (allLogs || []).reduce((sum, log) => sum + Number(log.points_earned), 0);

      await supabase
        .from('ranking_participants')
        .update({ total_points: totalPoints })
        .eq('ranking_id', rankingId)
        .eq('user_id', user.id);

      // Background refetch (non-blocking)
      fetchRankings();
    } catch (error) {
      console.error('Error toggling goal:', error);
      // Revert on error
      setRankings(previousRankings);
      toast({
        title: "Erro ao atualizar meta",
        description: "Ocorreu um erro ao marcar/desmarcar a meta.",
        variant: "destructive"
      });
    }
  };

  const getGoalLogs = async (rankingId: string, date: string): Promise<RankingGoalLog[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('ranking_goal_logs')
        .select('*')
        .eq('ranking_id', rankingId)
        .eq('user_id', user.id)
        .eq('date', date);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching goal logs:', error);
      return [];
    }
  };

  const startRanking = async (rankingId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('rankings')
        .update({ status: 'active' })
        .eq('id', rankingId)
        .eq('creator_id', user.id);

      if (error) throw error;

      toast({
        title: "Ranking iniciado!",
      });

      await fetchRankings();
    } catch (error) {
      console.error('Error starting ranking:', error);
    }
  };

  const deleteRanking = async (rankingId: string) => {
    if (!user) return;

    try {
      const ranking = rankings.find(r => r.id === rankingId);
      if (!ranking) return false;

      // If ranking is active, check if all participants have consented
      if (ranking.status === 'active') {
        const acceptedParticipants = ranking.participants.filter(p => p.status === 'accepted');
        const allConsented = acceptedParticipants.every(p => p.deletion_consent === true);
        
        if (!allConsented) {
          toast({
            title: "Não é possível excluir",
            description: "Todos os participantes precisam consentir com a exclusão.",
            variant: "destructive"
          });
          return false;
        }
      }

      // Delete ranking (cascade will handle participants, goals, and logs)
      const { error } = await supabase
        .from('rankings')
        .delete()
        .eq('id', rankingId)
        .eq('creator_id', user.id);

      if (error) throw error;

      toast({
        title: "Ranking excluído!",
        description: "O ranking foi removido com sucesso."
      });

      await fetchRankings();
      return true;
    } catch (error) {
      console.error('Error deleting ranking:', error);
      toast({
        title: "Erro ao excluir ranking",
        variant: "destructive"
      });
      return false;
    }
  };

  const requestDeletion = async (rankingId: string) => {
    if (!user) return false;

    try {
      const ranking = rankings.find(r => r.id === rankingId);
      if (!ranking || ranking.creator_id !== user.id) return false;

      // Mark ranking as deletion requested
      const { error: updateError } = await supabase
        .from('rankings')
        .update({
          deletion_requested: true,
          deletion_requested_at: new Date().toISOString()
        })
        .eq('id', rankingId)
        .eq('creator_id', user.id);

      if (updateError) throw updateError;

      // Set creator's consent to true
      await supabase
        .from('ranking_participants')
        .update({ deletion_consent: true })
        .eq('ranking_id', rankingId)
        .eq('user_id', user.id);

      // Notify all other participants
      const otherParticipants = ranking.participants.filter(
        p => p.user_id !== user.id && p.status === 'accepted'
      );

      for (const participant of otherParticipants) {
        await supabase
          .from('notifications')
          .insert({
            user_id: participant.user_id,
            type: 'ranking_update',
            title: 'Solicitação de Exclusão',
            message: `O criador do ranking "${ranking.name}" está solicitando a exclusão. Seu consentimento é necessário.`,
            data: { ranking_id: rankingId, action: 'deletion_request' }
          });
      }

      toast({
        title: "Solicitação enviada!",
        description: "Aguardando consentimento dos outros participantes."
      });

      await fetchRankings();
      return true;
    } catch (error) {
      console.error('Error requesting deletion:', error);
      toast({
        title: "Erro ao solicitar exclusão",
        variant: "destructive"
      });
      return false;
    }
  };

  const consentToDeletion = async (rankingId: string, consent: boolean) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('ranking_participants')
        .update({ deletion_consent: consent })
        .eq('ranking_id', rankingId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: consent ? "Consentimento registrado" : "Consentimento negado",
        description: consent 
          ? "Você concordou com a exclusão do ranking."
          : "Você recusou a exclusão do ranking."
      });

      await fetchRankings();
      return true;
    } catch (error) {
      console.error('Error consenting to deletion:', error);
      toast({
        title: "Erro ao registrar consentimento",
        variant: "destructive"
      });
      return false;
    }
  };

  const cancelDeletionRequest = async (rankingId: string) => {
    if (!user) return false;

    try {
      // Reset deletion request
      const { error: updateError } = await supabase
        .from('rankings')
        .update({
          deletion_requested: false,
          deletion_requested_at: null
        })
        .eq('id', rankingId)
        .eq('creator_id', user.id);

      if (updateError) throw updateError;

      // Reset all consents
      await supabase
        .from('ranking_participants')
        .update({ deletion_consent: false })
        .eq('ranking_id', rankingId);

      toast({
        title: "Solicitação cancelada",
        description: "A solicitação de exclusão foi cancelada."
      });

      await fetchRankings();
      return true;
    } catch (error) {
      console.error('Error canceling deletion request:', error);
      return false;
    }
  };

  // Check and finalize expired rankings
  const checkAndFinalizeExpiredRankings = useCallback(async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find active rankings that have passed their end_date
    const expiredRankings = rankings.filter(r => {
      if (r.status !== 'active') return false;
      const endDate = new Date(r.end_date);
      endDate.setHours(23, 59, 59, 999);
      return today > endDate;
    });

    if (expiredRankings.length === 0) return;

    // Update each expired ranking to completed
    for (const ranking of expiredRankings) {
      try {
        const { error } = await supabase
          .from('rankings')
          .update({ status: 'completed' })
          .eq('id', ranking.id);

        if (error) {
          console.error('Error finalizing ranking:', error);
        }
      } catch (error) {
        console.error('Error finalizing ranking:', error);
      }
    }

    // Refetch to update UI
    await fetchRankings();
  }, [user, rankings, fetchRankings]);

  return {
    rankings,
    loading,
    fetchRankings,
    createRanking,
    updateRanking,
    respondToInvite,
    toggleGoalCompletion,
    getGoalLogs,
    startRanking,
    deleteRanking,
    requestDeletion,
    consentToDeletion,
    cancelDeletionRequest,
    checkAndFinalizeExpiredRankings
  };
}
