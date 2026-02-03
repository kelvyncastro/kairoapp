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
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  deletion_requested: boolean;
  deletion_requested_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RankingParticipant {
  id: string;
  ranking_id: string;
  user_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  accepted_bet: boolean;
  total_points: number;
  deletion_consent: boolean;
  joined_at: string | null;
  created_at: string;
  // Joined data
  user_profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    public_id: string | null;
  };
}

export interface RankingGoal {
  id: string;
  ranking_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
}

export interface RankingGoalLog {
  id: string;
  ranking_id: string;
  goal_id: string;
  user_id: string;
  date: string;
  completed: boolean;
  points_earned: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'ranking_invite' | 'ranking_started' | 'ranking_ended' | 'ranking_update' | 'general';
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

export interface RankingWithDetails extends Ranking {
  participants: RankingParticipant[];
  goals: RankingGoal[];
  creator_profile?: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}
