import { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, setHours, setMinutes, addMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CalendarBlock,
  CalendarDemandType,
  CalendarPriority,
  CalendarRecurrenceType,
  RecurrenceRule,
  DEMAND_TYPE_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '@/types/calendar-blocks';
import {
  CalendarIcon,
  Clock,
  Repeat,
  Trash2,
  Copy,
  Check,
  X,
  Zap,
  Target,
  Timer,
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

const COLORS = [
  { value: '#3b82f6', name: 'Azul' },
  { value: '#6366f1', name: 'Índigo' },
  { value: '#8b5cf6', name: 'Violeta' },
  { value: '#a855f7', name: 'Roxo' },
  { value: '#ec4899', name: 'Rosa' },
  { value: '#ef4444', name: 'Vermelho' },
  { value: '#f97316', name: 'Laranja' },
  { value: '#eab308', name: 'Amarelo' },
  { value: '#22c55e', name: 'Verde' },
  { value: '#14b8a6', name: 'Teal' },
  { value: '#06b6d4', name: 'Ciano' },
  { value: '#64748b', name: 'Cinza' },
];

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

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

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [demandType, setDemandType] = useState<CalendarDemandType>('fixed');
  const [priority, setPriority] = useState<CalendarPriority>('medium');
  const [color, setColor] = useState(COLORS[0]);
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
      setColor(block.color || COLORS[0]);
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
    } else {
      // New block defaults
      setTitle('');
      setDescription('');
      setStartTime(defaultStartTime || new Date());
      setEndTime(defaultEndTime || addMinutes(defaultStartTime || new Date(), 60));
      setDemandType('fixed');
      setPriority('medium');
      setColor(COLORS[0]);
      setRecurrenceType('none');
      setRecurrenceRule(null);
      setRecurrenceEndDate(undefined);
      setSelectedDays([]);
      setRecurrenceInterval(1);
    }
  }, [block, defaultStartTime, defaultEndTime, open]);

  const handleSave = async () => {
    if (!title.trim()) return;

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
        color,
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
  };

  const handleDelete = async () => {
    if (!block || !onDelete) return;
    const hasRecurrence = Boolean(block.recurrence_parent_id) || block.recurrence_type !== 'none';
    await onDelete(block.id, hasRecurrence);
    onClose();
  };

  const handleDuplicate = async () => {
    if (!block || !onDuplicate) return;
    await onDuplicate(block);
    onClose();
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
      // Auto-adjust end time if needed
      if (newStart >= endTime) {
        setEndTime(addMinutes(newStart, 30));
      }
    } else {
      setEndTime(setMinutes(setHours(endTime, hours), minutes));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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

          {/* Demand Type & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de demanda</Label>
              <Select value={demandType} onValueChange={(v) => setDemandType(v as CalendarDemandType)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">
                    <span className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      {DEMAND_TYPE_LABELS.fixed}
                    </span>
                  </SelectItem>
                  <SelectItem value="flexible">
                    <span className="flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      {DEMAND_TYPE_LABELS.flexible}
                    </span>
                  </SelectItem>
                  <SelectItem value="micro">
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      {DEMAND_TYPE_LABELS.micro}
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as CalendarPriority)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PRIORITY_LABELS) as CalendarPriority[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      <span className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: PRIORITY_COLORS[p] }}
                        />
                        {PRIORITY_LABELS[p]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Color */}
          <div>
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-transform",
                    color === c ? "scale-110 border-foreground" : "border-transparent hover:scale-105"
                  )}
                  style={{ backgroundColor: c }}
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
            <div className="flex gap-2 mr-auto">
              {onComplete && block?.status !== 'completed' && (
                <Button variant="outline" size="sm" onClick={handleComplete}>
                  <Check className="h-4 w-4 mr-1" />
                  Concluir
                </Button>
              )}
              {onDuplicate && (
                <Button variant="outline" size="sm" onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicar
                </Button>
              )}
              {onDelete && (
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              )}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!title.trim() || saving}>
              {saving ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
