// Task Management Types - ClickUp-style

export interface TaskFolder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskStatus {
  id: string;
  user_id: string;
  name: string;
  color: string;
  order: number;
  is_default: boolean;
  created_at: string;
}

export interface TaskLabel {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface TaskSubtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface TaskChecklist {
  id: string;
  task_id: string;
  name: string;
  order_index: number;
  created_at: string;
  items?: TaskChecklistItem[];
}

export interface TaskChecklistItem {
  id: string;
  checklist_id: string;
  title: string;
  completed: boolean;
  order_index: number;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  date: string;
  completed: boolean;
  priority: number;
  is_recurring: boolean;
  recurring_rule: string | null;
  completed_at: string | null;
  folder_id: string | null;
  status_id: string | null;
  start_date: string | null;
  due_date: string | null;
  time_estimate_minutes: number | null;
  time_spent_seconds: number;
  timer_started_at: string | null;
  labels: string[];
  created_at: string;
  updated_at: string;
  // Computed fields for subtasks/checklists counts
  subtasks_count?: number;
  subtasks_completed?: number;
  checklists_count?: number;
  checklists_completed?: number;
}

export interface NewTask {
  title: string;
  description: string;
  priority: number;
  is_recurring: boolean;
  recurring_rule: string;
  folder_id: string | null;
  status_id: string | null;
  start_date: string | null;
  due_date: string | null;
  time_estimate_minutes: number | null;
  labels: string[];
}

export type ViewMode = 'list' | 'board';

export type SortField = 'title' | 'priority' | 'due_date' | 'created_at' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface TaskFilters {
  status_id: string | null;
  priority: number | null;
  folder_id: string | null;
  search: string;
  show_completed: boolean;
}

// Default statuses for ClickUp-style
export const DEFAULT_STATUSES = [
  { name: 'Não iniciada', color: '#6b7280', order: 0 },
  { name: 'Em progresso', color: '#f59e0b', order: 1 },
  { name: 'Empecilho/Não concluída', color: '#ef4444', order: 2 },
  { name: 'Concluída', color: '#22c55e', order: 3 },
];

// Icon options for folders
export const FOLDER_ICONS = [
  'folder', 'folder-open', 'briefcase', 'home', 'star', 'heart', 'zap',
  'target', 'flag', 'bookmark', 'tag', 'gift', 'trophy', 'crown',
  'rocket', 'lightbulb', 'compass', 'map', 'globe', 'building',
  'user', 'users', 'code', 'terminal', 'laptop', 'smartphone',
  'camera', 'music', 'book', 'graduation-cap', 'dumbbell', 'utensils',
  'plane', 'car', 'bike', 'ship', 'mountain', 'sun', 'moon', 'cloud',
  'umbrella', 'flame', 'droplet', 'leaf', 'flower', 'tree', 'apple',
  'coffee', 'pizza', 'cake', 'wine', 'beer', 'shopping-bag', 'credit-card',
  'wallet', 'piggy-bank', 'chart-bar', 'chart-line', 'calendar', 'clock',
  'alarm-clock', 'timer', 'hourglass', 'bell', 'mail', 'message-circle',
  'phone', 'video', 'mic', 'headphones', 'speaker', 'radio', 'tv',
  'gamepad', 'puzzle', 'dice', 'palette', 'brush', 'pen', 'pencil',
  'scissors', 'ruler', 'wrench', 'hammer', 'key', 'lock', 'shield',
  'award', 'medal', 'gem', 'diamond', 'coins', 'banknote', 'receipt',
] as const;

// Color palette for folders and statuses
export const COLOR_PALETTE: string[] = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
  '#6b7280', // Gray
];
