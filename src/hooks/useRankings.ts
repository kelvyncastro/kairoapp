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

      toast({
        title: "Ranking atualizado!",
        description: "As alterações foram salvas com sucesso."
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

    try {
      // Get ranking to calculate points
      const ranking = rankings.find(r => r.id === rankingId);
      if (!ranking) return;

      const totalGoals = ranking.goals.length;
      const pointsPerGoal = totalGoals > 0 ? 10 / totalGoals : 0;

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
        await supabase
          .from('ranking_goal_logs')
          .update({
            completed,
            points_earned: completed ? pointsPerGoal : 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLog.id);
      } else {
        // Create new log
        await supabase
          .from('ranking_goal_logs')
          .insert({
            ranking_id: rankingId,
            goal_id: goalId,
            user_id: user.id,
            date,
            completed,
            points_earned: completed ? pointsPerGoal : 0
          });
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

      await fetchRankings();
    } catch (error) {
      console.error('Error toggling goal:', error);
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

  return {
    rankings,
    loading,
    fetchRankings,
    createRanking,
    respondToInvite,
    toggleGoalCompletion,
    getGoalLogs,
    startRanking
  };
}
