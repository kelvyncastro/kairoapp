import { useMemo, useState } from "react";
import { X, CalendarClock } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { addDays, addWeeks, addMonths, getDay, startOfMonth, endOfMonth } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Parse YYYY-MM-DD string to Date using local timezone (avoids UTC shift)
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Format Date to YYYY-MM-DD string using local components
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const RECURRENCE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "DAILY", label: "Todo dia" },
  { value: "WEEKDAYS", label: "Dias úteis (Seg-Sex)" },
  { value: "WEEKENDS", label: "Fins de semana (Sáb-Dom)" },
  { value: "WEEKLY_MONDAY", label: "Toda segunda-feira" },
  { value: "WEEKLY_TUESDAY", label: "Toda terça-feira" },
  { value: "WEEKLY_WEDNESDAY", label: "Toda quarta-feira" },
  { value: "WEEKLY_THURSDAY", label: "Toda quinta-feira" },
  { value: "WEEKLY_FRIDAY", label: "Toda sexta-feira" },
  { value: "WEEKLY_SATURDAY", label: "Todo sábado" },
  { value: "WEEKLY_SUNDAY", label: "Todo domingo" },
  { value: "BIWEEKLY", label: "A cada 2 semanas" },
  { value: "MONTHLY", label: "Todo mês" },
];

// Map recurrence rule to day of week (0 = Sunday, 1 = Monday, etc.)
const WEEKLY_DAY_MAP: Record<string, number> = {
  WEEKLY_SUNDAY: 0,
  WEEKLY_MONDAY: 1,
  WEEKLY_TUESDAY: 2,
  WEEKLY_WEDNESDAY: 3,
  WEEKLY_THURSDAY: 4,
  WEEKLY_FRIDAY: 5,
  WEEKLY_SATURDAY: 6,
};

export interface TaskScheduleUpdates {
  start_date?: string | null;
  due_date?: string | null;
  is_recurring?: boolean;
  recurring_rule?: string | null;
}

interface TaskSchedulePopoverContentProps {
  startDate: string | null;
  dueDate: string | null;
  isRecurring: boolean;
  recurringRule: string | null;
  /**
   * Which calendar(s) should be shown.
   * - start: only start date calendar + recurrence
   * - due: only due date calendar + recurrence
   * - both: show both calendars (default)
   */
  calendarMode?: "start" | "due" | "both";
  onChange: (updates: TaskScheduleUpdates) => void;
  onAfterSelectDate?: () => void;
}

// Generate dates matching recurrence pattern for calendar highlighting
function getRecurrenceDates(
  baseDate: Date | undefined,
  rule: string,
  displayMonth: Date
): Date[] {
  if (!baseDate) return [];
  
  const dates: Date[] = [];
  const monthStart = startOfMonth(displayMonth);
  const monthEnd = endOfMonth(displayMonth);
  
  // Generate dates within the visible month range
  let current = new Date(monthStart);
  
  while (current <= monthEnd) {
    let matches = false;
    
    switch (rule) {
      case "DAILY":
        matches = current >= baseDate;
        break;
      case "WEEKDAYS":
        const dayOfWeek = getDay(current);
        matches = current >= baseDate && dayOfWeek >= 1 && dayOfWeek <= 5;
        break;
      case "WEEKENDS":
        const dow = getDay(current);
        matches = current >= baseDate && (dow === 0 || dow === 6);
        break;
      case "WEEKLY_SUNDAY":
      case "WEEKLY_MONDAY":
      case "WEEKLY_TUESDAY":
      case "WEEKLY_WEDNESDAY":
      case "WEEKLY_THURSDAY":
      case "WEEKLY_FRIDAY":
      case "WEEKLY_SATURDAY":
        const targetDay = WEEKLY_DAY_MAP[rule];
        matches = current >= baseDate && getDay(current) === targetDay;
        break;
      case "BIWEEKLY":
        if (current >= baseDate) {
          const diffTime = current.getTime() - baseDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          const diffWeeks = Math.floor(diffDays / 7);
          matches = diffWeeks % 2 === 0 && getDay(current) === getDay(baseDate);
        }
        break;
      case "MONTHLY":
        matches = current >= baseDate && current.getDate() === baseDate.getDate();
        break;
    }
    
    if (matches && current.getTime() !== baseDate.getTime()) {
      dates.push(new Date(current));
    }
    
    current = addDays(current, 1);
  }
  
  return dates;
}

export function TaskSchedulePopoverContent({
  startDate,
  dueDate,
  isRecurring,
  recurringRule,
  calendarMode = "both",
  onChange,
  onAfterSelectDate,
}: TaskSchedulePopoverContentProps) {
  const selectedStart = startDate ? parseDateString(startDate) : undefined;
  const selectedDue = dueDate ? parseDateString(dueDate) : undefined;

  const [showDueDate, setShowDueDate] = useState(!!dueDate);

  const currentRule = recurringRule || "DAILY";

  const showStart = calendarMode === "both" || calendarMode === "start";
  const showDue = calendarMode === "due";

  // Base date to compute recurrence highlights (prefer start, fallback to due)
  const baseRecurrenceDate = selectedStart || selectedDue;

  // Track visible month for calculating recurrence highlights
  const displayMonth =
    (calendarMode === "start" ? selectedStart : calendarMode === "due" ? selectedDue : undefined) ||
    selectedStart ||
    selectedDue ||
    new Date();
  
  // Calculate recurrence dates for highlighting
  const recurrenceDates = useMemo(() => {
    if (!isRecurring || !baseRecurrenceDate) return [];
    return getRecurrenceDates(baseRecurrenceDate, currentRule, displayMonth);
  }, [isRecurring, baseRecurrenceDate, currentRule, displayMonth]);

  const setStartDate = (date: Date | undefined) => {
    const v = date ? formatDateString(date) : null;
    onChange({ start_date: v });
  };

  const setDueDate = (date: Date | undefined) => {
    const v = date ? formatDateString(date) : null;
    onChange({ due_date: v });
  };

  // Custom modifiers for highlighting recurrence days
  const modifiers = isRecurring ? { recurrence: recurrenceDates } : {};
  const modifiersStyles = {
    recurrence: {
      backgroundColor: "hsl(var(--muted))",
      color: "hsl(var(--muted-foreground))",
      borderRadius: "var(--radius)",
    },
  };

  return (
    <div className="p-3 space-y-4">
      <div className="space-y-4">
        {/* Start date - always visible in "both" mode */}
        {showStart && (
          <section className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-medium">Data de início</Label>
              {startDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    onChange({ start_date: null });
                    onAfterSelectDate?.();
                  }}
                >
                  <X className="h-3 w-3 mr-1" /> Limpar
                </Button>
              )}
            </div>
            <Calendar
              mode="single"
              selected={selectedStart}
              onSelect={setStartDate}
              locale={ptBR}
              className="pointer-events-auto"
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
            />
          </section>
        )}

        {/* Due date - toggleable in "both" mode, always visible in "due" mode */}
        {showDue && (
          <section className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-medium">Data de vencimento</Label>
              {dueDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    onChange({ due_date: null });
                    onAfterSelectDate?.();
                  }}
                >
                  <X className="h-3 w-3 mr-1" /> Limpar
                </Button>
              )}
            </div>
            <Calendar
              mode="single"
              selected={selectedDue}
              onSelect={setDueDate}
              locale={ptBR}
              className="pointer-events-auto"
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
            />
          </section>
        )}

        {/* Due date toggle - switch style like recurrence, only in "both" mode */}
        {calendarMode === "both" && !showDue && (
          <div className="border-t pt-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm">📅 Definir vencimento</Label>
              <Switch
                checked={showDueDate}
                onCheckedChange={(v) => {
                  setShowDueDate(v);
                  if (!v) {
                    onChange({ due_date: null });
                  }
                }}
              />
            </div>

            {showDueDate && (
              <section className="rounded-lg border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-xs font-medium">Data de vencimento</Label>
                  {dueDate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        onChange({ due_date: null });
                        onAfterSelectDate?.();
                      }}
                    >
                      <X className="h-3 w-3 mr-1" /> Limpar
                    </Button>
                  )}
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDue}
                  onSelect={setDueDate}
                  locale={ptBR}
                  className="pointer-events-auto"
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                />
              </section>
            )}
          </div>
        )}
      </div>

      <div className="border-t pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm">🔄 Tarefa recorrente</Label>
          <Switch
            checked={isRecurring}
            onCheckedChange={(v) => {
              if (!v) {
                onChange({ is_recurring: false, recurring_rule: null });
                return;
              }
              onChange({ is_recurring: true, recurring_rule: currentRule });
            }}
          />
        </div>

        {isRecurring && (
          <>
            <Select value={currentRule} onValueChange={(v) => onChange({ recurring_rule: v })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione a recorrência" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-[200] max-h-[300px]" position="popper" sideOffset={4}>
                {RECURRENCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {recurrenceDates.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Dias destacados mostram as próximas ocorrências
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
