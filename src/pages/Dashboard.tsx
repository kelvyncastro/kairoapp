import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2,
  Calendar,
  Flame,
  Target,
  Plus,
  ArrowRight,
  Trophy,
  Crown,
  Wallet,
  TrendingUp,
  TrendingDown,
  CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format, differenceInDays, startOfDay, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarWidget } from "@/components/calendar/CalendarWidget";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface DashboardStats {
  tasksCompletedToday: number;
  tasksTotalToday: number;
  tasksTotal: number;
  daysInApp: number;
  currentStreak: number;
  goalsActive: number;
  goalsCompleted: number;
  todayProgress: number;
  pendingTasks: Array<{ id: string; title: string; priority: number }>;
  last30Days: Array<{ date: string; isActive: boolean }>;
  habitsCompletedToday: number;
  habitsTotalToday: number;
  habitsMonthlyRate: number;
  financeBalance: number;
  financeIncome: number;
  financeExpense: number;
  activeGoals: Array<{ id: string; title: string; current: number; target: number; unit: string; category: string }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [stats, setStats] = useState<DashboardStats>({
    tasksCompletedToday: 0,
    tasksTotalToday: 0,
    tasksTotal: 0,
    daysInApp: 1,
    currentStreak: 0,
    goalsActive: 0,
    goalsCompleted: 0,
    todayProgress: 0,
    pendingTasks: [],
    last30Days: [],
    habitsCompletedToday: 0,
    habitsTotalToday: 0,
    habitsMonthlyRate: 0,
    financeBalance: 0,
    financeIncome: 0,
    financeExpense: 0,
    activeGoals: [],
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "FINANCIAL": return "text-emerald-500";
      case "FITNESS": return "text-blue-500";
      case "HEALTH": return "text-red-500";
      default: return "text-purple-500";
    }
  };

  const fetchStats = useCallback(async () => {
    if (!user) return;

    const today = format(new Date(), "yyyy-MM-dd");
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

    // Fetch all data in parallel
    const [
      todayTasksRes,
      totalTasksRes,
      settingsRes,
      consistencyRes,
      goalsRes,
      habitsRes,
      habitLogsRes,
      transactionsRes,
    ] = await Promise.all([
      supabase.from("daily_tasks").select("*").eq("user_id", user.id).or(`date.eq.${today},due_date.eq.${today}`),
      supabase.from("daily_tasks").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("completed", true),
      supabase.from("user_settings").select("created_at").eq("user_id", user.id).maybeSingle(),
      supabase.from("consistency_days").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(60),
      supabase.from("goals").select("*").eq("user_id", user.id).eq("status", "ACTIVE"),
      supabase.from("habits").select("*").eq("user_id", user.id).eq("active", true),
      supabase.from("habit_logs").select("*, habits!inner(user_id)").eq("habits.user_id", user.id).eq("date", today),
      supabase.from("finance_transactions").select("*").eq("user_id", user.id).gte("date", monthStart).lte("date", monthEnd),
    ]);

    // Process tasks
    const todayTasks = todayTasksRes.data || [];
    const completed = todayTasks.filter((t) => t.completed).length;
    const total = todayTasks.length;
    const pending = todayTasks
      .filter((t) => !t.completed)
      .slice(0, 5)
      .map((t) => ({ id: t.id, title: t.title, priority: t.priority || 2 }));

    // Days in app
    let daysInApp = 1;
    if (settingsRes.data?.created_at) {
      daysInApp = Math.max(1, differenceInDays(new Date(), new Date(settingsRes.data.created_at)) + 1);
    }

    // Streak calculation
    const consistencyDays = consistencyRes.data || [];
    let currentStreak = 0;
    const todayStart = startOfDay(new Date());
    for (let i = 0; i <= 60; i++) {
      const checkDate = format(subDays(todayStart, i), "yyyy-MM-dd");
      const dayData = consistencyDays.find((d) => d.date === checkDate);
      if (dayData?.is_active) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    // Last 30 days
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(todayStart, i), "yyyy-MM-dd");
      const dayData = consistencyDays.find((d) => d.date === date);
      last30Days.push({ date, isActive: dayData?.is_active || false });
    }

    // Goals
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

    // Habits
    const habits = habitsRes.data || [];
    const habitLogs = habitLogsRes.data || [];
    const dayOfWeek = format(new Date(), "EEE").toLowerCase();
    const todayHabits = habits.filter((h) => {
      const freq = h.frequency as string[];
      return freq.includes(dayOfWeek);
    });
    const completedHabitsToday = habitLogs.filter((l) => l.status === "done").length;

    // Habits monthly rate (simplified)
    const daysInMonth = new Date().getDate();
    const expectedLogs = habits.length * daysInMonth;
    const monthlyRate = expectedLogs > 0 ? Math.round((completedHabitsToday * daysInMonth / expectedLogs) * 100) : 0;

    // Finances
    const transactions = transactionsRes.data || [];
    const income = transactions.filter((t) => t.value > 0).reduce((sum, t) => sum + t.value, 0);
    const expense = transactions.filter((t) => t.value < 0).reduce((sum, t) => sum + Math.abs(t.value), 0);

    setStats({
      tasksCompletedToday: completed,
      tasksTotalToday: total,
      tasksTotal: totalTasksRes.count || 0,
      daysInApp,
      currentStreak,
      goalsActive: goals.length,
      goalsCompleted,
      todayProgress: total > 0 ? Math.round((completed / total) * 100) : 0,
      pendingTasks: pending,
      last30Days,
      habitsCompletedToday: completedHabitsToday,
      habitsTotalToday: todayHabits.length,
      habitsMonthlyRate: monthlyRate,
      financeBalance: income - expense,
      financeIncome: income,
      financeExpense: expense,
      activeGoals,
    });
    setLoading(false);
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Real-time subscriptions for all relevant tables
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_tasks', filter: `user_id=eq.${user.id}` },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'consistency_days', filter: `user_id=eq.${user.id}` },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${user.id}` },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${user.id}` },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'habit_logs' },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'finance_transactions', filter: `user_id=eq.${user.id}` },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchStats]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">{getGreeting()}, Bruce.</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Tasks Today */}
        <div className="cave-card p-5">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            <Link to="/rotina" className="text-xs text-muted-foreground hover:text-foreground">
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-2xl font-bold">{stats.tasksCompletedToday}/{stats.tasksTotalToday}</p>
          <p className="text-sm text-muted-foreground">Tarefas hoje</p>
          <Progress value={stats.todayProgress} className="h-1.5 mt-2" />
        </div>

        {/* Streak */}
        <div className="cave-card p-5">
          <div className="flex items-center justify-between mb-3">
            {getStreakIcon(stats.currentStreak)}
            <Link to="/consistencia" className="text-xs text-muted-foreground hover:text-foreground">
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-2xl font-bold">{stats.currentStreak}</p>
          <p className="text-sm text-muted-foreground">
            {stats.currentStreak === 1 ? "Dia ativo" : "Dias seguidos"}
          </p>
          {stats.currentStreak >= 3 && (
            <p className="text-xs text-muted-foreground mt-1">
              {stats.currentStreak >= 30 ? "👑 Lendário!" : stats.currentStreak >= 7 ? "🏆 Excelente!" : "🔥 Continue!"}
            </p>
          )}
        </div>

        {/* Habits */}
        <div className="cave-card p-5">
          <div className="flex items-center justify-between mb-3">
            <CalendarCheck className="h-5 w-5 text-muted-foreground" />
            <Link to="/habitos" className="text-xs text-muted-foreground hover:text-foreground">
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-2xl font-bold">{stats.habitsCompletedToday}/{stats.habitsTotalToday}</p>
          <p className="text-sm text-muted-foreground">Hábitos hoje</p>
          <Progress 
            value={stats.habitsTotalToday > 0 ? (stats.habitsCompletedToday / stats.habitsTotalToday) * 100 : 0} 
            className="h-1.5 mt-2" 
          />
        </div>

        {/* Goals */}
        <div className="cave-card p-5">
          <div className="flex items-center justify-between mb-3">
            <Target className="h-5 w-5 text-muted-foreground" />
            <Link to="/metas" className="text-xs text-muted-foreground hover:text-foreground">
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <p className="text-2xl font-bold">{stats.goalsCompleted}/{stats.goalsActive}</p>
          <p className="text-sm text-muted-foreground">Metas alcançadas</p>
          <Progress 
            value={stats.goalsActive > 0 ? (stats.goalsCompleted / stats.goalsActive) * 100 : 0} 
            className="h-1.5 mt-2" 
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Column 1: Rotina + Consistência */}
        <div className="space-y-6">
          {/* Pending Tasks */}
          <div className="cave-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Rotina de Hoje</h2>
              <Link to="/rotina" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                Ver tudo <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {stats.pendingTasks.length > 0 ? (
              <ul className="space-y-2">
                {stats.pendingTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-3 text-sm py-2 px-3 rounded-md bg-secondary/50"
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        task.priority === 3 ? "bg-red-500" : 
                        task.priority === 2 ? "bg-amber-500" : 
                        task.priority === 1 ? "bg-blue-500" : "bg-muted-foreground"
                      )}
                    />
                    <span className="truncate">{task.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">Tudo feito! 🎉</p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/rotina">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar tarefa
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Consistency Grid */}
          <div className="cave-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Consistência</h2>
              <Link to="/consistencia" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                Ver mais <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-10 gap-1">
              {stats.last30Days.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    "consistency-day aspect-square rounded-sm",
                    day.isActive ? "consistency-day-active" : "consistency-day-inactive"
                  )}
                  title={day.date}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Últimos 30 dias</p>
          </div>
        </div>

        {/* Column 2: Metas + Agenda */}
        <div className="space-y-6">
          {/* Active Goals */}
          <div className="cave-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Metas Ativas</h2>
              <Link to="/metas" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {stats.activeGoals.length > 0 ? (
              <div className="space-y-4">
                {stats.activeGoals.map((goal) => {
                  const progress = Math.min(100, Math.round((goal.current / goal.target) * 100));
                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={cn("text-xs font-medium", getCategoryColor(goal.category))}>
                          {goal.category === "FINANCIAL" ? "Financeira" : 
                           goal.category === "FITNESS" ? "Fitness" : 
                           goal.category === "HEALTH" ? "Saúde" : "Pessoal"}
                        </span>
                        <span className="text-xs text-muted-foreground">{progress}%</span>
                      </div>
                      <p className="text-sm font-medium truncate">{goal.title}</p>
                      <Progress value={progress} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">
                        {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">Nenhuma meta ativa</p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/metas">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar meta
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Calendar Widget */}
          <CalendarWidget />
        </div>

        {/* Column 3: Finanças + Days */}
        <div className="space-y-6">
          {/* Finances Summary */}
          <div className="cave-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Finanças do Mês</h2>
              <Link to="/financas" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                Ver mais <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-sm">Entradas</span>
                </div>
                <span className="text-sm font-medium text-success">
                  +R$ {stats.financeIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <span className="text-sm">Saídas</span>
                </div>
                <span className="text-sm font-medium text-destructive">
                  -R$ {stats.financeExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm font-medium">Saldo</span>
                </div>
                <span className={cn("text-lg font-bold", stats.financeBalance >= 0 ? "text-success" : "text-destructive")}>
                  R$ {stats.financeBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="cave-card p-5">
            <h2 className="font-semibold mb-4">Resumo Geral</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 bg-secondary/30 rounded-md px-3">
                <span className="text-sm text-muted-foreground">Dias no app</span>
                <span className="text-sm font-medium">{stats.daysInApp}</span>
              </div>
              <div className="flex items-center justify-between py-2 bg-secondary/30 rounded-md px-3">
                <span className="text-sm text-muted-foreground">Tarefas concluídas</span>
                <span className="text-sm font-medium">{stats.tasksTotal}</span>
              </div>
              <div className="flex items-center justify-between py-2 bg-secondary/30 rounded-md px-3">
                <span className="text-sm text-muted-foreground">Maior sequência</span>
                <span className="text-sm font-medium">{stats.currentStreak} dias</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground italic">"Hoje você apareceu?"</p>
      </div>
    </div>
  );
}
