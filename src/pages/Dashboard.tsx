import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2,
  Flame,
  Target,
  ArrowRight,
  Trophy,
  Crown,
  TrendingUp,
  TrendingDown,
  CalendarCheck,
  Wallet,
  ChevronDown,
  ChevronRight,
  Folder,
  CalendarClock,
  FileText,
  Swords,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format, differenceInDays, startOfDay, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AnimatedFire } from "@/components/achievements/AnimatedFire";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PendingTasksByFolder } from "@/components/dashboard/PendingTasksByFolder";
import { AnimatedNumber } from "@/components/ui/animated-number";

interface DashboardStats {
  tasksCompletedToday: number;
  tasksTotalToday: number;
  tasksTotal: number;
  daysInApp: number;
  currentStreak: number;
  goalsActive: number;
  goalsCompleted: number;
  todayProgress: number;
  pendingTasksByFolder: Array<{
    folderId: string | null;
    folderName: string;
    folderColor: string | null;
    tasks: Array<{ id: string; title: string; priority: number }>;
  }>;
  last30Days: Array<{ date: string; isActive: boolean }>;
  habitsCompletedToday: number;
  habitsTotalToday: number;
  habitsMonthlyRate: number;
  financeBalance: number;
  financeIncome: number;
  financeExpense: number;
  activeGoals: Array<{ id: string; title: string; current: number; target: number; unit: string; category: string }>;
  // New widgets
  calendarBlocks: Array<{ id: string; title: string; start_time: string; end_time: string; color: string | null }>;
  activeRankings: Array<{ id: string; name: string; userPoints: number; leaderName: string; leaderPoints: number; position: number; totalParticipants: number }>;
  recentNotes: Array<{ id: string; title: string; icon: string; updatedAt: string }>;
  weeklyHabits: Array<{ id: string; name: string; days: boolean[] }>;
}

const CATEGORY_COLORS: Record<string, string> = {
  FINANCIAL: "#22c55e",
  FITNESS: "#f59e0b",
  HEALTH: "#ef4444",
  PERSONAL: "#8b5cf6",
};

export default function Dashboard() {
  const { user } = useAuth();
  const { getDisplayName } = useUserProfile();
  const [stats, setStats] = useState<DashboardStats>({
    tasksCompletedToday: 0,
    tasksTotalToday: 0,
    tasksTotal: 0,
    daysInApp: 1,
    currentStreak: 0,
    goalsActive: 0,
    goalsCompleted: 0,
    todayProgress: 0,
    pendingTasksByFolder: [],
    last30Days: [],
    habitsCompletedToday: 0,
    habitsTotalToday: 0,
    habitsMonthlyRate: 0,
    financeBalance: 0,
    financeIncome: 0,
    financeExpense: 0,
    activeGoals: [],
    calendarBlocks: [],
    activeRankings: [],
    recentNotes: [],
    weeklyHabits: [],
  });
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getStreakIcon = (streak: number) => {
    if (streak >= 30) return <Crown className="h-5 w-5 streak-crown" />;
    if (streak >= 7) return <Trophy className="h-5 w-5 streak-trophy" />;
    if (streak >= 3) return <Flame className="h-5 w-5 streak-fire" />;
    return <Flame className="h-5 w-5 text-muted-foreground" />;
  };

  const fetchStats = useCallback(async () => {
    if (!user) return;

    const today = format(new Date(), "yyyy-MM-dd");
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
    const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");

    const [
      todayTasksRes,
      totalTasksRes,
      settingsRes,
      consistencyRes,
      goalsRes,
      habitsRes,
      habitLogsRes,
      transactionsRes,
      foldersRes,
      calendarBlocksRes,
      rankingsRes,
      weekHabitLogsRes,
    ] = await Promise.all([
      supabase.from("daily_tasks").select("*").eq("user_id", user.id).or(`date.eq.${today},due_date.eq.${today},and(start_date.lte.${today},due_date.gte.${today})`),
      supabase.from("daily_tasks").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("completed", true),
      supabase.from("user_settings").select("created_at").eq("user_id", user.id).maybeSingle(),
      supabase.from("consistency_days").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(60),
      supabase.from("goals").select("*").eq("user_id", user.id).eq("status", "ACTIVE"),
      supabase.from("habits").select("*").eq("user_id", user.id).eq("active", true),
      supabase.from("habit_logs").select("*, habits!inner(user_id)").eq("habits.user_id", user.id).eq("date", today),
      supabase.from("finance_transactions").select("*").eq("user_id", user.id).gte("date", monthStart).lte("date", monthEnd),
      supabase.from("task_folders").select("id, name, color").eq("user_id", user.id),
      supabase.from("calendar_blocks").select("id, title, start_time, end_time, color, status").eq("user_id", user.id).gte("start_time", `${today}T00:00:00`).lte("start_time", `${today}T23:59:59`).neq("status", "cancelled").order("start_time"),
      supabase.from("ranking_participants").select("ranking_id, total_points, status, rankings!inner(id, name, status, end_date)").eq("user_id", user.id).eq("status", "accepted"),
      supabase.from("habit_logs").select("*, habits!inner(user_id, name)").eq("habits.user_id", user.id).gte("date", weekStart).lte("date", weekEnd),
    ]);

    const folders = foldersRes.data || [];
    const foldersMap = new Map(folders.map(f => [f.id, { name: f.name, color: f.color }]));

    const todayTasks = todayTasksRes.data || [];
    const completed = todayTasks.filter((t) => t.completed).length;
    const total = todayTasks.length;
    
    // Group pending tasks by folder
    const pendingTasks = todayTasks.filter((t) => !t.completed);
    const tasksByFolderMap = new Map<string, { 
      folderId: string | null; 
      folderName: string; 
      folderColor: string | null; 
      tasks: Array<{ id: string; title: string; priority: number }> 
    }>();
    
    pendingTasks.forEach((t) => {
      const folderId = t.folder_id || null;
      const folder = folderId ? foldersMap.get(folderId) : null;
      const key = folderId || 'no-folder';
      
      if (!tasksByFolderMap.has(key)) {
        tasksByFolderMap.set(key, {
          folderId,
          folderName: folder?.name || 'Sem pasta',
          folderColor: folder?.color || null,
          tasks: [],
        });
      }
      
      tasksByFolderMap.get(key)!.tasks.push({
        id: t.id,
        title: t.title,
        priority: t.priority || 2,
      });
    });
    
    const pendingTasksByFolder = Array.from(tasksByFolderMap.values());

    let daysInApp = 1;
    if (settingsRes.data?.created_at) {
      daysInApp = Math.max(1, differenceInDays(new Date(), new Date(settingsRes.data.created_at)) + 1);
    }

    const consistencyDays = consistencyRes.data || [];
    let currentStreak = 0;
    for (let i = 0; i <= 60; i++) {
      const checkDate = format(subDays(todayStart, i), "yyyy-MM-dd");
      const dayData = consistencyDays.find((d) => d.date === checkDate);
      if (dayData?.is_active) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(todayStart, i), "yyyy-MM-dd");
      const dayData = consistencyDays.find((d) => d.date === date);
      last30Days.push({ date, isActive: dayData?.is_active || false });
    }

    const goals = goalsRes.data || [];
    const goalsCompleted = goals.filter((g) => g.current_value >= g.target_value).length;
    const activeGoals = goals.slice(0, 3).map((g) => ({
      id: g.id,
      title: g.title,
      current: g.current_value,
      target: g.target_value,
      unit: g.unit_label || "",
      category: g.category || "PERSONAL",
    }));

    const habits = habitsRes.data || [];
    const habitLogs = habitLogsRes.data || [];
    const dayOfWeek = format(new Date(), "EEE").toLowerCase();
    const todayHabits = habits.filter((h) => {
      const freq = h.frequency as string[];
      return freq.includes(dayOfWeek);
    });
    const completedHabitsToday = habitLogs.filter((l) => l.status === "done").length;

    const daysInMonth = new Date().getDate();
    const expectedLogs = habits.length * daysInMonth;
    const monthlyRate = expectedLogs > 0 ? Math.round((completedHabitsToday * daysInMonth / expectedLogs) * 100) : 0;

    const transactions = transactionsRes.data || [];
    const income = transactions.filter((t) => t.value > 0).reduce((sum, t) => sum + t.value, 0);
    const expense = transactions.filter((t) => t.value < 0).reduce((sum, t) => sum + Math.abs(t.value), 0);

    // Calendar blocks for today
    const calendarBlocks = (calendarBlocksRes.data || []).map((b) => ({
      id: b.id,
      title: b.title,
      start_time: b.start_time,
      end_time: b.end_time,
      color: b.color,
    }));

    // Active rankings
    const rankingParticipants = rankingsRes.data || [];
    const activeRankingIds = rankingParticipants
      .filter((rp: any) => rp.rankings?.status === 'active')
      .map((rp: any) => rp.rankings?.id)
      .filter(Boolean);

    let activeRankings: DashboardStats['activeRankings'] = [];
    if (activeRankingIds.length > 0) {
      const { data: allParticipants } = await supabase
        .from("ranking_participants")
        .select("ranking_id, user_id, total_points, status")
        .in("ranking_id", activeRankingIds)
        .eq("status", "accepted");

      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("user_id, first_name");

      const profilesMap = new Map((profiles || []).map(p => [p.user_id, p.first_name || 'Anônimo']));

      activeRankings = rankingParticipants
        .filter((rp: any) => rp.rankings?.status === 'active')
        .map((rp: any) => {
          const participants = (allParticipants || []).filter(p => p.ranking_id === rp.rankings.id);
          const sorted = [...participants].sort((a, b) => b.total_points - a.total_points);
          const leader = sorted[0];
          const myPosition = sorted.findIndex(p => p.user_id === user.id) + 1;
          return {
            id: rp.rankings.id,
            name: rp.rankings.name,
            userPoints: rp.total_points,
            leaderName: leader ? (leader.user_id === user.id ? 'Você' : profilesMap.get(leader.user_id) || 'Anônimo') : '',
            leaderPoints: leader?.total_points || 0,
            position: myPosition,
            totalParticipants: sorted.length,
          };
        }).slice(0, 3);
    }

    // Recent notes from localStorage
    let recentNotes: DashboardStats['recentNotes'] = [];
    try {
      const stored = localStorage.getItem('kairo-notes-pages');
      if (stored) {
        const pages = JSON.parse(stored) as Array<{ id: string; title: string; icon: string; updatedAt: string; isArchived: boolean }>;
        recentNotes = pages
          .filter(p => !p.isArchived)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 4)
          .map(p => ({ id: p.id, title: p.title, icon: p.icon, updatedAt: p.updatedAt }));
      }
    } catch {}

    // Weekly habits grid
    const weekHabitLogs = weekHabitLogsRes.data || [];
    const weekDays: string[] = [];
    const ws = startOfWeek(now, { weekStartsOn: 1 });
    for (let i = 0; i < 7; i++) {
      const d = new Date(ws);
      d.setDate(d.getDate() + i);
      weekDays.push(format(d, "yyyy-MM-dd"));
    }

    const weeklyHabits = habits.slice(0, 5).map((h) => {
      const days = weekDays.map(day => {
        return weekHabitLogs.some((l: any) => l.habit_id === h.id && l.date === day && l.status === 'done');
      });
      return { id: h.id, name: h.name, days };
    });

    setStats({
      tasksCompletedToday: completed,
      tasksTotalToday: total,
      tasksTotal: totalTasksRes.count || 0,
      daysInApp,
      currentStreak,
      goalsActive: goals.length,
      goalsCompleted,
      todayProgress: total > 0 ? Math.round((completed / total) * 100) : 0,
      pendingTasksByFolder,
      last30Days,
      habitsCompletedToday: completedHabitsToday,
      habitsTotalToday: todayHabits.length,
      habitsMonthlyRate: monthlyRate,
      financeBalance: income - expense,
      financeIncome: income,
      financeExpense: expense,
      activeGoals,
      calendarBlocks,
      activeRankings,
      recentNotes,
      weeklyHabits,
    });
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_tasks', filter: `user_id=eq.${user.id}` }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'consistency_days', filter: `user_id=eq.${user.id}` }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${user.id}` }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${user.id}` }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habit_logs' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_transactions', filter: `user_id=eq.${user.id}` }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'calendar_blocks', filter: `user_id=eq.${user.id}` }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchStats]);

  if (loading) {
    return (
      <div className="h-full flex flex-col -m-4 md:-m-6 bg-background overflow-hidden">
        <div className="px-6 py-4 border-b border-border/30">
          <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
        </div>
        <div className="flex-1 p-6">
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const weekDayLabels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="h-full flex flex-col -m-4 md:-m-6 bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border/30 flex-shrink-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{getGreeting()}, {getDisplayName()}.</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Stats Cards */}
        <div className="px-4 md:px-6 py-4 md:py-5">
          <h2 className="text-lg md:text-xl font-bold text-foreground uppercase tracking-wider mb-3 md:mb-4">
            Visão Geral
          </h2>
          <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
            {/* Tasks Today */}
            <Link to="/rotina" className="cave-card p-4 md:p-5 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-4 md:h-5 w-4 md:w-5 text-primary" />
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xl md:text-2xl font-bold"><AnimatedNumber value={stats.tasksCompletedToday} />/<AnimatedNumber value={stats.tasksTotalToday} /></p>
                <p className="text-xs md:text-sm text-muted-foreground">Tarefas hoje</p>
                <Progress value={stats.todayProgress} className="h-1 md:h-1.5 mt-2" />
              </div>
            </Link>

            {/* Streak */}
            <Link to="/consistencia" className="cave-card p-4 md:p-5 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="h-9 w-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    {getStreakIcon(stats.currentStreak)}
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center gap-1">
                  <p className="text-xl md:text-2xl font-bold"><AnimatedNumber value={stats.currentStreak} /></p>
                  <AnimatedFire streak={stats.currentStreak} size="sm" />
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {stats.currentStreak === 1 ? "Dia ativo" : "Dias seguidos"}
                </p>
              </div>
            </Link>

            {/* Habits */}
            <Link to="/habitos" className="cave-card p-4 md:p-5 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <CalendarCheck className="h-4 md:h-5 w-4 md:w-5 text-emerald-500" />
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xl md:text-2xl font-bold"><AnimatedNumber value={stats.habitsCompletedToday} />/<AnimatedNumber value={stats.habitsTotalToday} /></p>
                <p className="text-xs md:text-sm text-muted-foreground">Hábitos hoje</p>
                <Progress 
                  value={stats.habitsTotalToday > 0 ? (stats.habitsCompletedToday / stats.habitsTotalToday) * 100 : 0} 
                  className="h-1 md:h-1.5 mt-2" 
                />
              </div>
            </Link>

            {/* Goals */}
            <Link to="/metas" className="cave-card p-4 md:p-5 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="h-9 w-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Target className="h-4 md:h-5 w-4 md:w-5 text-violet-500" />
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xl md:text-2xl font-bold"><AnimatedNumber value={stats.goalsCompleted} />/<AnimatedNumber value={stats.goalsActive} /></p>
                <p className="text-xs md:text-sm text-muted-foreground">Metas alcançadas</p>
                <Progress 
                  value={stats.goalsActive > 0 ? (stats.goalsCompleted / stats.goalsActive) * 100 : 0} 
                  className="h-1 md:h-1.5 mt-2" 
                />
              </div>
            </Link>
          </div>
        </div>

        {/* Main Grid - Row 1 */}
        <div className="px-4 md:px-6 py-4 md:py-5 border-t border-border/30">
          <div className="grid gap-4 md:gap-6 lg:grid-cols-3 lg:auto-rows-fr">
            {/* Column 1: Tarefas */}
            <div className="cave-card p-4 md:p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <h3 className="font-bold uppercase tracking-wider text-xs md:text-sm">Tarefas do Dia</h3>
                </div>
                <Link to="/rotina" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  Ver todas <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex-1">
                <PendingTasksByFolder 
                  pendingTasksByFolder={stats.pendingTasksByFolder} 
                  embedded
                />
              </div>
            </div>

            {/* Column 2: Metas + Finanças */}
            <div className="flex flex-col gap-4 md:gap-6">
              {/* Active Goals */}
              <div className="cave-card p-4 md:p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                      <Target className="h-3.5 w-3.5 text-violet-500" />
                    </div>
                    <h3 className="font-bold uppercase tracking-wider text-xs md:text-sm">Metas Ativas</h3>
                  </div>
                  <Link to="/metas" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    Ver todas <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="flex-1 overflow-hidden">
                  {stats.activeGoals.length > 0 ? (
                    <div className="h-full max-h-[160px] overflow-y-auto pr-1 space-y-4">
                      {stats.activeGoals.map((goal) => {
                        const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
                        const color = CATEGORY_COLORS[goal.category] || CATEGORY_COLORS.PERSONAL;
                        return (
                          <div key={goal.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span 
                                className="text-xs font-medium px-2 py-0.5 rounded"
                                style={{ backgroundColor: `${color}20`, color }}
                              >
                                {goal.category === "FINANCIAL" ? "Financeira" : 
                                 goal.category === "FITNESS" ? "Fitness" : 
                                 goal.category === "HEALTH" ? "Saúde" : "Pessoal"}
                              </span>
                              <span className="text-xs text-muted-foreground">{progress}%</span>
                            </div>
                            <p className="text-sm font-medium truncate">{goal.title}</p>
                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all"
                                style={{ width: `${progress}%`, backgroundColor: color }}
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-6">
                      <p className="text-sm text-muted-foreground mb-3">Nenhuma meta ativa</p>
                      <Button asChild size="sm" variant="outline">
                        <Link to="/metas">Criar meta</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Finances */}
              <div className="cave-card p-4 md:p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <h3 className="font-bold uppercase tracking-wider text-xs md:text-sm">Finanças do Mês</h3>
                  </div>
                  <Link to="/financas" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    Ver mais <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="flex-1 flex flex-col justify-center space-y-2 md:space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <span className="text-xs md:text-sm text-muted-foreground">Ganhos</span>
                    </div>
                    <span className="text-xs md:text-sm font-medium text-success">
                      <AnimatedNumber value={stats.financeIncome} currency decimals={2} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      <span className="text-xs md:text-sm text-muted-foreground">Gastos</span>
                    </div>
                    <span className="text-xs md:text-sm font-medium text-destructive">
                      <AnimatedNumber value={stats.financeExpense} currency decimals={2} />
                    </span>
                  </div>
                  <div className="h-px bg-border my-1 md:my-2" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs md:text-sm font-medium">Saldo</span>
                    </div>
                    <span className={cn(
                      "text-xs md:text-sm font-bold",
                      stats.financeBalance >= 0 ? "text-success" : "text-destructive"
                    )}>
                      <AnimatedNumber value={stats.financeBalance} currency decimals={2} />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Consistência */}
            <div className="cave-card p-4 md:p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                  </div>
                  <h3 className="font-bold uppercase tracking-wider text-xs md:text-sm">Consistência</h3>
                </div>
                <Link to="/consistencia" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  Ver mais <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Streak Stats */}
              <div className="flex items-center justify-center gap-2 mb-4 md:mb-6">
                <div className="flex items-center gap-1">
                  {getStreakIcon(stats.currentStreak)}
                  <span className="text-3xl md:text-4xl font-bold"><AnimatedNumber value={stats.currentStreak} /></span>
                </div>
                <AnimatedFire streak={stats.currentStreak} size="md" />
              </div>
              <p className="text-center text-xs md:text-sm text-muted-foreground mb-4 md:mb-6">
                {stats.currentStreak === 0 ? "Comece seu streak hoje!" : 
                 stats.currentStreak === 1 ? "1 dia ativo" : 
                 `${stats.currentStreak} dias seguidos`}
              </p>

              {/* 30 Days Grid */}
              <div className="flex-1 flex flex-col justify-center">
                <p className="text-xs text-muted-foreground mb-3">Últimos 30 dias</p>
                <div className="grid grid-cols-10 gap-1.5">
                  {stats.last30Days.map((day, i) => (
                    <div
                      key={i}
                      className={cn(
                        "aspect-square rounded-sm transition-all hover:scale-110",
                        day.isActive ? "bg-success" : "bg-secondary"
                      )}
                      title={day.date}
                    />
                  ))}
                </div>
              </div>

              {/* Stats Summary */}
              <div className="mt-6 pt-4 border-t border-border/50">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold"><AnimatedNumber value={stats.last30Days.filter(d => d.isActive).length} /></p>
                    <p className="text-xs text-muted-foreground">Dias ativos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold"><AnimatedNumber value={Math.round((stats.last30Days.filter(d => d.isActive).length / 30) * 100)} suffix="%" /></p>
                    <p className="text-xs text-muted-foreground">Taxa mensal</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: New Widgets */}
        <div className="px-4 md:px-6 py-4 md:py-5 border-t border-border/30">
          <div className="grid gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-4">
            {/* Calendar Blocks */}
            <div className="cave-card p-4 md:p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <CalendarClock className="h-3.5 w-3.5 text-blue-500" />
                  </div>
                  <h3 className="font-bold uppercase tracking-wider text-xs">Agenda Hoje</h3>
                </div>
                <Link to="/calendario" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  Ver <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[180px]">
                {stats.calendarBlocks.length > 0 ? (
                  stats.calendarBlocks.map((block) => {
                    const startTime = format(parseISO(block.start_time), "HH:mm");
                    const endTime = format(parseISO(block.end_time), "HH:mm");
                    return (
                      <div key={block.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="w-1 h-8 rounded-full bg-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{block.title}</p>
                          <p className="text-xs text-muted-foreground">{startTime} – {endTime}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-6">
                    <CalendarClock className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Nenhum bloco hoje</p>
                  </div>
                )}
              </div>
            </div>

            {/* Rankings */}
            <div className="cave-card p-4 md:p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Swords className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                  <h3 className="font-bold uppercase tracking-wider text-xs">Rankings</h3>
                </div>
                <Link to="/ranking" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  Ver <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto max-h-[180px]">
                {stats.activeRankings.length > 0 ? (
                  stats.activeRankings.map((r) => (
                    <Link key={r.id} to="/ranking" className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0",
                        r.position === 1 ? "bg-amber-500/20 text-amber-500" : "bg-muted text-muted-foreground"
                      )}>
                        #{r.position}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{r.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.leaderName} lidera • {r.leaderPoints} pts
                        </p>
                      </div>
                      <span className="text-xs font-bold text-primary">{r.userPoints} pts</span>
                    </Link>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-6">
                    <Trophy className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Nenhum ranking ativo</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Notes */}
            <div className="cave-card p-4 md:p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-pink-500/10 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-pink-500" />
                  </div>
                  <h3 className="font-bold uppercase tracking-wider text-xs">Notas Recentes</h3>
                </div>
                <Link to="/notas" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  Ver <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[180px]">
                {stats.recentNotes.length > 0 ? (
                  stats.recentNotes.map((note) => (
                    <Link key={note.id} to="/notas" className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <span className="text-lg flex-shrink-0">{note.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{note.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(note.updatedAt), "dd/MM HH:mm")}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-6">
                    <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Nenhuma nota ainda</p>
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Habits Grid */}
            <div className="cave-card p-4 md:p-5 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CalendarCheck className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <h3 className="font-bold uppercase tracking-wider text-xs">Hábitos da Semana</h3>
                </div>
                <Link to="/habitos" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  Ver <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto max-h-[180px]">
                {stats.weeklyHabits.length > 0 ? (
                  <div className="space-y-2">
                    {/* Day labels */}
                    <div className="flex items-center gap-1">
                      <div className="w-20 flex-shrink-0" />
                      {weekDayLabels.map((d) => (
                        <div key={d} className="flex-1 text-center text-[10px] text-muted-foreground font-medium">{d}</div>
                      ))}
                    </div>
                    {stats.weeklyHabits.map((habit) => (
                      <div key={habit.id} className="flex items-center gap-1">
                        <span className="w-20 flex-shrink-0 text-xs truncate text-muted-foreground">{habit.name}</span>
                        {habit.days.map((done, i) => (
                          <div key={i} className="flex-1 flex justify-center">
                            <div className={cn(
                              "h-5 w-5 rounded-md transition-colors",
                              done ? "bg-primary" : "bg-secondary"
                            )} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-6">
                    <CalendarCheck className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Nenhum hábito ativo</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
