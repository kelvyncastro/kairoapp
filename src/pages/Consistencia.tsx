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
import { AnimatedFire } from "@/components/achievements/AnimatedFire";

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
  const [celebratingBadge, setCelebratingBadge] = useState<Badge | null>(null);
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
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-4 md:-m-6 bg-background overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex items-center justify-between px-4 md:px-6 py-2 md:py-3 border-b border-border/30 flex-shrink-0">
        <div>
          <h1 className="text-lg md:text-xl font-bold">Consistência</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">O segredo está em aparecer todo dia.</p>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Stats Cards - Compact */}
        <div className="px-4 md:px-6 py-2 md:py-3">
          <div className="grid gap-2 md:gap-3 grid-cols-4">
            <div className="cave-card p-2 md:p-4">
              <div className="flex items-center gap-1 mb-1">
                {stats.currentStreak >= 30 ? (
                  <Crown className="h-3 w-3 md:h-4 md:w-4 streak-crown" />
                ) : stats.currentStreak >= 7 ? (
                  <Trophy className="h-3 w-3 md:h-4 md:w-4 streak-trophy" />
                ) : stats.currentStreak >= 3 ? (
                  <Flame className="h-3 w-3 md:h-4 md:w-4 streak-fire" />
                ) : (
                  <Flame className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                )}
                <span className="text-[10px] md:text-xs text-muted-foreground hidden md:inline">Streak</span>
              </div>
              <div className="flex items-center gap-0.5">
                <p className="text-lg md:text-2xl font-bold">{stats.currentStreak}</p>
                <AnimatedFire streak={stats.currentStreak} size="sm" />
              </div>
              <p className="text-[8px] md:text-xs text-muted-foreground">dias</p>
            </div>

            <div className="cave-card p-2 md:p-4">
              <div className="flex items-center gap-1 mb-1">
                <Trophy className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                <span className="text-[10px] md:text-xs text-muted-foreground hidden md:inline">Melhor</span>
              </div>
              <p className="text-lg md:text-2xl font-bold">{stats.bestStreak}</p>
              <p className="text-[8px] md:text-xs text-muted-foreground">dias</p>
            </div>

            <div className="cave-card p-2 md:p-4">
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                <span className="text-[10px] md:text-xs text-muted-foreground hidden md:inline">Mês</span>
              </div>
              <p className="text-lg md:text-2xl font-bold">{stats.activeDaysThisMonth}</p>
              <p className="text-[8px] md:text-xs text-muted-foreground">dias</p>
            </div>

            <div className="cave-card p-2 md:p-4">
              <div className="flex items-center gap-1 mb-1">
                <Flame className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
                <span className="text-[10px] md:text-xs text-muted-foreground hidden md:inline">Total</span>
              </div>
              <p className="text-lg md:text-2xl font-bold">{stats.totalDays}</p>
              <p className="text-[8px] md:text-xs text-muted-foreground">dias</p>
            </div>
          </div>
        </div>

        {/* Calendar - Compact */}
        <div className="px-4 md:px-6 py-2 md:py-3 border-t border-border/30">
          <div className="cave-card p-3 md:p-4">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 md:h-8 md:w-8"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
              <h3 className="font-bold uppercase tracking-wider text-xs md:text-sm">
                {format(currentMonth, "MMM yyyy", { locale: ptBR })}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 md:h-8 md:w-8"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-1">
              {["S", "T", "Q", "Q", "S", "S", "D"].map((day, i) => (
                <div
                  key={i}
                  className="text-center text-[10px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5 md:gap-1">
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
                      "aspect-square flex items-center justify-center rounded text-[10px] md:text-xs transition-colors relative",
                      isActive
                        ? "bg-success text-success-foreground"
                        : "bg-secondary/50 text-muted-foreground",
                      today && "ring-1 ring-ring"
                    )}
                  >
                    {format(date, "d")}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Badges - Compact */}
        <div className="px-4 md:px-6 py-2 md:py-3 border-t border-border/30">
          <h2 className="text-xs md:text-sm font-bold text-foreground uppercase tracking-wider mb-2 md:mb-3">
            Conquistas
          </h2>
          <div className="grid grid-cols-6 gap-1 md:gap-2">
            {badges.map((badge) => {
              const unlocked = stats.bestStreak >= badge.days;
              const Icon = badge.icon;

              return (
                  <div
                    key={badge.days}
                    className={cn(
                      "cave-card flex flex-col items-center gap-0.5 md:gap-1 p-1.5 md:p-2 transition-all",
                      unlocked
                        ? "border-success/30"
                        : "opacity-50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 md:h-5 md:w-5",
                        unlocked ? badge.color : "text-muted-foreground"
                      )}
                    />
                    <span className="text-[8px] md:text-[10px] font-medium text-center leading-tight">
                      {badge.days}d
                    </span>
                  </div>
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
