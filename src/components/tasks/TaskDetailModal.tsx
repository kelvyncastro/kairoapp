import { useState, useEffect } from 'react';
import { 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  Flag, 
  FolderIcon, 
  Tag,
  ListChecks,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Task, TaskFolder, TaskStatus, TaskChecklist, TaskChecklistItem } from '@/types/tasks';
import { useTaskDetails } from '@/hooks/useTaskDetails';
import { FolderIconRenderer } from './FolderIconRenderer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  folders: TaskFolder[];
  statuses: TaskStatus[];
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<boolean>;
  onDeleteTask: (id: string) => void;
}

export function TaskDetailModal({
  open,
  onOpenChange,
  task,
  folders,
  statuses,
  onUpdateTask,
  onDeleteTask,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newChecklistName, setNewChecklistName] = useState('');
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});
  const [expandedChecklists, setExpandedChecklists] = useState<Record<string, boolean>>({});

  const {
    subtasks,
    checklists,
    loading,
    fetchDetails,
    createSubtask,
    toggleSubtask,
    deleteSubtask,
    createChecklist,
    deleteChecklist,
    createChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    totalItems,
    totalCompleted,
  } = useTaskDetails(task?.id || null);

  useEffect(() => {
    if (task && open) {
      setTitle(task.title);
      setDescription(task.description || '');
      fetchDetails();
      // Expand all checklists by default
      const expanded: Record<string, boolean> = {};
      checklists.forEach(c => { expanded[c.id] = true; });
      setExpandedChecklists(expanded);
    }
  }, [task, open, fetchDetails]);

  useEffect(() => {
    // Keep expanded state in sync with checklists
    if (checklists.length > 0) {
      setExpandedChecklists(prev => {
        const updated = { ...prev };
        checklists.forEach(c => {
          if (updated[c.id] === undefined) updated[c.id] = true;
        });
        return updated;
      });
    }
  }, [checklists]);

  if (!task) return null;

  const handleTitleSave = async () => {
    if (title.trim() && title !== task.title) {
      await onUpdateTask(task.id, { title });
    }
    setIsEditingTitle(false);
  };

  const handleDescriptionSave = async () => {
    if (description !== task.description) {
      await onUpdateTask(task.id, { description: description || null });
    }
    setIsEditingDescription(false);
  };

  const handleAddSubtask = async () => {
    if (newSubtaskTitle.trim()) {
      await createSubtask(newSubtaskTitle.trim());
      setNewSubtaskTitle('');
    }
  };

  const handleAddChecklist = async () => {
    const name = newChecklistName.trim() || 'Checklist';
    await createChecklist(name);
    setNewChecklistName('');
  };

  const handleAddChecklistItem = async (checklistId: string) => {
    const title = newItemInputs[checklistId]?.trim();
    if (title) {
      await createChecklistItem(checklistId, title);
      setNewItemInputs(prev => ({ ...prev, [checklistId]: '' }));
    }
  };

  const toggleChecklistExpand = (id: string) => {
    setExpandedChecklists(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getStatusInfo = (statusId: string | null) => {
    if (!statusId) return null;
    return statuses.find(s => s.id === statusId);
  };

  const getPriorityInfo = (priority: number) => {
    switch (priority) {
      case 3: return { label: 'Urgente', emoji: '🔴' };
      case 2: return { label: 'Alta', emoji: '🟡' };
      case 1: return { label: 'Normal', emoji: '🔵' };
      default: return { label: 'Baixa', emoji: '⚪' };
    }
  };

  const status = getStatusInfo(task.status_id);
  const priority = getPriorityInfo(task.priority);
  const progressPercent = totalItems > 0 ? (totalCompleted / totalItems) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>📋 Tarefa</span>
            <span className="text-xs opacity-60">{task.id.slice(0, 8)}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)] px-6 py-4 space-y-6">
          {/* Title */}
          <div>
            {isEditingTitle ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSave()}
                className="text-xl font-semibold bg-transparent border-0 border-b border-border focus-visible:ring-0 rounded-none px-0"
                autoFocus
              />
            ) : (
              <h2
                className="text-xl font-semibold cursor-pointer hover:bg-muted/30 rounded px-2 py-1 -mx-2"
                onClick={() => setIsEditingTitle(true)}
              >
                {task.title}
              </h2>
            )}
          </div>

          {/* Properties grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Status */}
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground w-28">⊙ Status</span>
              <Select
                value={task.status_id || 'none'}
                onValueChange={(v) => onUpdateTask(task.id, { status_id: v === 'none' ? null : v })}
              >
                <SelectTrigger className="h-8 bg-muted/30 border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {statuses.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground w-28">🚩 Prioridade</span>
              <Select
                value={String(task.priority)}
                onValueChange={(v) => onUpdateTask(task.id, { priority: Number(v) })}
              >
                <SelectTrigger className="h-8 bg-muted/30 border-0">
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

            {/* Dates */}
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground w-28">📅 Datas</span>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 bg-muted/30">
                      📆 {task.start_date ? format(new Date(task.start_date), "d MMM", { locale: ptBR }) : 'Início'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover" align="start">
                    <Calendar
                      mode="single"
                      selected={task.start_date ? new Date(task.start_date) : undefined}
                      onSelect={(date) => onUpdateTask(task.id, { 
                        start_date: date ? format(date, 'yyyy-MM-dd') : null 
                      })}
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">→</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 bg-muted/30">
                      📅 {task.due_date ? format(new Date(task.due_date), "d MMM", { locale: ptBR }) : 'Vencimento'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover" align="start">
                    <Calendar
                      mode="single"
                      selected={task.due_date ? new Date(task.due_date) : undefined}
                      onSelect={(date) => onUpdateTask(task.id, { 
                        due_date: date ? format(date, 'yyyy-MM-dd') : null 
                      })}
                      locale={ptBR}
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Time estimate */}
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground w-28">⏱ Tempo estimado</span>
              <Select
                value={task.time_estimate_minutes ? String(task.time_estimate_minutes) : 'none'}
                onValueChange={(v) => onUpdateTask(task.id, { 
                  time_estimate_minutes: v === 'none' ? null : Number(v) 
                })}
              >
                <SelectTrigger className="h-8 bg-muted/30 border-0">
                  <SelectValue placeholder="Vazio" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="none">Vazio</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                  <SelectItem value="240">4 horas</SelectItem>
                  <SelectItem value="480">8 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Folder */}
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground w-28">📁 Pasta</span>
              <Select
                value={task.folder_id || 'none'}
                onValueChange={(v) => onUpdateTask(task.id, { folder_id: v === 'none' ? null : v })}
              >
                <SelectTrigger className="h-8 bg-muted/30 border-0">
                  <SelectValue placeholder="Sem pasta" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="none">Sem pasta</SelectItem>
                  {folders.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      <div className="flex items-center gap-2">
                        <FolderIconRenderer icon={f.icon} color={f.color} className="h-4 w-4" />
                        {f.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Etiquetas placeholder */}
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground w-28">🏷 Etiquetas</span>
              <span className="text-muted-foreground/60">Vazio</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Adicionar descrição</span>
            </div>
            {isEditingDescription ? (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionSave}
                placeholder="Adicione uma descrição..."
                className="min-h-[100px] bg-muted/20 border-border/30"
                autoFocus
              />
            ) : (
              <div
                className={cn(
                  "min-h-[60px] p-3 rounded-md cursor-pointer bg-muted/20 border border-border/30",
                  !description && "text-muted-foreground"
                )}
                onClick={() => setIsEditingDescription(true)}
              >
                {description || 'Clique para adicionar uma descrição...'}
              </div>
            )}
          </div>

          {/* Progress indicator */}
          {totalItems > 0 && (
            <div className="flex items-center gap-3">
              <Progress value={progressPercent} className="h-2 flex-1" />
              <span className="text-sm text-muted-foreground">
                {totalCompleted}/{totalItems}
              </span>
            </div>
          )}

          {/* Subtasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Adicionar subtarefa
              </h3>
            </div>

            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/30 group"
              >
                <Checkbox
                  checked={subtask.completed}
                  onCheckedChange={() => toggleSubtask(subtask)}
                />
                <span className={cn(
                  "flex-1",
                  subtask.completed && "line-through text-muted-foreground"
                )}>
                  {subtask.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => deleteSubtask(subtask.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}

            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-muted-foreground" />
              <Input
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Add Tarefa"
                className="h-8 bg-transparent border-0 focus-visible:ring-0 px-0"
              />
            </div>
          </div>

          {/* Checklists */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                ☑️ Checklists
                {checklists.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {totalCompleted}/{totalItems}
                  </span>
                )}
              </h3>
            </div>

            {checklists.map((checklist) => {
              const itemsCompleted = checklist.items?.filter(i => i.completed).length || 0;
              const itemsTotal = checklist.items?.length || 0;
              const isExpanded = expandedChecklists[checklist.id] !== false;

              return (
                <div key={checklist.id} className="space-y-2 border border-border/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleChecklistExpand(checklist.id)}
                      className="p-1 hover:bg-muted/30 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                    <span className="font-medium flex-1">{checklist.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {itemsCompleted} de {itemsTotal}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => deleteChecklist(checklist.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {isExpanded && (
                    <>
                      {itemsTotal > 0 && (
                        <Progress 
                          value={itemsTotal > 0 ? (itemsCompleted / itemsTotal) * 100 : 0} 
                          className="h-1.5" 
                        />
                      )}

                      {checklist.items?.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-muted/30 group"
                        >
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => toggleChecklistItem(item)}
                          />
                          <span className={cn(
                            "flex-1 text-sm",
                            item.completed && "line-through text-muted-foreground"
                          )}>
                            {item.title}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 group-hover:opacity-100"
                            onClick={() => deleteChecklistItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}

                      <div className="flex items-center gap-2 px-2">
                        <Plus className="h-4 w-4 text-muted-foreground" />
                        <Input
                          value={newItemInputs[checklist.id] || ''}
                          onChange={(e) => setNewItemInputs(prev => ({ 
                            ...prev, 
                            [checklist.id]: e.target.value 
                          }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem(checklist.id)}
                          placeholder="Adicionar item"
                          className="h-7 text-sm bg-transparent border-0 focus-visible:ring-0 px-0"
                        />
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            <button
              onClick={handleAddChecklist}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-4 w-4" />
              Adicionar checklist
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border/30 bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => {
              onDeleteTask(task.id);
              onOpenChange(false);
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir tarefa
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
