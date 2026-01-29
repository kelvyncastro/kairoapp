import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2,
  Calendar,
  Flame,
  Target,
  Plus,
  Dumbbell,
  UtensilsCrossed,
  Wallet,
  ArrowRight,
  Trophy,
  Crown,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { format, differenceInDays, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarWidget } from "@/components/calendar/CalendarWidget";

interface DashboardStats {
  tasksCompletedToday: number;
  tasksTotal: number;
  daysInApp: number;
  currentStreak: number;
  goalsCompletedPercent: number;
  todayProgress: number;
  pendingTasks: Array<{ id: string; title: string; priority: number }>;
  last30Days: Array<{ date: string; isActive: boolean }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    tasksCompletedToday: 0,
    tasksTotal: 0,
    daysInApp: 1,
    currentStreak: 0,
    goalsCompletedPercent: 0,
    todayProgress: 0,
    pendingTasks: [],
    last30Days: [],
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

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;

      const today = format(new Date(), "yyyy-MM-dd");

      // Fetch today's tasks
      const { data: todayTasks } = await supabase
        .from("daily_tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today);

      const completed = todayTasks?.filter((t) => t.completed).length || 0;
      const total = todayTasks?.length || 0;
      const pending = todayTasks
        ?.filter((t) => !t.completed)
        .slice(0, 5)
        .map((t) => ({
          id: t.id,
          title: t.title,
          priority: t.priority,
        })) || [];

      // Fetch all tasks for total count
      const { count: totalTasks } = await supabase
        .from("daily_tasks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true);

      // Fetch user settings for first login date
      const { data: settings } = await supabase
        .from("user_settings")
        .select("created_at")
        .eq("user_id", user.id)
        .maybeSingle();

      let daysInApp = 1;
      if (settings?.created_at) {
        daysInApp = Math.max(
          1,
          differenceInDays(new Date(), new Date(settings.created_at)) + 1
        );
      }

      // Fetch consistency days for streak and calendar
      const { data: consistencyDays } = await supabase
        .from("consistency_days")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(60);

      // Calculate streak
      let currentStreak = 0;
      const todayStart = startOfDay(new Date());
      for (let i = 0; i <= 60; i++) {
        const checkDate = format(subDays(todayStart, i), "yyyy-MM-dd");
        const dayData = consistencyDays?.find((d) => d.date === checkDate);
        if (dayData?.is_active) {
          currentStreak++;
        } else if (i > 0) {
          break;
        }
      }

      // Build last 30 days for calendar
      const last30Days = [];
      for (let i = 29; i >= 0; i--) {
        const date = format(subDays(todayStart, i), "yyyy-MM-dd");
        const dayData = consistencyDays?.find((d) => d.date === date);
        last30Days.push({
          date,
          isActive: dayData?.is_active || false,
        });
      }

      // Fetch active goals
      const { data: activeGoals } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "ACTIVE");

      const completedGoals =
        activeGoals?.filter((g) => g.current_value >= g.target_value).length || 0;
      const goalsPercent = activeGoals?.length
        ? Math.round((completedGoals / activeGoals.length) * 100)
        : 0;

      setStats({
        tasksCompletedToday: completed,
        tasksTotal: totalTasks || 0,
        daysInApp,
        currentStreak,
        goalsCompletedPercent: goalsPercent,
        todayProgress: total > 0 ? Math.round((completed / total) * 100) : 0,
        pendingTasks: pending,
        last30Days,
      });
      setLoading(false);
    }

    fetchStats();
  }, [user]);

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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          {getGreeting()}, Bruce.
        </h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Tasks Completed */}
        <div className="cave-card p-6">
          <div className="flex items-center justify-between">
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold">{stats.tasksCompletedToday}</p>
            <p className="text-sm text-muted-foreground">Tarefas hoje</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.tasksTotal} concluídas no total
            </p>
          </div>
        </div>

        {/* Days in App */}
        <div className="cave-card p-6">
          <div className="flex items-center justify-between">
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold">{stats.daysInApp}</p>
            <p className="text-sm text-muted-foreground">Dias no app</p>
          </div>
        </div>

        {/* Streak */}
        <div className="cave-card p-6">
          <div className="flex items-center justify-between">
            {getStreakIcon(stats.currentStreak)}
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold">{stats.currentStreak}</p>
            <p className="text-sm text-muted-foreground">
              {stats.currentStreak === 1 ? "Dia ativo" : "Dias seguidos"}
            </p>
            {stats.currentStreak >= 3 && (
              <p className="text-xs text-muted-foreground mt-1">
                {stats.currentStreak >= 30
                  ? "👑 Lendário!"
                  : stats.currentStreak >= 7
                  ? "🏆 Excelente!"
                  : "🔥 Continue assim!"}
              </p>
            )}
          </div>
        </div>

        {/* Goals */}
        <div className="cave-card p-6">
          <div className="flex items-center justify-between">
            <Target className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold">{stats.goalsCompletedPercent}%</p>
            <p className="text-sm text-muted-foreground">Metas batidas</p>
          </div>
        </div>
      </div>

      {/* Middle Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Progress */}
        <div className="cave-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Progresso de Hoje</h2>
            <Link
              to="/rotina"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              Ver tudo <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">
                  {stats.tasksCompletedToday} de{" "}
                  {stats.pendingTasks.length + stats.tasksCompletedToday} tarefas
                </span>
                <span>{stats.todayProgress}%</span>
              </div>
              <Progress value={stats.todayProgress} className="h-2" />
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
                        "w-2 h-2 rounded-full",
                        task.priority === 3
                          ? "bg-primary"
                          : task.priority === 2
                          ? "bg-muted-foreground"
                          : "bg-muted"
                      )}
                    />
                    <span>{task.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">
                  Nenhuma tarefa pendente hoje
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link to="/rotina">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar tarefa
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Consistency Calendar */}
        <div className="cave-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Consistência</h2>
            <Link
              to="/consistencia"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              Ver mais <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid grid-cols-10 gap-1.5">
            {stats.last30Days.map((day, i) => (
              <div
                key={i}
                className={cn(
                  "consistency-day aspect-square",
                  day.isActive ? "consistency-day-active" : "consistency-day-inactive"
                )}
                title={day.date}
              />
            ))}
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Últimos 30 dias • Cada quadrado = 1 dia ativo
          </p>
        </div>

        {/* Calendar Widget */}
        <CalendarWidget />
      </div>

      {/* Quick Actions */}
      <div className="cave-card p-6">
        <h2 className="font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
            <Link to="/rotina">
              <Plus className="h-5 w-5" />
              <span>Nova Tarefa</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
            <Link to="/treino">
              <Dumbbell className="h-5 w-5" />
              <span>Iniciar Treino</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
            <Link to="/dieta">
              <UtensilsCrossed className="h-5 w-5" />
              <span>Adicionar Refeição</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
            <Link to="/financas">
              <Wallet className="h-5 w-5" />
              <span>Nova Transação</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground italic">
          "Hoje você apareceu?"
        </p>
      </div>
    </div>
  );
}
