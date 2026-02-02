import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MonthSelectorProps {
  selectedDate: Date | null;
  onDateChange: (date: Date | null) => void;
}

const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export function MonthSelector({ selectedDate, onDateChange }: MonthSelectorProps) {
  const [viewYear, setViewYear] = useState(selectedDate?.getFullYear() ?? new Date().getFullYear());
  const [open, setOpen] = useState(false);

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(viewYear, monthIndex, 1);
    onDateChange(newDate);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDateChange(null);
    setOpen(false);
  };

  const handlePrevYear = () => setViewYear(y => y - 1);
  const handleNextYear = () => setViewYear(y => y + 1);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={selectedDate ? 'secondary' : 'outline'}
          size="sm"
          className={cn(
            "h-7 gap-1.5 text-xs shrink-0",
            selectedDate && "border-primary/50"
          )}
        >
          <Calendar className="h-3.5 w-3.5" />
          {selectedDate ? (
            <>
              <span className="capitalize">
                {format(selectedDate, 'MMM yyyy', { locale: ptBR })}
              </span>
              <X 
                className="h-3 w-3 ml-1 hover:text-destructive" 
                onClick={handleClear}
              />
            </>
          ) : (
            <span>Mês</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        {/* Year navigation */}
        <div className="flex items-center justify-between mb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handlePrevYear}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-sm">{viewYear}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleNextYear}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-4 gap-1.5">
          {MONTHS.map((month, index) => {
            const isSelected = selectedDate && 
              selectedDate.getMonth() === index && 
              selectedDate.getFullYear() === viewYear;
            const isCurrent = index === currentMonth && viewYear === currentYear;

            return (
              <Button
                key={month}
                variant={isSelected ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "h-8 text-xs",
                  isCurrent && !isSelected && "border border-primary/50",
                  isSelected && "bg-primary text-primary-foreground"
                )}
                onClick={() => handleMonthSelect(index)}
              >
                {month}
              </Button>
            );
          })}
        </div>

        {/* Quick actions */}
        <div className="flex gap-1.5 mt-3 pt-3 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={() => {
              onDateChange(null);
              setOpen(false);
            }}
          >
            Todos
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 h-7 text-xs"
            onClick={() => {
              const now = new Date();
              setViewYear(now.getFullYear());
              handleMonthSelect(now.getMonth());
            }}
          >
            Mês atual
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
