import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Flag, FolderIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Task, TaskFolder, TaskStatus, NewTask } from '@/types/tasks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FolderIconRenderer } from './FolderIconRenderer';
import { TaskSchedulePopoverContent } from '@/components/tasks/TaskSchedulePopoverContent';

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  folders: TaskFolder[];
  statuses: TaskStatus[];
  onSave: (task: Partial<Task>) => void;
  defaultFolderId?: string | null;
}

const getRecurrenceLabel = (rule: string): string => {
  const labels: Record<string, string> = {
    DAILY: 'Todo dia',
    WEEKDAYS: 'Dias úteis',
    WEEKENDS: 'Fins de semana',
    WEEKLY_MONDAY: 'Segundas',
    WEEKLY_TUESDAY: 'Terças',
    WEEKLY_WEDNESDAY: 'Quartas',
    WEEKLY_THURSDAY: 'Quintas',
    WEEKLY_FRIDAY: 'Sextas',
    WEEKLY_SATURDAY: 'Sábados',
    WEEKLY_SUNDAY: 'Domingos',
    BIWEEKLY: 'A cada 2 semanas',
    MONTHLY: 'Mensal',
  };
  return labels[rule] || rule;
};

export function TaskDialog({
  open,
  onOpenChange,
  task,
  folders,
  statuses,
  onSave,
  defaultFolderId,
}: TaskDialogProps) {
  const [formData, setFormData] = useState<NewTask>({
    title: '',
    description: '',
    priority: 1,
    is_recurring: false,
    recurring_rule: 'DAILY',
    folder_id: null,
    status_id: null,
    start_date: null,
    due_date: null,
    time_estimate_minutes: null,
    labels: [],
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        is_recurring: task.is_recurring,
        recurring_rule: task.recurring_rule || 'DAILY',
        folder_id: task.folder_id,
        status_id: task.status_id,
        start_date: task.start_date,
        due_date: task.due_date || task.date,
        time_estimate_minutes: task.time_estimate_minutes,
        labels: task.labels || [],
      });
    } else {
      const defaultStatus = statuses.find(s => s.is_default);
      setFormData({
        title: '',
        description: '',
        priority: 1,
        is_recurring: false,
        recurring_rule: 'DAILY',
        folder_id: defaultFolderId || null,
        status_id: defaultStatus?.id || null,
        start_date: null,
        due_date: format(new Date(), 'yyyy-MM-dd'),
        time_estimate_minutes: null,
        labels: [],
      });
    }
  }, [task, defaultFolderId, statuses, open]);

  const handleSave = () => {
    if (!formData.title.trim()) return;

    onSave({
      title: formData.title,
      description: formData.description || null,
      priority: formData.priority,
      is_recurring: formData.is_recurring,
      recurring_rule: formData.is_recurring ? formData.recurring_rule : null,
      folder_id: formData.folder_id,
      status_id: formData.status_id,
      start_date: formData.start_date,
      due_date: formData.due_date,
      date: formData.due_date || format(new Date(), 'yyyy-MM-dd'),
      time_estimate_minutes: formData.time_estimate_minutes,
      labels: formData.labels,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* Title */}
          <div className="space-y-2">
            <Label>Título</Label>
            <Input
              placeholder="O que precisa ser feito?"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              placeholder="Adicione mais detalhes..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Folder */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FolderIcon className="h-3.5 w-3.5" />
                Pasta
              </Label>
              <Select
                value={formData.folder_id || 'none'}
                onValueChange={(v) => setFormData({ ...formData, folder_id: v === 'none' ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem pasta" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="none">Sem pasta</SelectItem>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      <div className="flex items-center gap-2">
                        <FolderIconRenderer icon={folder.icon} color={folder.color} className="h-4 w-4" />
                        {folder.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status_id || 'none'}
                onValueChange={(v) => setFormData({ ...formData, status_id: v === 'none' ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="none">Sem status</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status.id} value={status.id}>
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        {status.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Flag className="h-3.5 w-3.5" />
                Prioridade
              </Label>
              <Select
                value={String(formData.priority)}
                onValueChange={(v) => setFormData({ ...formData, priority: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="0">⚪ Baixa</SelectItem>
                  <SelectItem value="1">🔵 Normal</SelectItem>
                  <SelectItem value="2">🟡 Alta</SelectItem>
                  <SelectItem value="3">🔴 Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time estimate */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Estimativa
              </Label>
              <Select
                value={formData.time_estimate_minutes ? String(formData.time_estimate_minutes) : 'none'}
                onValueChange={(v) => setFormData({ 
                  ...formData, 
                  time_estimate_minutes: v === 'none' ? null : Number(v) 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sem estimativa" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="none">Sem estimativa</SelectItem>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                  <SelectItem value="240">4 horas</SelectItem>
                  <SelectItem value="480">8 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Due date */}
            <div className="space-y-2 col-span-2">
              <Label className="flex items-center gap-2">
                <CalendarIcon className="h-3.5 w-3.5" />
                Datas e Recorrência
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.due_date && !formData.start_date && "text-muted-foreground"
                    )}
                  >
                    <div className="flex flex-col items-start gap-0.5">
                      <span className="text-xs text-muted-foreground">
                        {formData.start_date 
                          ? `Início: ${format(new Date(formData.start_date), "d 'de' MMM", { locale: ptBR })}`
                          : "Início: -"
                        }
                        {" → "}
                        {formData.due_date 
                          ? `Venc: ${format(new Date(formData.due_date), "d 'de' MMM", { locale: ptBR })}`
                          : "Venc: -"
                        }
                      </span>
                      {formData.is_recurring && (
                        <span className="text-xs text-primary">
                          🔄 {getRecurrenceLabel(formData.recurring_rule)}
                        </span>
                      )}
                    </div>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <TaskSchedulePopoverContent
                    startDate={formData.start_date}
                    dueDate={formData.due_date}
                    isRecurring={formData.is_recurring}
                    recurringRule={formData.recurring_rule}
                    onChange={(updates) => setFormData((prev) => ({ ...prev, ...updates }))}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!formData.title.trim()}>
            {task ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
