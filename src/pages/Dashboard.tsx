import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format, differenceInDays, startOfDay, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarWidget } from "@/components/calendar/CalendarWidget";
import { AnimatedFire } from "@/components/achievements/AnimatedFire";

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

const CATEGORY_COLORS: Record<string, string> = {
  FINANCIAL: "#22c55e",
  FITNESS: "#f59e0b",
  HEALTH: "#ef4444",
  PERSONAL: "#8b5cf6",
};

export default function Dashboard() {
  const { user } = useAuth();
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

  const fetchStats = useCallback(async () => {
    if (!user) return;

    const today = format(new Date(), "yyyy-MM-dd");
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

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

    const todayTasks = todayTasksRes.data || [];
    const completed = todayTasks.filter((t) => t.completed).length;
    const total = todayTasks.length;
    const pending = todayTasks
      .filter((t) => !t.completed)
      .slice(0, 5)
      .map((t) => ({ id: t.id, title: t.title, priority: t.priority || 2 }));

    let daysInApp = 1;
    if (settingsRes.data?.created_at) {
      daysInApp = Math.max(1, differenceInDays(new Date(), new Date(settingsRes.data.created_at)) + 1);
    }

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchStats]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col -m-6 bg-background">
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

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">{getGreeting()}, Bruce.</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Stats Cards */}
        <div className="px-6 py-5">
          <h2 className="text-xl font-bold text-foreground uppercase tracking-wider mb-4">
            Visão Geral
          </h2>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {/* Tasks Today */}
            <Link to="/rotina" className="cave-card p-5 group">
              <div className="flex items-center justify-between mb-3">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-bold">{stats.tasksCompletedToday}/{stats.tasksTotalToday}</p>
              <p className="text-sm text-muted-foreground">Tarefas hoje</p>
              <Progress value={stats.todayProgress} className="h-1.5 mt-2" />
            </Link>

            {/* Streak */}
            <Link to="/consistencia" className="cave-card p-5 group">
              <div className="flex items-center justify-between mb-3">
                {getStreakIcon(stats.currentStreak)}
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-center gap-1">
                <p className="text-2xl font-bold">{stats.currentStreak}</p>
                <AnimatedFire streak={stats.currentStreak} size="sm" />
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.currentStreak === 1 ? "Dia ativo" : "Dias seguidos"}
              </p>
            </Link>

            {/* Habits */}
            <Link to="/habitos" className="cave-card p-5 group">
              <div className="flex items-center justify-between mb-3">
                <CalendarCheck className="h-5 w-5 text-muted-foreground" />
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-bold">{stats.habitsCompletedToday}/{stats.habitsTotalToday}</p>
              <p className="text-sm text-muted-foreground">Hábitos hoje</p>
              <Progress 
                value={stats.habitsTotalToday > 0 ? (stats.habitsCompletedToday / stats.habitsTotalToday) * 100 : 0} 
                className="h-1.5 mt-2" 
              />
            </Link>

            {/* Goals */}
            <Link to="/metas" className="cave-card p-5 group">
              <div className="flex items-center justify-between mb-3">
                <Target className="h-5 w-5 text-muted-foreground" />
                <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-2xl font-bold">{stats.goalsCompleted}/{stats.goalsActive}</p>
              <p className="text-sm text-muted-foreground">Metas alcançadas</p>
              <Progress 
                value={stats.goalsActive > 0 ? (stats.goalsCompleted / stats.goalsActive) * 100 : 0} 
                className="h-1.5 mt-2" 
              />
            </Link>
          </div>
        </div>

        {/* Main Grid */}
        <div className="px-6 py-5 border-t border-border/30">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Column 1: Rotina + Consistência */}
            <div className="space-y-6">
              {/* Pending Tasks */}
              <div className="cave-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold uppercase tracking-wider text-sm">Rotina de Hoje</h3>
                  <Link to="/rotina" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
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
                            task.priority === 3 ? "bg-destructive" : 
                            task.priority === 2 ? "bg-warning" : 
                            task.priority === 1 ? "bg-primary" : "bg-muted-foreground"
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
                      <Link to="/rotina">Criar tarefa</Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Consistency Grid */}
              <div className="cave-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold uppercase tracking-wider text-sm">Consistência</h3>
                  <Link to="/consistencia" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    Ver mais <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-10 gap-1">
                  {stats.last30Days.map((day, i) => (
                    <div
                      key={i}
                      className={cn(
                        "consistency-day aspect-square rounded-sm",
                        day.isActive ? "bg-success" : "bg-secondary"
                      )}
                      title={day.date}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">Últimos 30 dias</p>
              </div>
            </div>

            {/* Column 2: Metas + Finanças */}
            <div className="space-y-6">
              {/* Active Goals */}
              <div className="cave-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold uppercase tracking-wider text-sm">Metas Ativas</h3>
                  <Link to="/metas" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    Ver todas <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {stats.activeGoals.length > 0 ? (
                  <div className="space-y-4">
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
                  <div className="text-center py-6">
                    <p className="text-sm text-muted-foreground mb-3">Nenhuma meta ativa</p>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/metas">Criar meta</Link>
                    </Button>
                  </div>
                )}
              </div>

              {/* Finances */}
              <div className="cave-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold uppercase tracking-wider text-sm">Finanças do Mês</h3>
                  <Link to="/financas" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    Ver mais <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <span className="text-sm text-muted-foreground">Ganhos</span>
                    </div>
                    <span className="text-sm font-medium text-success">
                      R$ {stats.financeIncome.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-muted-foreground">Gastos</span>
                    </div>
                    <span className="text-sm font-medium text-destructive">
                      R$ {stats.financeExpense.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Saldo</span>
                    </div>
                    <span className={cn(
                      "text-sm font-bold",
                      stats.financeBalance >= 0 ? "text-success" : "text-destructive"
                    )}>
                      R$ {stats.financeBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: Agenda */}
            <div className="cave-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold uppercase tracking-wider text-sm">Agenda</h3>
                <Link to="/agenda" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  Ver mais <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <CalendarWidget />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
