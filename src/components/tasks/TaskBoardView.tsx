import { Plus, MoreHorizontal, Edit2, Trash2, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Task, TaskStatus, TaskFolder } from '@/types/tasks';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
}

export function TaskBoardView({
  tasks,
  statuses,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onEditTask,
  onCreateTask,
}: TaskBoardViewProps) {
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

  // Group tasks by status
  const tasksByStatus = statuses.reduce((acc, status) => {
    acc[status.id] = tasks.filter(t => t.status_id === status.id);
    return acc;
  }, {} as Record<string, Task[]>);

  // Tasks without status go to first column
  const noStatusTasks = tasks.filter(t => !t.status_id);
  if (noStatusTasks.length > 0 && statuses.length > 0) {
    tasksByStatus[statuses[0].id] = [
      ...noStatusTasks,
      ...(tasksByStatus[statuses[0].id] || []),
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

  return (
    <div className="flex-1 overflow-x-auto p-4">
      <div className="flex gap-4 min-h-full">
        {statuses.map((status) => {
          const columnTasks = tasksByStatus[status.id] || [];

          return (
            <div
              key={status.id}
              className="flex flex-col w-72 shrink-0"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status.id)}
            >
              {/* Column header */}
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
              </div>

              {/* Add task button */}
              <button
                onClick={() => onCreateTask(status.id)}
                className="flex items-center gap-2 px-3 py-2 mb-2 text-sm rounded-lg border border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                style={{ color: status.color }}
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Tarefa</span>
              </button>

              {/* Task cards */}
              <div className="flex-1 space-y-2">
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
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => onToggleComplete(task)}
                          className="mt-0.5 shrink-0"
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
        <div className="w-72 shrink-0">
          <button
            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Adicionar grupo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
