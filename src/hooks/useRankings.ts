import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  public_id: string | null;
}

interface RankingParticipant {
  id: string;
  ranking_id: string;
  user_id: string;
  status: string;
  accepted_bet: boolean | null;
  total_points: number;
  joined_at: string | null;
  deletion_consent: boolean | null;
  profile?: UserProfile;
}

interface RankingGoal {
  id: string;
  ranking_id: string;
  title: string;
  description: string | null;
  order_index: number;
}

export interface Ranking {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  bet_description: string | null;
  bet_amount: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deletion_requested: boolean | null;
  deletion_requested_at: string | null;
  participants: RankingParticipant[];
  goals: RankingGoal[];
  creator_profile?: UserProfile;
}

export function useRankings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);

  const fetchRankings = useCallback(async () => {
    if (!user || fetchingRef.current) return;
    
    fetchingRef.current = true;

    try {
      // Fetch all rankings the user can see
      const { data: rankingsData, error: rankingsError } = await supabase
        .from("rankings")
        .select("*")
        .order("created_at", { ascending: false });

      if (rankingsError) throw rankingsError;
      if (!rankingsData || rankingsData.length === 0) {
        setRankings([]);
        setLoading(false);
        fetchingRef.current = false;
        return;
      }

      const rankingIds = rankingsData.map((r) => r.id);
      const creatorIds = [...new Set(rankingsData.map((r) => r.creator_id))];

      // Batch fetch all related data in parallel
      const [participantsRes, goalsRes, creatorProfilesRes] = await Promise.all([
        supabase
          .from("ranking_participants")
          .select("*")
          .in("ranking_id", rankingIds),
        supabase
          .from("ranking_goals")
          .select("*")
          .in("ranking_id", rankingIds)
          .order("order_index", { ascending: true }),
        supabase
          .from("user_profiles")
          .select("user_id, first_name, last_name, avatar_url, public_id")
          .in("user_id", creatorIds),
      ]);

      const participants = participantsRes.data || [];
      const goals = goalsRes.data || [];
      const creatorProfiles = creatorProfilesRes.data || [];

      // Fetch participant profiles
      const participantUserIds = [
        ...new Set(participants.map((p) => p.user_id)),
      ];
      const { data: participantProfiles } = participantUserIds.length > 0
        ? await supabase
            .from("user_profiles")
            .select("user_id, first_name, last_name, avatar_url, public_id")
            .in("user_id", participantUserIds)
        : { data: [] };

      const profilesMap = new Map<string, UserProfile>();
      [...(creatorProfiles || []), ...(participantProfiles || [])].forEach(
        (p) => {
          profilesMap.set(p.user_id, p as UserProfile);
        }
      );

      // Map data to rankings
      const enrichedRankings: Ranking[] = rankingsData.map((ranking) => {
        const rankingParticipants = participants
          .filter((p) => p.ranking_id === ranking.id)
          .map((p) => ({
            ...p,
            profile: profilesMap.get(p.user_id),
          }));

        const rankingGoals = goals.filter((g) => g.ranking_id === ranking.id);

        return {
          ...ranking,
          participants: rankingParticipants,
          goals: rankingGoals,
          creator_profile: profilesMap.get(ranking.creator_id),
        };
      });

      setRankings(enrichedRankings);
    } catch (error) {
      console.error("Error fetching rankings:", error);
      toast({
        title: "Erro ao carregar rankings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  // Realtime subscription for automatic updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("rankings-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rankings" },
        () => {
          fetchRankings();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ranking_participants" },
        () => {
          fetchRankings();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ranking_goals" },
        () => {
          fetchRankings();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ranking_goal_logs" },
        () => {
          fetchRankings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchRankings]);

  const refetch = useCallback(() => {
    fetchingRef.current = false;
    return fetchRankings();
  }, [fetchRankings]);

  return {
    rankings,
    loading,
    refetch,
  };
}
