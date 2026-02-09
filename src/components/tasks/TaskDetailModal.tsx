import { useState, useEffect } from 'react';
import {
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
  Pencil,
  Check,
  X,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { RichTextDisplay } from '@/components/ui/rich-text-display';
import { NeonCheckbox } from '@/components/ui/animated-check-box';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
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
import { TaskSchedulePopoverContent } from './TaskSchedulePopoverContent';

// Parse YYYY-MM-DD string to Date using local timezone (avoids UTC shift)
function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Format Date to YYYY-MM-DD string using local components
function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface TaskDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  folders: TaskFolder[];
  statuses: TaskStatus[];
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<boolean>;
  onDeleteTask: (id: string) => void;
  onDetailsChanged?: (taskId: string) => void;
}

export function TaskDetailModal({
  open,
  onOpenChange,
  task,
  folders,
  statuses,
  onUpdateTask,
  onDeleteTask,
  onDetailsChanged,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newChecklistName, setNewChecklistName] = useState('');
  const [newItemInputs, setNewItemInputs] = useState<Record<string, string>>({});
  const [expandedChecklists, setExpandedChecklists] = useState<Record<string, boolean>>({});
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState('');
  const [editingChecklistItemId, setEditingChecklistItemId] = useState<string | null>(null);
  const [editingChecklistItemTitle, setEditingChecklistItemTitle] = useState('');
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistName, setEditingChecklistName] = useState('');

  const {
    subtasks,
    checklists,
    loading,
    fetchDetails,
    createSubtask,
    updateSubtask,
    toggleSubtask,
    deleteSubtask,
    createChecklist,
    updateChecklist,
    deleteChecklist,
    createChecklistItem,
    updateChecklistItem,
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

  const notifyDetailsChanged = () => onDetailsChanged?.(task.id);

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
      notifyDetailsChanged();
    }
  };

  const handleAddChecklist = async () => {
    const name = newChecklistName.trim() || 'Checklist';
    await createChecklist(name);
    setNewChecklistName('');
    notifyDetailsChanged();
  };

  const handleAddChecklistItem = async (checklistId: string) => {
    const title = newItemInputs[checklistId]?.trim();
    if (title) {
      await createChecklistItem(checklistId, title);
      setNewItemInputs(prev => ({ ...prev, [checklistId]: '' }));
      notifyDetailsChanged();
    }
  };

  const toggleChecklistExpand = (id: string) => {
    setExpandedChecklists(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Edit handlers
  const handleEditSubtask = (subtask: { id: string; title: string }) => {
    setEditingSubtaskId(subtask.id);
    setEditingSubtaskTitle(subtask.title);
  };

  const handleSaveSubtaskEdit = async () => {
    if (editingSubtaskId && editingSubtaskTitle.trim()) {
      await updateSubtask(editingSubtaskId, { title: editingSubtaskTitle.trim() });
      notifyDetailsChanged();
    }
    setEditingSubtaskId(null);
    setEditingSubtaskTitle('');
  };

  const handleCancelSubtaskEdit = () => {
    setEditingSubtaskId(null);
    setEditingSubtaskTitle('');
  };

  const handleEditChecklistItem = (item: { id: string; title: string }) => {
    setEditingChecklistItemId(item.id);
    setEditingChecklistItemTitle(item.title);
  };

  const handleSaveChecklistItemEdit = async () => {
    if (editingChecklistItemId && editingChecklistItemTitle.trim()) {
      await updateChecklistItem(editingChecklistItemId, { title: editingChecklistItemTitle.trim() });
      notifyDetailsChanged();
    }
    setEditingChecklistItemId(null);
    setEditingChecklistItemTitle('');
  };

  const handleCancelChecklistItemEdit = () => {
    setEditingChecklistItemId(null);
    setEditingChecklistItemTitle('');
  };

  const handleEditChecklist = (checklist: { id: string; name: string }) => {
    setEditingChecklistId(checklist.id);
    setEditingChecklistName(checklist.name);
  };

  const handleSaveChecklistEdit = async () => {
    if (editingChecklistId && editingChecklistName.trim()) {
      await updateChecklist(editingChecklistId, { name: editingChecklistName.trim() });
      notifyDetailsChanged();
    }
    setEditingChecklistId(null);
    setEditingChecklistName('');
  };

  const handleCancelChecklistEdit = () => {
    setEditingChecklistId(null);
    setEditingChecklistName('');
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 bg-background">
        <DialogTitle className="sr-only">Detalhes da tarefa</DialogTitle>
        <DialogDescription className="sr-only">
          Visualize e edite título, descrição, status, prioridade, datas, subtarefas e checklists.
        </DialogDescription>
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-border/30">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="text-base">📋 Tarefa</span>
            <span className="text-xs opacity-60 bg-muted/30 px-2 py-1 rounded">{task.id.slice(0, 8)}</span>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-8 py-6 space-y-8">
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
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm bg-muted/10 rounded-lg p-5">
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

            {/* Dates + recurrence */}
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground w-28">📅 Datas</span>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 bg-muted/30">
                      📆 {task.start_date ? format(parseDateString(task.start_date), "d MMM", { locale: ptBR }) : 'Início'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover z-[100]" align="start">
                    <TaskSchedulePopoverContent
                      startDate={task.start_date}
                      dueDate={task.due_date}
                      isRecurring={task.is_recurring}
                      recurringRule={task.recurring_rule}
                      calendarMode="start"
                      onChange={(updates) => onUpdateTask(task.id, updates)}
                    />
                  </PopoverContent>
                </Popover>
                <span className="text-muted-foreground">→</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 bg-muted/30">
                      📅 {task.due_date ? format(parseDateString(task.due_date), "d MMM", { locale: ptBR }) : 'Vencimento'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover z-[100]" align="start">
                    <TaskSchedulePopoverContent
                      startDate={task.start_date}
                      dueDate={task.due_date}
                      isRecurring={task.is_recurring}
                      recurringRule={task.recurring_rule}
                      calendarMode="due"
                      onChange={(updates) => onUpdateTask(task.id, updates)}
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
          </div>

          {/* Description */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>Descrição</span>
            </div>
            {isEditingDescription ? (
              <RichTextEditor
                content={description}
                onChange={setDescription}
                onBlur={handleDescriptionSave}
                placeholder="Adicione uma descrição detalhada... (use - ou * para criar listas, selecione texto para formatação)"
                autoFocus
              />
            ) : (
              <RichTextDisplay
                content={description}
                onClick={() => setIsEditingDescription(true)}
                placeholder="Clique para adicionar uma descrição..."
              />
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
          <div className="space-y-4 bg-muted/10 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2 text-base">
                <ListChecks className="h-5 w-5 text-primary" />
                Subtarefas
                {subtasks.length > 0 && (
                  <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                    {subtasks.filter(s => s.completed).length}/{subtasks.length}
                  </span>
                )}
              </h3>
            </div>

            {subtasks.map((subtask) => (
              <div
                key={subtask.id}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/30 group"
              >
                <NeonCheckbox
                  checked={subtask.completed}
                  rounded={false}
                  onCheckedChange={async () => {
                    await toggleSubtask(subtask);
                    notifyDetailsChanged();
                  }}
                />
                {editingSubtaskId === subtask.id ? (
                  <div className="flex-1 flex items-center gap-2">
                    <Input
                      value={editingSubtaskTitle}
                      onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveSubtaskEdit();
                        if (e.key === 'Escape') handleCancelSubtaskEdit();
                      }}
                      className="h-7 text-sm"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-primary"
                      onClick={handleSaveSubtaskEdit}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleCancelSubtaskEdit}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span
                      className={cn(
                        "flex-1 cursor-pointer",
                        subtask.completed && "line-through text-muted-foreground"
                      )}
                      onClick={() => handleEditSubtask(subtask)}
                    >
                      {subtask.title}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => handleEditSubtask(subtask)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={async () => {
                        await deleteSubtask(subtask.id);
                        notifyDetailsChanged();
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
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
          <div className="space-y-4 bg-muted/10 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2 text-base">
                <span className="text-lg">☑️</span> Checklists
                {checklists.length > 0 && (
                  <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
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
                <div key={checklist.id} className="space-y-2 border border-border/30 rounded-lg p-3 group">
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
                    {editingChecklistId === checklist.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          value={editingChecklistName}
                          onChange={(e) => setEditingChecklistName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveChecklistEdit();
                            if (e.key === 'Escape') handleCancelChecklistEdit();
                          }}
                          className="h-7 text-sm font-medium"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-primary"
                          onClick={handleSaveChecklistEdit}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={handleCancelChecklistEdit}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span
                          className="font-medium flex-1 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleEditChecklist(checklist)}
                        >
                          {checklist.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {itemsCompleted} de {itemsTotal}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100"
                          onClick={() => handleEditChecklist(checklist)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={async () => {
                            await deleteChecklist(checklist.id);
                            notifyDetailsChanged();
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
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
                          <NeonCheckbox
                            checked={item.completed}
                            rounded={false}
                            onCheckedChange={async () => {
                              await toggleChecklistItem(item);
                              notifyDetailsChanged();
                            }}
                          />
                          {editingChecklistItemId === item.id ? (
                            <div className="flex-1 flex items-center gap-2">
                              <Input
                                value={editingChecklistItemTitle}
                                onChange={(e) => setEditingChecklistItemTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveChecklistItemEdit();
                                  if (e.key === 'Escape') handleCancelChecklistItemEdit();
                                }}
                                className="h-6 text-sm"
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 text-primary"
                                onClick={handleSaveChecklistItemEdit}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={handleCancelChecklistItemEdit}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <span
                                className={cn(
                                  "flex-1 text-sm cursor-pointer",
                                  item.completed && "line-through text-muted-foreground"
                                )}
                                onClick={() => handleEditChecklistItem(item)}
                              >
                                {item.title}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100"
                                onClick={() => handleEditChecklistItem(item)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 opacity-0 group-hover:opacity-100"
                                onClick={async () => {
                                  await deleteChecklistItem(item.id);
                                  notifyDetailsChanged();
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
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

            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-muted-foreground" />
              <Input
                value={newChecklistName}
                onChange={(e) => setNewChecklistName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklist()}
                placeholder="Adicionar checklist (Enter para criar)"
                className="h-8 bg-transparent border-0 focus-visible:ring-0 px-0 text-sm"
              />
              {newChecklistName.trim() && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-primary"
                  onClick={handleAddChecklist}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
            </div>
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
