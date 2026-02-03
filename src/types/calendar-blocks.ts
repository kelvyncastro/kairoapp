export type CalendarDemandType = 'fixed' | 'flexible' | 'micro';
export type CalendarBlockStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';
export type CalendarPriority = 'low' | 'medium' | 'high' | 'urgent';
export type CalendarRecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface CalendarBlock {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  duration_minutes?: number;
  demand_type: CalendarDemandType;
  priority: CalendarPriority;
  status: CalendarBlockStatus;
  color?: string | null;
  recurrence_type: CalendarRecurrenceType;
  recurrence_rule?: RecurrenceRule | null;
  recurrence_end_date?: string | null;
  recurrence_parent_id?: string | null;
  is_recurrence_paused?: boolean;
  actual_start_time?: string | null;
  actual_end_time?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number; // Every X days/weeks/months
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  count?: number; // Number of occurrences
  until?: string; // End date
}

export interface CalendarDailyStats {
  id: string;
  user_id: string;
  date: string;
  planned_blocks: number;
  completed_blocks: number;
  cancelled_blocks: number;
  postponed_blocks: number;
  planned_time_minutes: number;
  actual_time_minutes: number;
  execution_score: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarViewState {
  view: 'day' | 'week' | 'month';
  currentDate: Date;
}

export interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
  period: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface DragState {
  isDragging: boolean;
  startSlot?: { hour: number; minute: number };
  endSlot?: { hour: number; minute: number };
  blockId?: string;
  type: 'create' | 'move' | 'resize-top' | 'resize-bottom' | null;
}

// Priority colors
export const PRIORITY_COLORS: Record<CalendarPriority, string> = {
  low: '#22c55e',
  medium: '#3b82f6',
  high: '#f97316',
  urgent: '#ef4444',
};

// Demand type labels
export const DEMAND_TYPE_LABELS: Record<CalendarDemandType, string> = {
  fixed: 'Fixa',
  flexible: 'Flexível',
  micro: 'Micro',
};

// Status labels
export const STATUS_LABELS: Record<CalendarBlockStatus, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  postponed: 'Adiada',
};

// Priority labels
export const PRIORITY_LABELS: Record<CalendarPriority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};
