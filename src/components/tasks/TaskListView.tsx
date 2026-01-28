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
  ChevronDown,
  ChevronRight,
  ListTodo,
  FolderIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  onDeleteTask,
  onEditTask,
  onCreateTask,
}: TaskListViewProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

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
    <div className="flex-1 overflow-y-auto bg-background">
      {/* Header with folder info */}
      <div className="px-6 py-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          {currentFolder ? (
            <>
              <FolderIconRenderer 
                icon={currentFolder.icon} 
                color={currentFolder.color}
                className="h-5 w-5"
              />
              <h2 className="text-lg font-semibold tracking-tight">{currentFolder.name}</h2>
            </>
          ) : selectedFolderId === 'unorganized' ? (
            <>
              <FolderIcon className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold tracking-tight">Sem pasta</h2>
            </>
          ) : (
            <>
              <ListTodo className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold tracking-tight">Todas as tarefas</h2>
            </>
          )}
          <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">
            {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}
          </span>
        </div>
      </div>

      {/* Quick add */}
      <div className="px-6 py-3 border-b border-border/50 bg-muted/30">
        <button
          onClick={onCreateTask}
          className="w-full flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
        >
          <Plus className="h-4 w-4" />
          <span>Adicionar tarefa...</span>
        </button>
      </div>

      {/* Status groups */}
      <div className="divide-y divide-border/30">
        {[...statuses, { id: 'no-status', name: 'Sem status', color: '#6b7280', order: 999, user_id: '', is_default: false, created_at: '' }].map((status) => {
          const groupTasks = groupedTasks[status.id] || [];
          if (groupTasks.length === 0 && status.id === 'no-status') return null;

          return (
            <div key={status.id}>
              {/* Group header */}
              <button
                className="w-full flex items-center gap-3 px-6 py-3 hover:bg-muted/50 transition-colors"
                onClick={() => toggleGroup(status.id)}
              >
                {isGroupExpanded(status.id) ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span 
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                <span className="text-sm font-medium">{status.name}</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{groupTasks.length}</span>
              </button>

              {/* Tasks */}
              {isGroupExpanded(status.id) && groupTasks.length > 0 && (
                <div className="px-4 pb-2">
                  {groupTasks.map((task) => {
                    const priorityInfo = getPriorityInfo(task.priority);
                    const dueDate = formatDate(task.due_date || task.date);
                    const overdue = isOverdue(task.due_date || task.date, task.completed);

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "group flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors mb-1",
                          task.completed && "opacity-50"
                        )}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete(task);
                          }}
                          className="shrink-0"
                        >
                          {task.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                          )}
                        </button>

                        {/* Content */}
                        <div className="flex-1 min-w-0" onClick={() => onEditTask(task)}>
                          <p className={cn(
                            "text-sm font-medium truncate cursor-pointer",
                            task.completed && "line-through text-muted-foreground"
                          )}>
                            {task.title}
                          </p>
                        </div>

                        {/* Metadata */}
                        <div className="flex items-center gap-3 shrink-0">
                          {dueDate && (
                            <span className={cn(
                              "text-xs flex items-center gap-1",
                              overdue ? "text-destructive" : "text-muted-foreground"
                            )}>
                              <Calendar className="h-3 w-3" />
                              {dueDate}
                            </span>
                          )}
                          
                          <span className="text-sm">{priorityInfo.icon}</span>

                          {task.time_estimate_minutes && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {task.time_estimate_minutes >= 60 
                                ? `${Math.floor(task.time_estimate_minutes / 60)}h`
                                : `${task.time_estimate_minutes}m`}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            >
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
                    );
                  })}
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
