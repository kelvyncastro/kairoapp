import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Habit, HabitLog, HabitWithLogs, DAY_MAP } from '@/types/habits';
import { toast } from 'sonner';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  getDay,
  isBefore,
  isAfter,
  parseISO,
  isSameDay
} from 'date-fns';

export function useHabits(currentDate: Date) {
  const { user } = useAuth();
  const [habits, setHabits] = useState<HabitWithLogs[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Use string boundaries as dependencies (primitives are stable by value) to avoid infinite fetch loops.
  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

  // Check if a habit is planned for a specific day
  const isHabitPlannedForDay = useCallback((habit: Habit, date: Date): boolean => {
    const habitStartDate = parseISO(habit.start_date);
    if (isBefore(date, habitStartDate)) return false;
    
    const dayOfWeek = getDay(date);
    const dayKey = Object.entries(DAY_MAP).find(([, val]) => val === dayOfWeek)?.[0];
    
    return dayKey ? habit.frequency.includes(dayKey) : false;
  }, []);

  // Fetch habits and logs for the current month
  const fetchHabits = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch active habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('active', true)
        .order('created_at', { ascending: true });

      if (habitsError) throw habitsError;

      // Fetch logs for the current month
      const { data: logsData, error: logsError } = await supabase
        .from('habit_logs')
        .select('*')
        .gte('date', monthStartStr)
        .lte('date', monthEndStr);

      if (logsError) throw logsError;

      // Combine habits with their logs
      const habitsWithLogs: HabitWithLogs[] = (habitsData || []).map((habit) => ({
        ...habit,
        frequency: habit.frequency as string[],
        logs: (logsData || []).filter((log) => log.habit_id === habit.id),
      }));

      setHabits(habitsWithLogs);
    } catch (error) {
      console.error('Error fetching habits:', error);
      toast.error('Erro ao carregar hábitos');
    } finally {
      setLoading(false);
    }
  }, [user, monthStartStr, monthEndStr]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  // Create a new habit
  const createHabit = async (name: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name,
          frequency: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
          start_date: format(new Date(), 'yyyy-MM-dd'),
        })
        .select()
        .single();

      if (error) throw error;

      setHabits((prev) => [...prev, { ...data, frequency: data.frequency as string[], logs: [] }]);
      toast.success('Hábito criado!');
    } catch (error) {
      console.error('Error creating habit:', error);
      toast.error('Erro ao criar hábito');
    }
  };

  // Update a habit
  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    try {
      const { error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setHabits((prev) =>
        prev.map((h) => (h.id === id ? { ...h, ...updates } : h))
      );
      toast.success('Hábito atualizado!');
    } catch (error) {
      console.error('Error updating habit:', error);
      toast.error('Erro ao atualizar hábito');
    }
  };

  // Delete a habit
  const deleteHabit = async (id: string) => {
    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHabits((prev) => prev.filter((h) => h.id !== id));
      toast.success('Hábito removido!');
    } catch (error) {
      console.error('Error deleting habit:', error);
      toast.error('Erro ao remover hábito');
    }
  };

  // Toggle habit log for a specific day
  const toggleHabitLog = async (habitId: string, date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Don't allow toggling future dates
    if (isAfter(targetDate, today)) {
      toast.error('Não é possível marcar dias futuros');
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const habit = habits.find((h) => h.id === habitId);
    if (!habit) return;

    const existingLog = habit.logs.find((l) => l.date === dateStr);

    try {
      if (existingLog) {
        // Toggle between done and not_done
        const newStatus = existingLog.status === 'done' ? 'not_done' : 'done';
        
        const { error } = await supabase
          .from('habit_logs')
          .update({ status: newStatus })
          .eq('id', existingLog.id);

        if (error) throw error;

        // Optimistic update
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  logs: h.logs.map((l) =>
                    l.id === existingLog.id ? { ...l, status: newStatus } : l
                  ),
                }
              : h
          )
        );
      } else {
        // Create new log as done
        const { data, error } = await supabase
          .from('habit_logs')
          .insert({
            habit_id: habitId,
            date: dateStr,
            status: 'done',
          })
          .select()
          .single();

        if (error) throw error;

        // Optimistic update
        setHabits((prev) =>
          prev.map((h) =>
            h.id === habitId ? { ...h, logs: [...h.logs, data] } : h
          )
        );
      }
    } catch (error) {
      console.error('Error toggling habit log:', error);
      toast.error('Erro ao atualizar hábito');
    }
  };

  // Calculate habit adherence percentage
  const getHabitAdherence = useCallback((habit: HabitWithLogs): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let planned = 0;
    let done = 0;

    for (const day of daysInMonth) {
      if (isAfter(day, today)) continue;
      if (!isHabitPlannedForDay(habit, day)) continue;

      planned++;
      const dateStr = format(day, 'yyyy-MM-dd');
      const log = habit.logs.find((l) => l.date === dateStr);
      if (log?.status === 'done') {
        done++;
      }
    }

    return planned > 0 ? Math.round((done / planned) * 100) : 0;
  }, [daysInMonth, isHabitPlannedForDay]);

  // Calculate daily score for the chart - returns all days in the month
  const getDailyScores = useCallback((): { day: number; score: number }[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return daysInMonth.map((day) => {
      // Future days get score 0 (no data yet)
      if (isAfter(day, today)) {
        return { day: day.getDate(), score: 0 };
      }

      let planned = 0;
      let done = 0;

      for (const habit of habits) {
        if (!isHabitPlannedForDay(habit, day)) continue;
        planned++;
        
        const dateStr = format(day, 'yyyy-MM-dd');
        const log = habit.logs.find((l) => l.date === dateStr);
        if (log?.status === 'done') {
          done++;
        }
      }

      return {
        day: day.getDate(),
        score: planned > 0 ? Math.round((done / planned) * 100) : 0,
      };
    });
  }, [daysInMonth, habits, isHabitPlannedForDay]);

  // Get log status for a specific habit and day
  const getLogStatus = useCallback(
    (habit: HabitWithLogs, date: Date): 'done' | 'not_done' | 'pending' | 'future' | 'not_planned' => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      const dateStr = format(date, 'yyyy-MM-dd');
      const log = habit.logs.find((l) => l.date === dateStr);

      // If there is an explicit log, it wins (even if the day isn't in the planned frequency).
      // This guarantees: contador só soma quando o quadrado estiver com check.
      if (log?.status === 'done') return 'done';

      if (isAfter(targetDate, today)) return 'future';

      // Only mark as not_planned when there is no log for that day.
      if (!isHabitPlannedForDay(habit, date) && !log) return 'not_planned';
      if (isSameDay(targetDate, today)) return 'pending';
      return 'not_done';
    },
    [isHabitPlannedForDay]
  );

  return {
    habits,
    loading,
    daysInMonth,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleHabitLog,
    getHabitAdherence,
    getDailyScores,
    getLogStatus,
    isHabitPlannedForDay,
  };
}
