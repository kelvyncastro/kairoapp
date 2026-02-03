import { useState } from 'react';
import { addDays, subDays, addWeeks, subWeeks, addMonths, subMonths, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useCalendarBlocks } from '@/hooks/useCalendarBlocks';
import { useCalendarReorganize } from '@/hooks/useCalendarReorganize';
import { CalendarDayView } from '@/components/calendar-v2/CalendarDayView';
import { CalendarWeekView } from '@/components/calendar-v2/CalendarWeekView';
import { CalendarMonthView } from '@/components/calendar-v2/CalendarMonthView';
import { CalendarBlockModal } from '@/components/calendar-v2/CalendarBlockModal';
import { CalendarProductivityPanel } from '@/components/calendar-v2/CalendarProductivityPanel';
import { CalendarBlock } from '@/types/calendar-blocks';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  CalendarRange,
  Plus,
  RefreshCw,
  Sparkles,
  Loader2,
} from 'lucide-react';

type ViewMode = 'day' | 'week' | 'month';

export default function Calendar2() {
  const [view, setView] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<CalendarBlock | null>(null);
  const [defaultStartTime, setDefaultStartTime] = useState<Date | undefined>();
  const [defaultEndTime, setDefaultEndTime] = useState<Date | undefined>();

  const {
    blocks,
    loading,
    refetch,
    createBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    moveBlock,
    completeBlock,
  } = useCalendarBlocks({ view, currentDate });

  const { isReorganizing, reorganizeDay } = useCalendarReorganize();

  // Navigation
  const goToToday = () => setCurrentDate(new Date());
  
  const goToPrevious = () => {
    switch (view) {
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
    }
  };

  const goToNext = () => {
    switch (view) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
    }
  };

  // Handlers
  const handleBlockClick = (block: CalendarBlock) => {
    setSelectedBlock(block);
    setDefaultStartTime(undefined);
    setDefaultEndTime(undefined);
    setModalOpen(true);
  };

  const handleSlotSelect = (start: Date, end: Date) => {
    setSelectedBlock(null);
    setDefaultStartTime(start);
    setDefaultEndTime(end);
    setModalOpen(true);
  };

  const handleDayClick = (date: Date) => {
    setCurrentDate(date);
    setView('day');
  };

  const handleCreateNew = () => {
    setSelectedBlock(null);
    setDefaultStartTime(new Date());
    setDefaultEndTime(addDays(new Date(), 0));
    setModalOpen(true);
  };

  const handleSaveBlock = async (block: Parameters<typeof createBlock>[0]) => {
    if (selectedBlock) {
      return updateBlock(selectedBlock.id, block);
    }
    return createBlock(block);
  };

  const handleReorganize = async () => {
    await reorganizeDay(
      { date: currentDate, blocks },
      async (id, newStart, newEnd) => {
        return moveBlock(id, newStart, newEnd);
      }
    );
  };

  const getViewTitle = () => {
    switch (view) {
      case 'day':
        return format(currentDate, "d 'de' MMMM, yyyy", { locale: ptBR });
      case 'week':
        return format(currentDate, "'Semana de' d 'de' MMMM", { locale: ptBR });
      case 'month':
        return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    }
  };

  return (
    <div className="h-full flex flex-col -m-4 md:-m-6 bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-border/30 bg-background flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-3 text-sm" onClick={goToToday}>
              Hoje
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <span className="text-lg font-semibold capitalize hidden sm:block">{getViewTitle()}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* View toggle */}
          <div className="flex items-center border border-border/50 rounded-lg overflow-hidden">
            <Button
              variant={view === 'day' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3 rounded-none border-0"
              onClick={() => setView('day')}
            >
              <Calendar className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline text-xs">Dia</span>
            </Button>
            <Button
              variant={view === 'week' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3 rounded-none border-0 border-x border-border/30"
              onClick={() => setView('week')}
            >
              <CalendarDays className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline text-xs">Semana</span>
            </Button>
            <Button
              variant={view === 'month' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-3 rounded-none border-0"
              onClick={() => setView('month')}
            >
              <CalendarRange className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline text-xs">Mês</span>
            </Button>
          </div>

          {/* Reorganize button (day view only) */}
          {view === 'day' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReorganize}
              disabled={isReorganizing || loading}
              className="hidden md:flex h-8"
            >
              {isReorganizing ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1.5" />
              )}
              <span className="text-xs">Reorganizar</span>
            </Button>
          )}

          {/* Refresh */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>

          {/* Add new */}
          <Button size="sm" className="h-8" onClick={handleCreateNew}>
            <Plus className="h-4 w-4 md:mr-1.5" />
            <span className="hidden md:inline text-xs">Nova demanda</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main calendar view */}
        <div className="flex-1 overflow-hidden">
          {view === 'day' && (
            <CalendarDayView
              currentDate={currentDate}
              blocks={blocks}
              onBlockClick={handleBlockClick}
              onSlotSelect={handleSlotSelect}
              onBlockComplete={completeBlock}
              onBlockDelete={deleteBlock}
              onBlockDuplicate={duplicateBlock}
              onBlockMove={moveBlock}
            />
          )}
          {view === 'week' && (
            <CalendarWeekView
              currentDate={currentDate}
              blocks={blocks}
              onBlockClick={handleBlockClick}
              onDayClick={handleDayClick}
              onSlotSelect={handleSlotSelect}
            />
          )}
          {view === 'month' && (
            <CalendarMonthView
              currentDate={currentDate}
              blocks={blocks}
              onDayClick={handleDayClick}
              onBlockClick={handleBlockClick}
            />
          )}
        </div>

        {/* Sidebar (desktop only) */}
        {view === 'day' && (
          <div className="hidden lg:block w-80 border-l border-border/50 p-4 overflow-y-auto">
            <CalendarProductivityPanel
              currentDate={currentDate}
              blocks={blocks}
            />
          </div>
        )}
      </div>

      {/* Block Modal */}
      <CalendarBlockModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedBlock(null);
        }}
        block={selectedBlock}
        defaultStartTime={defaultStartTime}
        defaultEndTime={defaultEndTime}
        onSave={handleSaveBlock}
        onDelete={deleteBlock}
        onDuplicate={duplicateBlock}
        onComplete={completeBlock}
      />
    </div>
  );
}
