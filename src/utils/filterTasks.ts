import { Task } from '@/types/tasks';
import { FilterCondition, DatePreset } from '@/components/tasks/TaskFiltersAdvanced';
import { 
  isToday, 
  isYesterday, 
  isTomorrow, 
  addDays, 
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  subMonths,
  parseISO,
  isBefore,
  isAfter,
  isWithinInterval,
} from 'date-fns';

function getDateRange(preset: DatePreset): { start: Date | null; end: Date | null } | 'no_date' | 'overdue' {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (preset) {
    case 'today':
      return { start: today, end: today };
    case 'yesterday':
      const yesterday = subDays(today, 1);
      return { start: yesterday, end: yesterday };
    case 'tomorrow':
      const tomorrow = addDays(today, 1);
      return { start: tomorrow, end: tomorrow };
    case 'next_7_days':
      return { start: today, end: addDays(today, 7) };
    case 'last_7_days':
      return { start: subDays(today, 7), end: today };
    case 'this_week':
      return { start: startOfWeek(today, { weekStartsOn: 1 }), end: endOfWeek(today, { weekStartsOn: 1 }) };
    case 'next_week':
      const nextWeekStart = addDays(startOfWeek(today, { weekStartsOn: 1 }), 7);
      return { start: nextWeekStart, end: addDays(nextWeekStart, 6) };
    case 'last_month':
      const lastMonth = subMonths(today, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    case 'this_month':
      return { start: startOfMonth(today), end: endOfMonth(today) };
    case 'next_month':
      const nextMonth = addMonths(today, 1);
      return { start: startOfMonth(nextMonth), end: endOfMonth(nextMonth) };
    case 'overdue':
      return 'overdue';
    case 'no_date':
      return 'no_date';
    default:
      return { start: null, end: null };
  }
}

function matchesDateFilter(
  dateStr: string | null,
  operator: string,
  preset: DatePreset
): boolean {
  const range = getDateRange(preset);

  // Handle special cases
  if (range === 'no_date') {
    return !dateStr;
  }
  
  if (range === 'overdue') {
    if (!dateStr) return false;
    const date = parseISO(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(date, today);
  }

  if (!dateStr) return false;

  const date = parseISO(dateStr);
  date.setHours(0, 0, 0, 0);

  const { start, end } = range;

  switch (operator) {
    case 'is':
      if (start && end) {
        return isWithinInterval(date, { start, end });
      }
      return false;
    case 'is_before':
      if (start) {
        return isBefore(date, start);
      }
      return false;
    case 'is_after':
      if (end) {
        return isAfter(date, end);
      }
      return false;
    default:
      return true;
  }
}

function matchesTextFilter(
  value: string | null | undefined,
  operator: string,
  filterValue: string
): boolean {
  const normalizedValue = (value || '').toLowerCase();
  const normalizedFilter = filterValue.toLowerCase();

  switch (operator) {
    case 'contains':
      return normalizedValue.includes(normalizedFilter);
    case 'not_contains':
      return !normalizedValue.includes(normalizedFilter);
    case 'is':
      return normalizedValue === normalizedFilter;
    case 'is_empty':
      return !value || value.trim() === '';
    case 'is_not_empty':
      return !!value && value.trim() !== '';
    default:
      return true;
  }
}

function matchesSelectFilter(
  value: string | null | undefined,
  operator: string,
  filterValue: string
): boolean {
  switch (operator) {
    case 'is':
      return value === filterValue;
    case 'is_not':
      return value !== filterValue;
    default:
      return true;
  }
}

export function applyFilters(tasks: Task[], filters: FilterCondition[]): Task[] {
  if (filters.length === 0) return tasks;

  return tasks.filter(task => {
    return filters.every(filter => {
      switch (filter.field) {
        case 'title':
          return matchesTextFilter(task.title, filter.operator, filter.value as string);
        
        case 'start_date':
          return matchesDateFilter(
            task.start_date,
            filter.operator,
            filter.value as DatePreset
          );
        
        case 'due_date':
          return matchesDateFilter(
            task.due_date || task.date,
            filter.operator,
            filter.value as DatePreset
          );
        
        case 'status':
          return matchesSelectFilter(task.status_id, filter.operator, filter.value as string);
        
        case 'priority':
          return matchesSelectFilter(
            String(task.priority),
            filter.operator,
            filter.value as string
          );
        
        default:
          return true;
      }
    });
  });
}
