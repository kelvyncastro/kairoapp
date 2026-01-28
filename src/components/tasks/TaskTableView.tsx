import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Plus,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Clock,
  GripVertical,
  Settings2,
  CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
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
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Task, TaskStatus, TaskFolder } from '@/types/tasks';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FolderIconRenderer } from './FolderIconRenderer';

// Column configuration
interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  width: number;
  minWidth: number;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'title', label: 'Nome', visible: true, width: 250, minWidth: 150 },
  { id: 'status', label: 'Status', visible: true, width: 140, minWidth: 100 },
  { id: 'start_date', label: 'Data início', visible: true, width: 120, minWidth: 100 },
  { id: 'due_date', label: 'Vencimento', visible: true, width: 120, minWidth: 100 },
  { id: 'priority', label: 'Prioridade', visible: true, width: 110, minWidth: 90 },
  { id: 'time_estimate', label: 'Tempo', visible: true, width: 100, minWidth: 80 },
];

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
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_COLUMNS);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

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

  const toggleColumnVisibility = (columnId: string) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
  };

  const handleColumnResize = (columnId: string, delta: number) => {
    setColumns(prev => prev.map(col => {
      if (col.id === columnId) {
        const newWidth = Math.max(col.minWidth, col.width + delta);
        return { ...col, width: newWidth };
      }
      return col;
    }));
  };

  const handleColumnDragStart = (columnId: string) => {
    setDraggedColumn(columnId);
  };

  const handleColumnDragOver = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!draggedColumn || draggedColumn === targetColumnId) return;
    
    setColumns(prev => {
      const draggedIndex = prev.findIndex(c => c.id === draggedColumn);
      const targetIndex = prev.findIndex(c => c.id === targetColumnId);
      
      const newColumns = [...prev];
      const [removed] = newColumns.splice(draggedIndex, 1);
      newColumns.splice(targetIndex, 0, removed);
      
      return newColumns;
    });
  };

  const handleColumnDragEnd = () => {
    setDraggedColumn(null);
  };

  const visibleColumns = columns.filter(c => c.visible);
  const gridTemplateColumns = `40px ${visibleColumns.map(c => `${c.width}px`).join(' ')} 40px`;

  return (
    <div className="flex-1 overflow-auto">
      {/* Column settings */}
      <div className="flex justify-end px-4 py-2 border-b border-border/20">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs">
              <Settings2 className="h-3.5 w-3.5 mr-1.5" />
              Colunas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover">
            {columns.map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                checked={col.visible}
                onCheckedChange={() => toggleColumnVisibility(col.id)}
              >
                {col.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
                columns={visibleColumns}
                gridTemplateColumns={gridTemplateColumns}
                onToggleComplete={onToggleComplete}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                onQuickAdd={(title) => onQuickCreateTask(title, folder.id)}
                formatDate={formatDate}
                getPriorityLabel={getPriorityLabel}
                getStatusInfo={getStatusInfo}
                handleStatusChange={handleStatusChange}
                handlePriorityChange={handlePriorityChange}
                onColumnResize={handleColumnResize}
                onColumnDragStart={handleColumnDragStart}
                onColumnDragOver={handleColumnDragOver}
                onColumnDragEnd={handleColumnDragEnd}
                draggedColumn={draggedColumn}
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
              columns={visibleColumns}
              gridTemplateColumns={gridTemplateColumns}
              onToggleComplete={onToggleComplete}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              onQuickAdd={(title) => onQuickCreateTask(title, null)}
              formatDate={formatDate}
              getPriorityLabel={getPriorityLabel}
              getStatusInfo={getStatusInfo}
              handleStatusChange={handleStatusChange}
              handlePriorityChange={handlePriorityChange}
              onColumnResize={handleColumnResize}
              onColumnDragStart={handleColumnDragStart}
              onColumnDragOver={handleColumnDragOver}
              onColumnDragEnd={handleColumnDragEnd}
              draggedColumn={draggedColumn}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Separate TaskTable component
interface TaskTableProps {
  tasks: Task[];
  statuses: TaskStatus[];
  columns: ColumnConfig[];
  gridTemplateColumns: string;
  onToggleComplete: (task: Task) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onQuickAdd: (title: string) => void;
  formatDate: (date: string | null) => string | null;
  getPriorityLabel: (priority: number) => { label: string; color: string; bg: string };
  getStatusInfo: (statusId: string | null) => { name: string; color: string };
  handleStatusChange: (taskId: string, statusId: string) => void;
  handlePriorityChange: (taskId: string, priority: string) => void;
  onColumnResize: (columnId: string, delta: number) => void;
  onColumnDragStart: (columnId: string) => void;
  onColumnDragOver: (e: React.DragEvent, targetColumnId: string) => void;
  onColumnDragEnd: () => void;
  draggedColumn: string | null;
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
        placeholder="Nome da tarefa..."
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

// Inline editable title
function EditableTitle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = () => {
    if (tempValue.trim() && tempValue !== value) {
      onChange(tempValue.trim());
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') {
            setTempValue(value);
            setEditing(false);
          }
        }}
        className="flex-1 bg-transparent text-sm focus:outline-none border-b border-primary"
      />
    );
  }

  return (
    <span
      className="text-sm truncate cursor-pointer hover:text-primary transition-colors"
      onClick={() => {
        setTempValue(value);
        setEditing(true);
      }}
    >
      {value}
    </span>
  );
}

// Inline date picker
function EditableDate({ value, onChange, placeholder }: { value: string | null; onChange: (v: string | null) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const date = value ? parseISO(value) : undefined;

  const formatDisplayDate = (dateStr: string | null) => {
    if (!dateStr) return placeholder;
    const d = parseISO(dateStr);
    if (isToday(d)) return 'Hoje';
    if (isTomorrow(d)) return 'Amanhã';
    return format(d, "d MMM", { locale: ptBR });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "text-xs px-2 py-1 rounded hover:bg-muted/50 transition-colors flex items-center gap-1",
            value ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-3 w-3" />
          {formatDisplayDate(value)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-popover" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            onChange(d ? format(d, 'yyyy-MM-dd') : null);
            setOpen(false);
          }}
          initialFocus
          className="p-3 pointer-events-auto"
        />
        {value && (
          <div className="p-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-destructive"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Limpar data
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Inline time estimate picker
function EditableTimeEstimate({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState(value ? Math.floor(value / 60) : 0);
  const [minutes, setMinutes] = useState(value ? value % 60 : 0);

  const handleSave = () => {
    const total = hours * 60 + minutes;
    onChange(total > 0 ? total : null);
    setOpen(false);
  };

  const formatTime = (mins: number | null) => {
    if (!mins) return '—';
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
    return `${mins}m`;
  };

  return (
    <Popover open={open} onOpenChange={(o) => {
      if (o) {
        setHours(value ? Math.floor(value / 60) : 0);
        setMinutes(value ? value % 60 : 0);
      }
      setOpen(o);
    }}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "text-xs px-2 py-1 rounded hover:bg-muted/50 transition-colors flex items-center gap-1",
            value ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <Clock className="h-3 w-3" />
          {formatTime(value)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3 bg-popover" align="start">
        <div className="space-y-3">
          <div className="text-xs font-medium text-muted-foreground">Tempo estimado</div>
          
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Horas</label>
              <Input
                type="number"
                min={0}
                max={99}
                value={hours}
                onChange={(e) => setHours(parseInt(e.target.value) || 0)}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground">Minutos</label>
              <Input
                type="number"
                min={0}
                max={59}
                value={minutes}
                onChange={(e) => setMinutes(parseInt(e.target.value) || 0)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              Limpar
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs"
              onClick={handleSave}
            >
              Salvar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Column resize handle
function ResizeHandle({ onResize }: { onResize: (delta: number) => void }) {
  const handleRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startXRef.current = e.clientX;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startXRef.current;
      onResize(delta);
      startXRef.current = moveEvent.clientX;
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={handleRef}
      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors group"
      onMouseDown={handleMouseDown}
    >
      <div className="absolute inset-y-0 -left-1 -right-1" />
    </div>
  );
}

function TaskTable({
  tasks,
  statuses,
  columns,
  gridTemplateColumns,
  onToggleComplete,
  onUpdateTask,
  onDeleteTask,
  onQuickAdd,
  formatDate,
  getPriorityLabel,
  getStatusInfo,
  handleStatusChange,
  handlePriorityChange,
  onColumnResize,
  onColumnDragStart,
  onColumnDragOver,
  onColumnDragEnd,
  draggedColumn,
}: TaskTableProps) {
  const renderCell = (task: Task, columnId: string) => {
    switch (columnId) {
      case 'title':
        return (
          <EditableTitle
            value={task.title}
            onChange={(v) => onUpdateTask(task.id, { title: v })}
          />
        );
      
      case 'status':
        const statusInfo = getStatusInfo(task.status_id);
        return (
          <Select
            value={task.status_id || ''}
            onValueChange={(value) => handleStatusChange(task.id, value)}
          >
            <SelectTrigger className="h-7 text-xs border-0 bg-transparent hover:bg-muted/50 p-0">
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
            <SelectContent className="bg-popover">
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
        );
      
      case 'start_date':
        return (
          <EditableDate
            value={task.start_date}
            onChange={(v) => onUpdateTask(task.id, { start_date: v })}
            placeholder="Início"
          />
        );
      
      case 'due_date':
        return (
          <EditableDate
            value={task.due_date || task.date}
            onChange={(v) => onUpdateTask(task.id, { due_date: v })}
            placeholder="Vencimento"
          />
        );
      
      case 'priority':
        const priorityInfo = getPriorityLabel(task.priority);
        return (
          <Select
            value={task.priority.toString()}
            onValueChange={(value) => handlePriorityChange(task.id, value)}
          >
            <SelectTrigger className="h-7 text-xs border-0 bg-transparent hover:bg-muted/50 p-0">
              <span
                className={cn("px-2 py-0.5 rounded text-xs font-medium", priorityInfo.bg)}
                style={{ color: priorityInfo.color }}
              >
                {priorityInfo.label}
              </span>
            </SelectTrigger>
            <SelectContent className="bg-popover">
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
        );
      
      case 'time_estimate':
        return (
          <EditableTimeEstimate
            value={task.time_estimate_minutes}
            onChange={(v) => onUpdateTask(task.id, { time_estimate_minutes: v })}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="overflow-x-auto">
      {/* Table header */}
      <div 
        className="flex items-center px-4 py-1.5 text-xs text-muted-foreground border-b border-border/10 bg-muted/10"
        style={{ display: 'grid', gridTemplateColumns }}
      >
        <span></span>
        {columns.map((col) => (
          <div
            key={col.id}
            className={cn(
              "relative flex items-center gap-1 px-2 select-none",
              draggedColumn === col.id && "opacity-50"
            )}
            draggable
            onDragStart={() => onColumnDragStart(col.id)}
            onDragOver={(e) => onColumnDragOver(e, col.id)}
            onDragEnd={onColumnDragEnd}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground/50 cursor-grab" />
            <span>{col.label}</span>
            <ResizeHandle onResize={(delta) => onColumnResize(col.id, delta)} />
          </div>
        ))}
        <span></span>
      </div>

      {/* Task rows */}
      {tasks.map((task) => (
        <div
          key={task.id}
          className={cn(
            "group flex items-center px-4 py-2 hover:bg-muted/20 transition-colors border-b border-border/5",
            task.completed && "opacity-50"
          )}
          style={{ display: 'grid', gridTemplateColumns }}
        >
          {/* Checkbox */}
          <div className="flex items-center justify-center">
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => onToggleComplete(task)}
            />
          </div>

          {/* Dynamic columns */}
          {columns.map((col) => (
            <div
              key={col.id}
              className={cn(
                "flex items-center min-w-0 px-1",
                task.completed && col.id === 'title' && "line-through"
              )}
            >
              {renderCell(task, col.id)}
            </div>
          ))}

          {/* Actions */}
          <div className="flex items-center justify-center">
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
        </div>
      ))}

      {/* Inline add task */}
      <InlineAddTask onAdd={onQuickAdd} />
    </div>
  );
}
