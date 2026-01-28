import { useState, useCallback } from 'react';
import { 
  Plus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Edit2,
  Trash2,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Task, TaskStatus, TaskFolder } from '@/types/tasks';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FolderIconRenderer } from './FolderIconRenderer';

interface TaskTableViewProps {
  tasks: Task[];
  statuses: TaskStatus[];
  folders: TaskFolder[];
  selectedFolderId: string | null;
  onToggleComplete: (task: Task) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onCreateTask: () => void;
  onQuickCreateTask: (title: string, folderId?: string | null, statusId?: string) => void;
}

export function TaskTableView({
  tasks,
  statuses,
  folders,
  selectedFolderId,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onEditTask,
  onCreateTask,
  onQuickCreateTask,
}: TaskTableViewProps) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Group tasks by folder
  const groupedTasks = tasks.reduce((acc, task) => {
    const folderId = task.folder_id || 'no-folder';
    if (!acc[folderId]) acc[folderId] = [];
    acc[folderId].push(task);
    return acc;
  }, {} as Record<string, Task[]>);

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: prev[folderId] === false ? true : false,
    }));
  };

  const isFolderExpanded = (folderId: string) => {
    return expandedFolders[folderId] !== false;
  };

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

  const getStatusInfo = (statusId: string | null) => {
    if (!statusId) return { name: 'Sem status', color: '#6b7280' };
    const status = statuses.find(s => s.id === statusId);
    return status || { name: 'Sem status', color: '#6b7280' };
  };

  // Determine which folders to show
  const foldersToShow = selectedFolderId
    ? folders.filter(f => f.id === selectedFolderId)
    : folders;

  const showNoFolder = !selectedFolderId && groupedTasks['no-folder']?.length > 0;

  const handleStatusChange = useCallback((taskId: string, statusId: string) => {
    onUpdateTask(taskId, { status_id: statusId });
  }, [onUpdateTask]);

  const handlePriorityChange = useCallback((taskId: string, priority: string) => {
    onUpdateTask(taskId, { priority: parseInt(priority) });
  }, [onUpdateTask]);

  return (
    <div className="flex-1 overflow-auto">
      {/* Folder sections */}
      {foldersToShow.map((folder) => {
        const folderTasks = groupedTasks[folder.id] || [];

        return (
          <div key={folder.id} className="border-b border-border/20">
            {/* Folder header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10">
              <button
                onClick={() => toggleFolder(folder.id)}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                {isFolderExpanded(folder.id) ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <FolderIconRenderer 
                  icon={folder.icon} 
                  color={folder.color}
                  className="h-4 w-4"
                />
                <span className="font-medium">{folder.name}</span>
                <span 
                  className="text-xs font-medium px-2 py-0.5 rounded"
                  style={{ 
                    backgroundColor: `${folder.color}30`,
                    color: folder.color 
                  }}
                >
                  {folder.name.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {folderTasks.length} tarefas
                </span>
              </button>
            </div>

            {/* Tasks table */}
            {isFolderExpanded(folder.id) && (
              <TaskTable
                tasks={folderTasks}
                statuses={statuses}
                onToggleComplete={onToggleComplete}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                onEditTask={onEditTask}
                onQuickAdd={(title) => onQuickCreateTask(title, folder.id)}
                formatDate={formatDate}
                getPriorityLabel={getPriorityLabel}
                getStatusInfo={getStatusInfo}
                handleStatusChange={handleStatusChange}
                handlePriorityChange={handlePriorityChange}
              />
            )}
          </div>
        );
      })}

      {/* No folder section */}
      {showNoFolder && (
        <div className="border-b border-border/20">
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10">
            <button
              onClick={() => toggleFolder('no-folder')}
              className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              {isFolderExpanded('no-folder') ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-medium text-muted-foreground">Sem pasta</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {groupedTasks['no-folder']?.length || 0} tarefas
              </span>
            </button>
          </div>

          {isFolderExpanded('no-folder') && (
            <TaskTable
              tasks={groupedTasks['no-folder'] || []}
              statuses={statuses}
              onToggleComplete={onToggleComplete}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              onEditTask={onEditTask}
              onQuickAdd={(title) => onQuickCreateTask(title, null)}
              formatDate={formatDate}
              getPriorityLabel={getPriorityLabel}
              getStatusInfo={getStatusInfo}
              handleStatusChange={handleStatusChange}
              handlePriorityChange={handlePriorityChange}
            />
          )}
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">Nenhuma tarefa</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Clique para adicionar sua primeira tarefa
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

// Separate TaskTable component for reusability
interface TaskTableProps {
  tasks: Task[];
  statuses: TaskStatus[];
  onToggleComplete: (task: Task) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onQuickAdd: (title: string) => void;
  formatDate: (date: string | null) => string | null;
  getPriorityLabel: (priority: number) => { label: string; color: string; bg: string };
  getStatusInfo: (statusId: string | null) => { name: string; color: string };
  handleStatusChange: (taskId: string, statusId: string) => void;
  handlePriorityChange: (taskId: string, priority: string) => void;
}

interface InlineAddTaskProps {
  onAdd: (title: string) => void;
}

function InlineAddTask({ onAdd }: InlineAddTaskProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');

  const handleSubmit = () => {
    if (title.trim()) {
      onAdd(title.trim());
      setTitle('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setTitle('');
      setIsAdding(false);
    }
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="w-full flex items-center gap-2 px-6 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
      >
        <Plus className="h-4 w-4 ml-6" />
        <span>Adicionar Tarefa</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 px-6 py-2 bg-muted/10 border-y border-border/20">
      <Plus className="h-4 w-4 ml-6 text-muted-foreground" />
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Tarefa Nome ou type '/' for commands"
        className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
        autoFocus
      />
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs text-muted-foreground"
          onClick={() => {
            setTitle('');
            setIsAdding(false);
          }}
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          className="h-6 text-xs"
          onClick={handleSubmit}
          disabled={!title.trim()}
        >
          Salvar
        </Button>
      </div>
    </div>
  );
}

function TaskTable({
  tasks,
  statuses,
  onToggleComplete,
  onDeleteTask,
  onEditTask,
  onQuickAdd,
  formatDate,
  getPriorityLabel,
  getStatusInfo,
  handleStatusChange,
  handlePriorityChange,
}: TaskTableProps) {
  // Group by status
  const tasksByStatus = statuses.reduce((acc, status) => {
    acc[status.id] = tasks.filter(t => t.status_id === status.id);
    return acc;
  }, {} as Record<string, Task[]>);

  // Tasks without status
  const noStatusTasks = tasks.filter(t => !t.status_id);

  const [expandedStatuses, setExpandedStatuses] = useState<Record<string, boolean>>({});

  const toggleStatus = (statusId: string) => {
    setExpandedStatuses(prev => ({
      ...prev,
      [statusId]: prev[statusId] === false ? true : false,
    }));
  };

  const isStatusExpanded = (statusId: string) => {
    return expandedStatuses[statusId] !== false;
  };

  const allStatuses = [
    ...statuses,
    ...(noStatusTasks.length > 0 ? [{ id: 'no-status', name: 'Sem status', color: '#6b7280', order: 999, user_id: '', is_default: false, created_at: '' }] : [])
  ];

  return (
    <div>
      {allStatuses.map((status) => {
        const statusTasks = status.id === 'no-status' ? noStatusTasks : (tasksByStatus[status.id] || []);
        if (statusTasks.length === 0 && status.id !== 'no-status') return null;

        return (
          <div key={status.id}>
            {/* Status header */}
            <button
              onClick={() => toggleStatus(status.id)}
              className="w-full flex items-center gap-2 px-6 py-2 hover:bg-muted/20 transition-colors"
            >
              {isStatusExpanded(status.id) ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span
                className="text-xs font-medium px-2 py-0.5 rounded"
                style={{ 
                  backgroundColor: `${status.color}30`,
                  color: status.color 
                }}
              >
                {status.name.toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground">{statusTasks.length}</span>
            </button>

            {/* Table header */}
            {isStatusExpanded(status.id) && statusTasks.length > 0 && (
              <>
                <div className="grid grid-cols-[1fr,140px,100px,100px,100px,80px,40px] gap-2 px-6 py-1.5 text-xs text-muted-foreground border-b border-border/10">
                  <span className="pl-8">Nome</span>
                  <span>Status</span>
                  <span>Data início</span>
                  <span>Vencimento</span>
                  <span>Prioridade</span>
                  <span>Tempo</span>
                  <span></span>
                </div>

                {/* Task rows */}
                {statusTasks.map((task) => {
                  const statusInfo = getStatusInfo(task.status_id);
                  const priorityInfo = getPriorityLabel(task.priority);

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "group grid grid-cols-[1fr,140px,100px,100px,100px,80px,40px] gap-2 px-6 py-2 items-center hover:bg-muted/20 transition-colors border-b border-border/5",
                        task.completed && "opacity-50"
                      )}
                    >
                      {/* Name */}
                      <div className="flex items-center gap-2 min-w-0">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => onToggleComplete(task)}
                          className="shrink-0"
                        />
                        <span 
                          className={cn(
                            "text-sm truncate cursor-pointer hover:text-primary transition-colors",
                            task.completed && "line-through"
                          )}
                          onClick={() => onEditTask(task)}
                        >
                          {task.title}
                        </span>
                      </div>

                      {/* Status */}
                      <Select
                        value={task.status_id || ''}
                        onValueChange={(value) => handleStatusChange(task.id, value)}
                      >
                        <SelectTrigger className="h-7 text-xs border-0 bg-transparent hover:bg-muted/50">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{ 
                              backgroundColor: `${statusInfo.color}30`,
                              color: statusInfo.color 
                            }}
                          >
                            {statusInfo.name}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              <span
                                className="px-2 py-0.5 rounded text-xs"
                                style={{ 
                                  backgroundColor: `${s.color}30`,
                                  color: s.color 
                                }}
                              >
                                {s.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Start date */}
                      <span className={cn(
                        "text-xs",
                        task.start_date ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {formatDate(task.start_date) || '—'}
                      </span>

                      {/* Due date */}
                      <span className={cn(
                        "text-xs",
                        task.due_date ? "text-primary" : "text-muted-foreground"
                      )}>
                        {formatDate(task.due_date || task.date) || '—'}
                      </span>

                      {/* Priority */}
                      <Select
                        value={task.priority.toString()}
                        onValueChange={(value) => handlePriorityChange(task.id, value)}
                      >
                        <SelectTrigger className="h-7 text-xs border-0 bg-transparent hover:bg-muted/50">
                          <span
                            className={cn("px-2 py-0.5 rounded text-xs font-medium", priorityInfo.bg)}
                            style={{ color: priorityInfo.color }}
                          >
                            {priorityInfo.label}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">
                            <span className="text-red-500">🔴 Urgente</span>
                          </SelectItem>
                          <SelectItem value="2">
                            <span className="text-amber-500">🟡 Alta</span>
                          </SelectItem>
                          <SelectItem value="1">
                            <span className="text-blue-500">🔵 Normal</span>
                          </SelectItem>
                          <SelectItem value="0">
                            <span className="text-gray-500">⚪ Baixa</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Time estimate */}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        {task.time_estimate_minutes ? (
                          <>
                            <Clock className="h-3 w-3" />
                            {task.time_estimate_minutes >= 60 
                              ? `${Math.floor(task.time_estimate_minutes / 60)}h`
                              : `${task.time_estimate_minutes}m`}
                          </>
                        ) : (
                          '—'
                        )}
                      </span>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
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
                  );
                })}
              </>
            )}

            {/* Inline add task */}
            {isStatusExpanded(status.id) && (
              <InlineAddTask onAdd={onQuickAdd} />
            )}
          </div>
        );
      })}
    </div>
  );
}
