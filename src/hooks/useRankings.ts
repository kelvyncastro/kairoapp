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
  const profilesCacheRef = useRef<Map<string, UserProfile>>(new Map());

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

      // Update cache
      [...(creatorProfiles || []), ...(participantProfiles || [])].forEach(
        (p) => {
          profilesCacheRef.current.set(p.user_id, p as UserProfile);
        }
      );

      // Map data to rankings
      const enrichedRankings: Ranking[] = rankingsData.map((ranking) => {
        const rankingParticipants = participants
          .filter((p) => p.ranking_id === ranking.id)
          .map((p) => ({
            ...p,
            profile: profilesCacheRef.current.get(p.user_id),
          }));

        const rankingGoals = goals.filter((g) => g.ranking_id === ranking.id);

        return {
          ...ranking,
          participants: rankingParticipants,
          goals: rankingGoals,
          creator_profile: profilesCacheRef.current.get(ranking.creator_id),
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
        (payload) => {
          if (payload.eventType === "UPDATE" && payload.new) {
            // Optimistic update for ranking changes
            setRankings((prev) =>
              prev.map((r) =>
                r.id === payload.new.id ? { ...r, ...payload.new } : r
              )
            );
          } else {
            fetchRankings();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ranking_participants" },
        (payload) => {
          if (payload.eventType === "UPDATE" && payload.new) {
            // Optimistic update for participant changes
            setRankings((prev) =>
              prev.map((r) => ({
                ...r,
                participants: r.participants.map((p) =>
                  p.id === payload.new.id
                    ? { ...p, ...payload.new }
                    : p
                ),
              }))
            );
          } else {
            fetchRankings();
          }
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
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            // Update participant points optimistically
            const log = payload.new as { ranking_id: string; user_id: string; points_earned: number };
            setRankings((prev) =>
              prev.map((r) => {
                if (r.id !== log.ranking_id) return r;
                return {
                  ...r,
                  participants: r.participants.map((p) => {
                    if (p.user_id !== log.user_id) return p;
                    // Recalculate or just trigger a refetch for accurate totals
                    return p;
                  }),
                };
              })
            );
            // Full refetch to get accurate point totals
            fetchRankings();
          } else {
            fetchRankings();
          }
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
