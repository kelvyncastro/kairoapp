import { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Circle,
  CheckCircle2,
  MoreHorizontal,
  Calendar,
  Clock,
  Flag,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Task, TaskStatus, TaskFolder } from '@/types/tasks';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FolderIconRenderer } from './FolderIconRenderer';

interface TaskListViewProps {
  tasks: Task[];
  statuses: TaskStatus[];
  folders: TaskFolder[];
  selectedFolderId: string | null;
  onToggleComplete: (task: Task) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onCreateTask: () => void;
}

export function TaskListView({
  tasks,
  statuses,
  folders,
  selectedFolderId,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onEditTask,
  onCreateTask,
}: TaskListViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [quickAddTitle, setQuickAddTitle] = useState('');

  const getStatusColor = (statusId: string | null) => {
    if (!statusId) return '#6b7280';
    const status = statuses.find(s => s.id === statusId);
    return status?.color || '#6b7280';
  };

  const getStatusName = (statusId: string | null) => {
    if (!statusId) return 'Sem status';
    const status = statuses.find(s => s.id === statusId);
    return status?.name || 'Sem status';
  };

  const getPriorityInfo = (priority: number) => {
    switch (priority) {
      case 3: return { label: 'Urgente', color: '#ef4444', icon: '🔴' };
      case 2: return { label: 'Alta', color: '#f59e0b', icon: '🟡' };
      case 1: return { label: 'Normal', color: '#6b7280', icon: '🔵' };
      default: return { label: 'Baixa', color: '#6b7280', icon: '⚪' };
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Hoje';
    if (isTomorrow(date)) return 'Amanhã';
    return format(date, "d MMM", { locale: ptBR });
  };

  const isOverdue = (dateStr: string | null, completed: boolean) => {
    if (!dateStr || completed) return false;
    return isPast(parseISO(dateStr)) && !isToday(parseISO(dateStr));
  };

  // Group tasks by status
  const groupedTasks = statuses.reduce((acc, status) => {
    acc[status.id] = tasks.filter(t => t.status_id === status.id);
    return acc;
  }, {} as Record<string, Task[]>);

  // Add tasks without status
  const noStatusTasks = tasks.filter(t => !t.status_id);
  if (noStatusTasks.length > 0) {
    groupedTasks['no-status'] = noStatusTasks;
  }

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const isGroupExpanded = (groupId: string) => {
    return expandedGroups[groupId] !== false; // Default to expanded
  };

  const currentFolder = folders.find(f => f.id === selectedFolderId);

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header with folder info */}
      {currentFolder && (
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <FolderIconRenderer 
              icon={currentFolder.icon} 
              color={currentFolder.color}
              className="h-5 w-5"
            />
            <h2 className="text-lg font-semibold">{currentFolder.name}</h2>
            <span 
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: currentFolder.color + '20', color: currentFolder.color }}
            >
              {tasks.length} tarefas
            </span>
          </div>
        </div>
      )}

      {/* Quick add */}
      <div className="px-6 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Adicionar tarefa..."
            value={quickAddTitle}
            onChange={(e) => setQuickAddTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && quickAddTitle.trim()) {
                onCreateTask();
                setQuickAddTitle('');
              }
            }}
            className="border-0 bg-transparent focus-visible:ring-0 px-0 h-8 text-sm"
          />
        </div>
      </div>

      {/* Status groups */}
      <div className="divide-y divide-border">
        {[...statuses, { id: 'no-status', name: 'Sem status', color: '#6b7280', order: 999, user_id: '', is_default: false, created_at: '' }].map((status) => {
          const groupTasks = groupedTasks[status.id] || [];
          if (groupTasks.length === 0 && status.id === 'no-status') return null;

          return (
            <div key={status.id} className="bg-background">
              {/* Group header */}
              <button
                className="w-full flex items-center gap-2 px-6 py-3 hover:bg-accent/30 transition-colors"
                onClick={() => toggleGroup(status.id)}
              >
                {isGroupExpanded(status.id) ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span 
                  className="text-xs px-2 py-0.5 rounded font-medium"
                  style={{ backgroundColor: status.color + '20', color: status.color }}
                >
                  {status.name}
                </span>
                <span className="text-xs text-muted-foreground">{groupTasks.length}</span>
              </button>

              {/* Tasks */}
              {isGroupExpanded(status.id) && (
                <div className="bg-card/30">
                  {/* Column headers */}
                  <div className="grid grid-cols-[auto_1fr_120px_100px_100px_80px_40px] gap-4 px-6 py-2 text-xs text-muted-foreground border-b border-border/50">
                    <div className="w-8" />
                    <div>Nome</div>
                    <div>Status</div>
                    <div>Data de vencimento</div>
                    <div>Prioridade</div>
                    <div>Estimativa</div>
                    <div />
                  </div>

                  {groupTasks.map((task) => {
                    const priorityInfo = getPriorityInfo(task.priority);
                    const dueDate = formatDate(task.due_date || task.date);
                    const overdue = isOverdue(task.due_date || task.date, task.completed);

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "group grid grid-cols-[auto_1fr_120px_100px_100px_80px_40px] gap-4 px-6 py-2.5 items-center hover:bg-accent/20 transition-colors border-b border-border/30 last:border-0",
                          task.completed && "opacity-50"
                        )}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => onToggleComplete(task)}
                          className="w-8 flex items-center justify-center"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                          )}
                        </button>

                        {/* Title */}
                        <div className="min-w-0">
                          <p className={cn(
                            "text-sm truncate",
                            task.completed && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Status */}
                        <div>
                          <span 
                            className="text-xs px-2 py-0.5 rounded"
                            style={{ 
                              backgroundColor: getStatusColor(task.status_id) + '20',
                              color: getStatusColor(task.status_id)
                            }}
                          >
                            {getStatusName(task.status_id)}
                          </span>
                        </div>

                        {/* Due date */}
                        <div className="flex items-center gap-1.5">
                          {dueDate && (
                            <>
                              <Calendar className={cn(
                                "h-3.5 w-3.5",
                                overdue ? "text-red-500" : "text-muted-foreground"
                              )} />
                              <span className={cn(
                                "text-xs",
                                overdue ? "text-red-500" : "text-muted-foreground"
                              )}>
                                {dueDate}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Priority */}
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{priorityInfo.icon}</span>
                          <span 
                            className="text-xs"
                            style={{ color: priorityInfo.color }}
                          >
                            {priorityInfo.label}
                          </span>
                        </div>

                        {/* Time estimate */}
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          {task.time_estimate_minutes && (
                            <>
                              <Clock className="h-3.5 w-3.5" />
                              <span className="text-xs">
                                {task.time_estimate_minutes >= 60 
                                  ? `${Math.floor(task.time_estimate_minutes / 60)}h`
                                  : `${task.time_estimate_minutes}m`}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem onClick={() => onEditTask(task)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => onDeleteTask(task.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add task in group */}
                  <button
                    onClick={onCreateTask}
                    className="w-full flex items-center gap-2 px-6 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Tarefa
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <div className="empty-state py-16">
          <Calendar className="empty-state-icon" />
          <h3 className="empty-state-title">Nenhuma tarefa</h3>
          <p className="empty-state-description">
            Clique em "Nova Tarefa" para começar
          </p>
          <Button onClick={onCreateTask}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      )}
    </div>
  );
}
