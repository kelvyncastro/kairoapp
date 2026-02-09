import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, setHours, setMinutes, addMinutes, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarBlock,
  CalendarDemandType,
  CalendarPriority,
  CalendarRecurrenceType,
  RecurrenceRule,
} from '@/types/calendar-blocks';
import {
  CalendarIcon,
  Clock,
  Repeat,
  Trash2,
  Check,
  X,
  Pencil,
  FileText,
} from 'lucide-react';


interface CalendarBlockModalProps {
  open: boolean;
  onClose: () => void;
  block?: CalendarBlock | null;
  defaultStartTime?: Date;
  defaultEndTime?: Date;
  onSave: (block: Omit<CalendarBlock, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'duration_minutes'>) => Promise<any>;
  onDelete?: (id: string, deleteRecurring?: boolean) => Promise<boolean>;
  onDuplicate?: (block: CalendarBlock) => Promise<any>;
  onComplete?: (id: string) => Promise<boolean>;
}


const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const RECURRENCE_LABELS: Record<CalendarRecurrenceType, string> = {
  none: 'Não repete',
  daily: 'Diariamente',
  weekly: 'Semanalmente',
  monthly: 'Mensalmente',
  custom: 'Personalizado',
};


export function CalendarBlockModal({
  open,
  onClose,
  block,
  defaultStartTime,
  defaultEndTime,
  onSave,
  onDelete,
  onDuplicate,
  onComplete,
}: CalendarBlockModalProps) {
  const isEditing = !!block;
  const [isViewMode, setIsViewMode] = useState(true);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [demandType, setDemandType] = useState<CalendarDemandType>('fixed');
  const [priority, setPriority] = useState<CalendarPriority>('medium');
  const [recurrenceType, setRecurrenceType] = useState<CalendarRecurrenceType>('none');
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>(null);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>();
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [saving, setSaving] = useState(false);

  // Initialize form
  useEffect(() => {
    if (block) {
      setTitle(block.title);
      setDescription(block.description || '');
      setStartTime(new Date(block.start_time));
      setEndTime(new Date(block.end_time));
      setDemandType(block.demand_type);
      setPriority(block.priority);
      setRecurrenceType(block.recurrence_type);
      setRecurrenceRule(block.recurrence_rule || null);
      if (block.recurrence_end_date) {
        setRecurrenceEndDate(new Date(block.recurrence_end_date));
      }
      if (block.recurrence_rule?.daysOfWeek) {
        setSelectedDays(block.recurrence_rule.daysOfWeek);
      }
      if (block.recurrence_rule?.interval) {
        setRecurrenceInterval(block.recurrence_rule.interval);
      }
      // Start in view mode when editing existing block
      setIsViewMode(true);
    } else {
      // New block defaults - go straight to edit mode
      setTitle('');
      setDescription('');
      setStartTime(defaultStartTime || new Date());
      setEndTime(defaultEndTime || addMinutes(defaultStartTime || new Date(), 60));
      setDemandType('fixed');
      setPriority('medium');
      setRecurrenceType('none');
      setRecurrenceRule(null);
      setRecurrenceEndDate(undefined);
      setSelectedDays([]);
      setRecurrenceInterval(1);
      setIsViewMode(false);
    }
  }, [block, defaultStartTime, defaultEndTime, open]);

  const handleSave = useCallback(async () => {
    if (!title.trim() || saving) return;

    setSaving(true);
    try {
      // Build recurrence rule if needed
      let finalRecurrenceRule: RecurrenceRule | null = null;
      if (recurrenceType !== 'none') {
        finalRecurrenceRule = {
          frequency: recurrenceType === 'custom' ? 'weekly' : recurrenceType as 'daily' | 'weekly' | 'monthly',
          interval: recurrenceInterval,
          daysOfWeek: selectedDays.length > 0 ? selectedDays : undefined,
          until: recurrenceEndDate?.toISOString(),
        };
      }

      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        demand_type: demandType,
        priority,
        status: block?.status || 'pending',
        color: null,
        recurrence_type: recurrenceType,
        recurrence_rule: finalRecurrenceRule,
        recurrence_end_date: recurrenceEndDate?.toISOString().split('T')[0] || null,
        recurrence_parent_id: block?.recurrence_parent_id || null,
        is_recurrence_paused: block?.is_recurrence_paused ?? false,
        actual_start_time: block?.actual_start_time || null,
        actual_end_time: block?.actual_end_time || null,
        completed_at: block?.completed_at || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }, [title, saving, recurrenceType, recurrenceInterval, selectedDays, recurrenceEndDate, onSave, startTime, endTime, demandType, priority, block, onClose, description]);

  // Handle Enter key to save (only in edit mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && open && !isViewMode) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'TEXTAREA') return;
        
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleSave, isViewMode]);

  const handleDelete = async () => {
    if (!block || !onDelete) return;
    const hasRecurrence = Boolean(block.recurrence_parent_id) || block.recurrence_type !== 'none';
    const success = await onDelete(block.id, hasRecurrence);
    if (success) {
      onClose();
    }
  };

  const handleComplete = async () => {
    if (!block || !onComplete) return;
    await onComplete(block.id);
    onClose();
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const formatTime = (date: Date) => format(date, 'HH:mm');

  const handleTimeChange = (type: 'start' | 'end', timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (type === 'start') {
      const newStart = setMinutes(setHours(startTime, hours), minutes);
      setStartTime(newStart);
      if (newStart >= endTime) {
        setEndTime(addMinutes(newStart, 30));
      }
    } else {
      setEndTime(setMinutes(setHours(endTime, hours), minutes));
    }
  };

  const getDuration = () => {
    const minutes = differenceInMinutes(endTime, startTime);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    }
    return `${mins}min`;
  };

  const getRecurrenceDescription = () => {
    if (recurrenceType === 'none') return null;
    
    let desc = RECURRENCE_LABELS[recurrenceType];
    if (recurrenceInterval > 1) {
      if (recurrenceType === 'daily') desc = `A cada ${recurrenceInterval} dias`;
      if (recurrenceType === 'weekly') desc = `A cada ${recurrenceInterval} semanas`;
      if (recurrenceType === 'monthly') desc = `A cada ${recurrenceInterval} meses`;
    }
    if (selectedDays.length > 0 && (recurrenceType === 'weekly' || recurrenceType === 'custom')) {
      const dayNames = selectedDays.map(d => DAY_LABELS[d]).join(', ');
      desc += ` (${dayNames})`;
    }
    return desc;
  };

  // VIEW MODE
  if (isViewMode && isEditing && block) {
    const colorInfo = COLORS.find(c => c.value === color) || COLORS[0];
    const statusInfo = STATUS_LABELS[block.status] || STATUS_LABELS.pending;
    const recurrenceDesc = getRecurrenceDescription();

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-md w-[95vw]">
          <DialogHeader className="pb-2">
            <div className="flex items-start gap-3">
              <div 
                className="w-4 h-full min-h-[40px] rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-bold leading-tight">
                  {title}
                </DialogTitle>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Date and Time */}
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 rounded-lg bg-muted">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">
                  {format(startTime, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </p>
                <p className="text-muted-foreground">
                  {formatTime(startTime)} - {formatTime(endTime)} ({getDuration()})
                </p>
              </div>
            </div>

            {/* Recurrence */}
            {recurrenceDesc && (
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 rounded-lg bg-muted">
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Recorrência</p>
                  <p className="text-muted-foreground">{recurrenceDesc}</p>
                </div>
              </div>
            )}

            {/* Color */}
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 rounded-lg bg-muted">
                <Palette className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-muted-foreground">{colorInfo.name}</span>
              </div>
            </div>

            {/* Description */}
            {description && (
              <div className="flex items-start gap-3 text-sm">
                <div className="p-2 rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium mb-1">Observações</p>
                  <p className="text-muted-foreground whitespace-pre-wrap">{description}</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-row gap-2 pt-4 border-t justify-end">
            <div className="flex gap-2">
              {onDelete && (
                <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1.5">
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              )}
              <Button size="sm" onClick={() => setIsViewMode(false)} className="gap-1.5">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // EDIT MODE
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[85vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? 'Editar Demanda' : 'Nova Demanda'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Nome da demanda *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Treino, Estudar, Relatório..."
              className="mt-1.5"
              autoFocus
            />
          </div>

          {/* Time selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Início</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(startTime, 'dd/MM', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startTime}
                      onSelect={(date) => date && setStartTime(setHours(setMinutes(date, startTime.getMinutes()), startTime.getHours()))}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={formatTime(startTime)}
                  onChange={(e) => handleTimeChange('start', e.target.value)}
                  className="w-24"
                />
              </div>
            </div>
            <div>
              <Label>Término</Label>
              <div className="flex items-center gap-2 mt-1.5">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {format(endTime, 'dd/MM', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endTime}
                      onSelect={(date) => date && setEndTime(setHours(setMinutes(date, endTime.getMinutes()), endTime.getHours()))}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={formatTime(endTime)}
                  onChange={(e) => handleTimeChange('end', e.target.value)}
                  className="w-24"
                />
              </div>
            </div>
          </div>

          {/* Color */}
          <div>
            <Label className="mb-2 block">Cor do bloco</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all duration-200",
                    "hover:scale-110 focus:outline-none",
                    color === c.value 
                      ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110" 
                      : "hover:ring-2 hover:ring-muted-foreground/30"
                  )}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Observações (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Anotações sobre esta demanda..."
              className="mt-1.5 min-h-[80px]"
            />
          </div>

          {/* Recurrence */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <Label className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Recorrência
              </Label>
              <Select value={recurrenceType} onValueChange={(v) => setRecurrenceType(v as CalendarRecurrenceType)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não repete</SelectItem>
                  <SelectItem value="daily">Diariamente</SelectItem>
                  <SelectItem value="weekly">Semanalmente</SelectItem>
                  <SelectItem value="monthly">Mensalmente</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recurrenceType !== 'none' && (
              <div className="space-y-3 pl-6 border-l-2 border-muted">
                {/* Interval */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">A cada</span>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                    className="w-16"
                  />
                  <span className="text-sm text-muted-foreground">
                    {recurrenceType === 'daily' && 'dia(s)'}
                    {recurrenceType === 'weekly' && 'semana(s)'}
                    {recurrenceType === 'monthly' && 'mês(es)'}
                    {recurrenceType === 'custom' && 'semana(s)'}
                  </span>
                </div>

                {/* Days of week (for weekly/custom) */}
                {(recurrenceType === 'weekly' || recurrenceType === 'custom') && (
                  <div>
                    <span className="text-sm text-muted-foreground mb-2 block">Dias da semana:</span>
                    <div className="flex gap-1">
                      {DAY_LABELS.map((label, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleDay(i)}
                          className={cn(
                            "w-9 h-9 rounded-full text-xs font-medium transition-colors",
                            selectedDays.includes(i)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* End date */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Até:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {recurrenceEndDate 
                          ? format(recurrenceEndDate, 'dd/MM/yyyy', { locale: ptBR })
                          : 'Sem data limite'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={recurrenceEndDate}
                        onSelect={setRecurrenceEndDate}
                        locale={ptBR}
                        disabled={(date) => date < startTime}
                      />
                    </PopoverContent>
                  </Popover>
                  {recurrenceEndDate && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setRecurrenceEndDate(undefined)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEditing && (
            <Button 
              variant="ghost" 
              onClick={() => setIsViewMode(true)}
              className="mr-auto"
            >
              Cancelar
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar bloco'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
