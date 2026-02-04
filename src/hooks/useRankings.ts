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
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchRankingsInternal = useCallback(async () => {
    if (!user) return;
    
    // Prevent concurrent fetches
    if (fetchingRef.current) return;
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
      
      // Collect all unique user IDs needed upfront
      const creatorIds = new Set(rankingsData.map((r) => r.creator_id));

      // Batch fetch all related data in parallel
      const [participantsRes, goalsRes] = await Promise.all([
        supabase
          .from("ranking_participants")
          .select("*")
          .in("ranking_id", rankingIds),
        supabase
          .from("ranking_goals")
          .select("*")
          .in("ranking_id", rankingIds)
          .order("order_index", { ascending: true }),
      ]);

      const participants = participantsRes.data || [];
      const goals = goalsRes.data || [];

      // Add all participant user IDs to the set
      participants.forEach((p) => creatorIds.add(p.user_id));

      // Filter out already cached profiles
      const uncachedUserIds = [...creatorIds].filter(
        (id) => !profilesCacheRef.current.has(id)
      );

      // Single batch fetch for ALL profiles needed (creators + participants)
      // Using secure RPC function that only exposes safe public fields
      if (uncachedUserIds.length > 0) {
        const { data: allPublicProfiles } = await supabase
          .rpc("get_public_user_profiles");

        // Filter to only the user IDs we need and update cache
        const neededProfiles = (allPublicProfiles || [])
          .filter((p: { user_id: string }) => uncachedUserIds.includes(p.user_id));
        
        neededProfiles.forEach((p: { user_id: string; first_name: string | null; avatar_url: string | null; public_id: string | null }) => {
          profilesCacheRef.current.set(p.user_id, {
            user_id: p.user_id,
            first_name: p.first_name,
            last_name: null, // Not exposed in secure function
            avatar_url: p.avatar_url,
            public_id: p.public_id,
          } as UserProfile);
        });
      }

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
      lastFetchRef.current = Date.now();
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
  }, [user, toast]);

  // Debounced fetch that prevents rapid successive calls
  const fetchRankings = useCallback(() => {
    // Clear any pending debounced fetch
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If we fetched recently (within 500ms), debounce
    const timeSinceLastFetch = Date.now() - lastFetchRef.current;
    if (timeSinceLastFetch < 500) {
      debounceTimerRef.current = setTimeout(() => {
        fetchRankingsInternal();
      }, 500 - timeSinceLastFetch);
    } else {
      fetchRankingsInternal();
    }
  }, [fetchRankingsInternal]);

  // Initial fetch
  useEffect(() => {
    fetchRankingsInternal();
  }, [fetchRankingsInternal]);

  // Realtime subscription for automatic updates
  useEffect(() => {
    if (!user) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel("rankings-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "rankings" },
          (payload) => {
            if (payload.eventType === "UPDATE" && payload.new) {
              setRankings((prev) =>
                prev.map((r) =>
                  r.id === payload.new.id ? { ...r, ...payload.new } : r
                )
              );
            } else if (payload.eventType === "INSERT") {
              fetchRankings();
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "ranking_participants" },
          (payload) => {
            if (payload.eventType === "UPDATE" && payload.new) {
              setRankings((prev) =>
                prev.map((r) => ({
                  ...r,
                  participants: r.participants.map((p) =>
                    p.id === payload.new.id ? { ...p, ...payload.new } : p
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
              const log = payload.new as { 
                ranking_id: string; 
                user_id: string; 
                points_earned: number;
                completed: boolean;
              };
              
              setRankings((prev) =>
                prev.map((r) => {
                  if (r.id !== log.ranking_id) return r;
                  return {
                    ...r,
                    participants: r.participants.map((p) => {
                      if (p.user_id !== log.user_id) return p;
                      const pointsDelta = log.completed ? log.points_earned : -log.points_earned;
                      return {
                        ...p,
                        total_points: Math.max(0, p.total_points + pointsDelta),
                      };
                    }),
                  };
                })
              );
              
              fetchRankings();
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error("Error setting up realtime subscription:", error);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, fetchRankings]);

  const refetch = useCallback(() => {
    fetchingRef.current = false;
    lastFetchRef.current = 0; // Reset to allow immediate fetch
    return fetchRankingsInternal();
  }, [fetchRankingsInternal]);

  return {
    rankings,
    loading,
    refetch,
  };
}
