import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Flame,
  Trophy,
  Crown,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  subMonths,
  addMonths,
  isSameMonth,
  isToday,
  subDays,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { AchievementCelebration } from "@/components/achievements/AchievementCelebration";

interface ConsistencyDay {
  date: string;
  is_active: boolean;
  reason: string | null;
  streak_snapshot: number;
}

interface Stats {
  currentStreak: number;
  bestStreak: number;
  activeDaysThisMonth: number;
  totalDays: number;
}

interface Badge {
  days: number;
  icon: typeof Flame | typeof Trophy | typeof Crown;
  label: string;
  color: string;
}

const badges: Badge[] = [
  { days: 3, icon: Flame, label: "Primeira chama", color: "streak-fire" },
  { days: 7, icon: Trophy, label: "Semana forte", color: "streak-trophy" },
  { days: 14, icon: Flame, label: "Duas semanas", color: "streak-fire" },
  { days: 30, icon: Crown, label: "Mês completo", color: "streak-crown" },
  { days: 60, icon: Trophy, label: "Dois meses", color: "streak-trophy" },
  { days: 100, icon: Crown, label: "Centenário", color: "streak-crown" },
];

export default function Consistencia() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [consistencyDays, setConsistencyDays] = useState<ConsistencyDay[]>([]);
  const [stats, setStats] = useState<Stats>({
    currentStreak: 0,
    bestStreak: 0,
    activeDaysThisMonth: 0,
    totalDays: 0,
  });
  const [loading, setLoading] = useState(true);
  // Demo: trigger 7-day badge celebration on mount
  const [celebratingBadge, setCelebratingBadge] = useState<Badge | null>(badges[1]);
  const previousBestStreakRef = useRef<number | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: days } = await supabase
      .from("consistency_days")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    setConsistencyDays((days as ConsistencyDay[]) || []);

    const allDays = (days as ConsistencyDay[]) || [];
    const monthDays = allDays.filter((d) =>
      isSameMonth(new Date(d.date), currentMonth)
    );
    const activeDaysThisMonth = monthDays.filter((d) => d.is_active).length;

    let currentStreak = 0;
    const todayStart = startOfDay(new Date());
    for (let i = 0; i <= 365; i++) {
      const checkDate = format(subDays(todayStart, i), "yyyy-MM-dd");
      const dayData = allDays.find((d) => d.date === checkDate);
      if (dayData?.is_active) {
        currentStreak++;
      } else if (i > 0) {
        break;
      }
    }

    let bestStreak = 0;
    let tempStreak = 0;
    const sortedDays = [...allDays].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    for (let i = 0; i < sortedDays.length; i++) {
      if (sortedDays[i].is_active) {
        tempStreak++;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    const newBestStreak = Math.max(bestStreak, currentStreak);
    
    // Check for new achievement
    if (previousBestStreakRef.current !== null) {
      const previousBest = previousBestStreakRef.current;
      const newlyUnlockedBadge = badges.find(
        (badge) => newBestStreak >= badge.days && previousBest < badge.days
      );
      if (newlyUnlockedBadge) {
        setCelebratingBadge(newlyUnlockedBadge);
      }
    }
    previousBestStreakRef.current = newBestStreak;

    setStats({
      currentStreak,
      bestStreak: newBestStreak,
      activeDaysThisMonth,
      totalDays: allDays.filter((d) => d.is_active).length,
    });

    setLoading(false);
  }, [user, currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = getDay(monthStart);
  const paddingDays = startDay === 0 ? 6 : startDay - 1;

  const getDayData = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return consistencyDays.find((d) => d.date === dateStr);
  };

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
          <h1 className="text-2xl font-bold">Consistência</h1>
          <p className="text-sm text-muted-foreground">O segredo está em aparecer todo dia.</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Stats Cards */}
        <div className="px-6 py-5">
          <h2 className="text-xl font-bold text-foreground uppercase tracking-wider mb-4">
            Estatísticas
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="cave-card p-6">
              <div className="flex items-center gap-2 mb-2">
                {stats.currentStreak >= 30 ? (
                  <Crown className="h-5 w-5 streak-crown" />
                ) : stats.currentStreak >= 7 ? (
                  <Trophy className="h-5 w-5 streak-trophy" />
                ) : stats.currentStreak >= 3 ? (
                  <Flame className="h-5 w-5 streak-fire" />
                ) : (
                  <Flame className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">Streak atual</span>
              </div>
              <p className="text-3xl font-bold">{stats.currentStreak}</p>
              <p className="text-xs text-muted-foreground">dias seguidos</p>
            </div>

            <div className="cave-card p-6">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Melhor streak</span>
              </div>
              <p className="text-3xl font-bold">{stats.bestStreak}</p>
              <p className="text-xs text-muted-foreground">dias</p>
            </div>

            <div className="cave-card p-6">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Este mês</span>
              </div>
              <p className="text-3xl font-bold">{stats.activeDaysThisMonth}</p>
              <p className="text-xs text-muted-foreground">dias ativos</p>
            </div>

            <div className="cave-card p-6">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Total</span>
              </div>
              <p className="text-3xl font-bold">{stats.totalDays}</p>
              <p className="text-xs text-muted-foreground">dias ativos</p>
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="px-6 py-5 border-t border-border/30">
          <h2 className="text-xl font-bold text-foreground uppercase tracking-wider mb-4">
            Calendário
          </h2>
          <div className="cave-card p-6">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-bold uppercase tracking-wider">
                {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-bold uppercase tracking-wider text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {[...Array(paddingDays)].map((_, i) => (
                <div key={`pad-${i}`} className="aspect-square" />
              ))}

              {daysInMonth.map((date) => {
                const dayData = getDayData(date);
                const isActive = dayData?.is_active;
                const today = isToday(date);

                return (
                  <div
                    key={date.toISOString()}
                    className={cn(
                      "aspect-square flex items-center justify-center rounded-md text-sm transition-colors relative group",
                      isActive
                        ? "bg-success text-success-foreground"
                        : "bg-secondary/50 text-muted-foreground",
                      today && "ring-2 ring-ring"
                    )}
                    title={dayData?.reason || "Sem atividade"}
                  >
                    {format(date, "d")}
                    {dayData?.reason && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                        {dayData.reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              Passe o mouse sobre um dia para ver o motivo
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="px-6 py-5 border-t border-border/30">
          <h2 className="text-xl font-bold text-foreground uppercase tracking-wider mb-4">
            Conquistas
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {badges.map((badge) => {
              const unlocked = stats.bestStreak >= badge.days;
              const Icon = badge.icon;

              return (
                <button
                  key={badge.days}
                  onClick={() => unlocked && setCelebratingBadge(badge)}
                  disabled={!unlocked}
                  className={cn(
                    "cave-card flex flex-col items-center gap-2 p-4 transition-all",
                    unlocked
                      ? "border-success/30 cursor-pointer hover:scale-105 hover:border-success/50"
                      : "opacity-50 cursor-not-allowed"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-8 w-8",
                      unlocked ? badge.color : "text-muted-foreground"
                    )}
                  />
                  <span className="text-sm font-medium text-center">
                    {badge.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {badge.days} dias
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Achievement Celebration Modal */}
      <AchievementCelebration
        badge={celebratingBadge}
        onClose={() => setCelebratingBadge(null)}
      />
    </div>
  );
}
