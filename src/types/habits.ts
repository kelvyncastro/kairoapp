export type HabitLogStatus = 'done' | 'not_done' | 'skipped';

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  frequency: string[]; // ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  start_date: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
  status: HabitLogStatus;
  created_at: string;
}

export interface HabitWithLogs extends Habit {
  logs: HabitLog[];
}

// Day of week mapping
export const DAY_MAP: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export const DAY_LABELS: Record<string, string> = {
  sun: 'Dom',
  mon: 'Seg',
  tue: 'Ter',
  wed: 'Qua',
  thu: 'Qui',
  fri: 'Sex',
  sat: 'Sáb',
};
