import { useState } from 'react';
import { Plus, MoreHorizontal, Edit2, Trash2, Calendar, Clock, X, Check, AlertTriangle, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NeonCheckbox } from '@/components/ui/animated-check-box';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Task, TaskStatus, TaskFolder, COLOR_PALETTE } from '@/types/tasks';
import { format, isToday, isTomorrow, parseISO, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Virtual "Atrasada" status color
const OVERDUE_COLOR = '#dc2626';

interface TaskBoardViewProps {
  tasks: Task[];
  statuses: TaskStatus[];
  folders: TaskFolder[];
  selectedFolderId: string | null;
  onToggleComplete: (task: Task) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onCreateTask: (statusId?: string) => void;
  onCreateStatus?: (status: Partial<TaskStatus>) => Promise<TaskStatus | null>;
  onUpdateStatus?: (id: string, updates: Partial<TaskStatus>) => Promise<boolean>;
  onDeleteStatus?: (id: string) => Promise<boolean>;
}

export function TaskBoardView({
  tasks,
  statuses,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onEditTask,
  onCreateTask,
  onCreateStatus,
  onUpdateStatus,
  onDeleteStatus,
}: TaskBoardViewProps) {
  const [isAddingStatus, setIsAddingStatus] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editStatusName, setEditStatusName] = useState('');
  const [editStatusColor, setEditStatusColor] = useState(COLOR_PALETTE[0]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, "d MMM", { locale: ptBR });
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 3: return { label: 'Urgente', color: '#ef4444', bg: 'bg-red-500/20' };
      case 2: return { label: 'Alta', color: '#f59e0b', bg: 'bg-amber-500/20' };
      case 1: return { label: 'Normal', color: '#3b82f6', bg: 'bg-blue-500/20' };
      default: return { label: 'Baixa', color: '#6b7280', bg: 'bg-gray-500/20' };
    }
  };

  // Define the desired order for statuses
  const getStatusPriority = (name: string): number => {
    const lowerName = name.toLowerCase().trim();
    if (lowerName === 'não iniciada') return 0;
    if (lowerName.includes('empecilho') || lowerName.includes('não concluída')) return 1;
    if (lowerName === 'em progresso') return 2;
    if (lowerName === 'concluída') return 3;
    return 999; // Custom statuses go at the end
  };

  const sortedStatuses = [...statuses].sort((a, b) => {
    const priorityA = getStatusPriority(a.name);
    const priorityB = getStatusPriority(b.name);
    if (priorityA !== priorityB) return priorityA - priorityB;
    // For custom statuses with same priority, sort by order
    return (a.order ?? 999) - (b.order ?? 999);
  });

  // Group tasks by status
  const tasksByStatus = sortedStatuses.reduce((acc, status) => {
    acc[status.id] = tasks.filter(t => t.status_id === status.id);
    return acc;
  }, {} as Record<string, Task[]>);

  // Tasks without status go to first column (Não iniciada)
  const noStatusTasks = tasks.filter(t => !t.status_id);
  if (noStatusTasks.length > 0 && sortedStatuses.length > 0) {
    tasksByStatus[sortedStatuses[0].id] = [
      ...noStatusTasks,
      ...(tasksByStatus[sortedStatuses[0].id] || []),
    ];
  }

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      onUpdateTask(taskId, { status_id: statusId });
    }
  };

  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);

  const handleAddStatus = async () => {
    if (!newStatusName.trim() || !onCreateStatus) return;
    
    await onCreateStatus({
      name: newStatusName.trim(),
      color: selectedColor,
      order: statuses.length,
    });
    
    setNewStatusName('');
    setSelectedColor(COLOR_PALETTE[0]);
    setIsAddingStatus(false);
  };

  const handleStartEditStatus = (status: TaskStatus) => {
    setEditingStatusId(status.id);
    setEditStatusName(status.name);
    setEditStatusColor(status.color);
  };

  const handleSaveEditStatus = async () => {
    if (!editingStatusId || !editStatusName.trim() || !onUpdateStatus) return;
    
    await onUpdateStatus(editingStatusId, {
      name: editStatusName.trim(),
      color: editStatusColor,
    });
    
    setEditingStatusId(null);
    setEditStatusName('');
    setEditStatusColor(COLOR_PALETTE[0]);
  };

  const handleCancelEditStatus = () => {
    setEditingStatusId(null);
    setEditStatusName('');
    setEditStatusColor(COLOR_PALETTE[0]);
  };

  return (
    <div className="flex-1 overflow-hidden p-3 md:p-4">
      <div className="flex gap-3 md:gap-4 h-full overflow-x-auto">
        {sortedStatuses.map((status) => {
          const columnTasks = tasksByStatus[status.id] || [];
          const isEditing = editingStatusId === status.id;

          return (
            <div
              key={status.id}
              className="flex flex-col w-56 md:w-64 shrink-0 group/column h-full"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status.id)}
            >
              {/* Column header */}
              {isEditing ? (
                <div className="space-y-3 p-3 mb-3 bg-card border border-border/30 rounded-lg">
                  <Input
                    value={editStatusName}
                    onChange={(e) => setEditStatusName(e.target.value)}
                    placeholder="Nome do status..."
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEditStatus();
                      if (e.key === 'Escape') handleCancelEditStatus();
                    }}
                  />
                  
                  {/* Color picker */}
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Cor do status</div>
                    <div className="grid grid-cols-6 gap-1.5">
                      {COLOR_PALETTE.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-6 h-6 rounded-full transition-all duration-150 flex items-center justify-center ${
                            editStatusColor === color 
                              ? "ring-2 ring-offset-2 ring-offset-card ring-primary scale-110" 
                              : "hover:scale-110"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditStatusColor(color)}
                        >
                          {editStatusColor === color && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={handleCancelEditStatus}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={handleSaveEditStatus}
                      disabled={!editStatusName.trim()}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded"
                    style={{ 
                      backgroundColor: `${status.color}30`,
                      color: status.color 
                    }}
                  >
                    {status.name.toUpperCase()}
                  </span>
                  <span className="text-xs text-muted-foreground">{columnTasks.length}</span>
                  
                  {/* Status options menu */}
                  {(onUpdateStatus || onDeleteStatus) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-5 w-5 ml-auto opacity-0 group-hover/column:opacity-100 hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        {onUpdateStatus && (
                          <DropdownMenuItem onClick={() => handleStartEditStatus(status)}>
                            <Pencil className="h-3.5 w-3.5 mr-2" />
                            Editar status
                          </DropdownMenuItem>
                        )}
                        {onUpdateStatus && onDeleteStatus && <DropdownMenuSeparator />}
                        {onDeleteStatus && statuses.length > 1 && (
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => onDeleteStatus(status.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Excluir status
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}

              {/* Add task button */}
              <button
                onClick={() => onCreateTask(status.id)}
                className="flex items-center gap-2 px-3 py-2 mb-2 text-sm rounded-lg border border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                style={{ color: status.color }}
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Tarefa</span>
              </button>

              {/* Task cards - Scrollable */}
              <div className="flex-1 space-y-2 overflow-y-auto pr-1">
                {columnTasks.map((task) => {
                  const priorityInfo = getPriorityLabel(task.priority);
                  const dueDate = formatDate(task.due_date || task.date);

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      className={cn(
                        "group bg-card border border-border/30 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-border/60 transition-colors",
                        task.completed && "opacity-50"
                      )}
                    >
                      {/* Task header */}
                      <div className="flex items-start gap-2 mb-2">
                        <NeonCheckbox
                          checked={task.completed}
                          rounded={false}
                          onCheckedChange={() => setTimeout(() => onToggleComplete(task), 1000)}
                        />
                        <span 
                          className={cn(
                            "flex-1 text-sm font-medium cursor-pointer hover:text-primary transition-colors",
                            task.completed && "line-through text-muted-foreground"
                          )}
                          onClick={() => onEditTask(task)}
                        >
                          {task.title}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => onEditTask(task)}>
                              <Edit2 className="h-3.5 w-3.5 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => onDeleteTask(task.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Task metadata */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Overdue indicator */}
                        {(() => {
                          const dueDateStr = task.due_date || task.date;
                          const isOverdue = dueDateStr && 
                            !task.completed && 
                            isBefore(parseISO(dueDateStr), startOfDay(new Date()));
                          
                          if (isOverdue) {
                            return (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded flex items-center gap-1"
                                style={{ 
                                  backgroundColor: `${OVERDUE_COLOR}30`,
                                  color: OVERDUE_COLOR
                                }}
                              >
                                <AlertTriangle className="h-3 w-3" />
                                Atrasada
                              </span>
                            );
                          }
                          return null;
                        })()}
                        
                        {dueDate && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {dueDate}
                          </span>
                        )}
                        
                        <span
                          className={cn("text-xs px-1.5 py-0.5 rounded", priorityInfo.bg)}
                          style={{ color: priorityInfo.color }}
                        >
                          {priorityInfo.label}
                        </span>

                        {task.time_estimate_minutes && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {task.time_estimate_minutes >= 60 
                              ? `${Math.floor(task.time_estimate_minutes / 60)}h`
                              : `${task.time_estimate_minutes}m`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Add column button */}
        {onCreateStatus && (
          <div className="w-56 md:w-64 shrink-0">
            {isAddingStatus ? (
              <div className="space-y-3 p-3 bg-card border border-border/30 rounded-lg">
                <Input
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value)}
                  placeholder="Nome do status..."
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddStatus();
                    if (e.key === 'Escape') {
                      setIsAddingStatus(false);
                      setNewStatusName('');
                      setSelectedColor(COLOR_PALETTE[0]);
                    }
                  }}
                />
                
                {/* Color picker */}
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Cor do status</div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-6 h-6 rounded-full transition-all duration-150 flex items-center justify-center ${
                          selectedColor === color 
                            ? "ring-2 ring-offset-2 ring-offset-card ring-primary scale-110" 
                            : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setSelectedColor(color)}
                      >
                        {selectedColor === color && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => {
                      setIsAddingStatus(false);
                      setNewStatusName('');
                      setSelectedColor(COLOR_PALETTE[0]);
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={handleAddStatus}
                    disabled={!newStatusName.trim()}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Criar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingStatus(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar status</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
