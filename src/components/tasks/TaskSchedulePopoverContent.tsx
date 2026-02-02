import { X } from "lucide-react";
import { ptBR } from "date-fns/locale";

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
  onChange: (updates: TaskScheduleUpdates) => void;
  onAfterSelectDate?: () => void;
}

export function TaskSchedulePopoverContent({
  startDate,
  dueDate,
  isRecurring,
  recurringRule,
  onChange,
  onAfterSelectDate,
}: TaskSchedulePopoverContentProps) {
  const selectedStart = startDate ? parseDateString(startDate) : undefined;
  const selectedDue = dueDate ? parseDateString(dueDate) : undefined;

  const currentRule = recurringRule || "DAILY";

  const setBothDates = (date: Date | undefined) => {
    const v = date ? formatDateString(date) : null;
    onChange({ start_date: v, due_date: v });
    onAfterSelectDate?.();
  };

  return (
    <div className="p-3 space-y-4">
      <div className="flex gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Data de início</Label>
          <Calendar
            mode="single"
            selected={selectedStart}
            onSelect={(date) => setBothDates(date)}
            locale={ptBR}
            className="pointer-events-auto"
          />
          {startDate && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                onChange({ start_date: null });
                onAfterSelectDate?.();
              }}
            >
              <X className="h-3 w-3 mr-1" /> Limpar início
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Data de vencimento</Label>
          <Calendar
            mode="single"
            selected={selectedDue}
            onSelect={(date) => setBothDates(date)}
            locale={ptBR}
            className="pointer-events-auto"
          />
          {dueDate && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                onChange({ due_date: null });
                onAfterSelectDate?.();
              }}
            >
              <X className="h-3 w-3 mr-1" /> Limpar vencimento
            </Button>
          )}
        </div>
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
          <Select value={currentRule} onValueChange={(v) => onChange({ recurring_rule: v })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione a recorrência" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              {RECURRENCE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
