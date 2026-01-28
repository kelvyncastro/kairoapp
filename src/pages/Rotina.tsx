import { useMemo, useState } from 'react';
import { Plus, Filter, SortAsc, Search, LayoutList, LayoutGrid, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useTaskData } from '@/hooks/useTaskData';
import { TaskSidebar } from '@/components/tasks/TaskSidebar';
import { TaskTableView } from '@/components/tasks/TaskTableView';
import { TaskBoardView } from '@/components/tasks/TaskBoardView';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { Task, ViewMode, SortField, SortDirection } from '@/types/tasks';
import { cn } from '@/lib/utils';

export default function Rotina() {
  const {
    tasks,
    folders,
    statuses,
    loading,
    selectedFolderId,
    setSelectedFolderId,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    createFolder,
    updateFolder,
    deleteFolder,
  } = useTaskData();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatusId, setDefaultStatusId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterPriority, setFilterPriority] = useState<number | null>(null);
  const [filterStatusId, setFilterStatusId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);

  // Calculate task counts per folder
  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    counts['null'] = tasks.filter(t => !t.folder_id).length;
    folders.forEach(f => {
      counts[f.id] = tasks.filter(t => t.folder_id === f.id).length;
    });
    return counts;
  }, [tasks, folders]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Filter by folder
    if (selectedFolderId) {
      result = result.filter(t => t.folder_id === selectedFolderId);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }

    // Filter by priority
    if (filterPriority !== null) {
      result = result.filter(t => t.priority === filterPriority);
    }

    // Filter by status
    if (filterStatusId) {
      result = result.filter(t => t.status_id === filterStatusId);
    }

    // Filter completed
    if (!showCompleted) {
      result = result.filter(t => !t.completed);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'priority':
          comparison = (b.priority || 0) - (a.priority || 0);
          break;
        case 'due_date':
          const dateA = a.due_date || a.date || '';
          const dateB = b.due_date || b.date || '';
          comparison = dateA.localeCompare(dateB);
          break;
        case 'created_at':
          comparison = (a.created_at || '').localeCompare(b.created_at || '');
          break;
        case 'status':
          const statusOrderA = statuses.find(s => s.id === a.status_id)?.order || 999;
          const statusOrderB = statuses.find(s => s.id === b.status_id)?.order || 999;
          comparison = statusOrderA - statusOrderB;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tasks, selectedFolderId, searchQuery, filterPriority, filterStatusId, showCompleted, sortField, sortDirection, statuses]);

  const handleCreateTask = (statusId?: string) => {
    setEditingTask(null);
    setDefaultStatusId(statusId);
    setDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setDefaultStatusId(undefined);
    setDialogOpen(true);
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
    } else {
      await createTask({
        ...taskData,
        status_id: taskData.status_id || defaultStatusId || (statuses[0]?.id ?? null),
      });
    }
  };

  const handleToggleComplete = async (task: Task) => {
    await toggleTaskComplete(task);
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
  };

  const hasActiveFilters = filterPriority !== null || filterStatusId !== null || !showCompleted;

  if (loading) {
    return (
      <div className="flex h-full">
        <div className="w-56 border-r border-border/30 bg-background animate-pulse" />
        <div className="flex-1 p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-6">
      {/* Sidebar */}
      <TaskSidebar
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelectFolder={setSelectedFolderId}
        onCreateFolder={createFolder}
        onUpdateFolder={updateFolder}
        onDeleteFolder={deleteFolder}
        taskCounts={taskCounts}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border/30">
          {/* View mode */}
          <div className="flex items-center gap-1 bg-muted/30 rounded-md p-0.5">
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="h-4 w-4 mr-1.5" />
              Lista
            </Button>
            <Button 
              variant={viewMode === 'board' ? 'secondary' : 'ghost'} 
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode('board')}
            >
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              Quadro
            </Button>
          </div>

          <div className="h-4 w-px bg-border/50" />

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-sm bg-muted/30 border-0"
            />
          </div>

          {/* Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={cn("h-8", hasActiveFilters && "text-primary")}>
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                Filtro
                {hasActiveFilters && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-primary" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-popover">
              <DropdownMenuLabel>Prioridade</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterPriority(null)}>
                Todas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority(3)}>
                🔴 Urgente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority(2)}>
                🟡 Alta
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority(1)}>
                🔵 Normal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority(0)}>
                ⚪ Baixa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterStatusId(null)}>
                Todos
              </DropdownMenuItem>
              {statuses.map((status) => (
                <DropdownMenuItem key={status.id} onClick={() => setFilterStatusId(status.id)}>
                  <span 
                    className="w-2.5 h-2.5 rounded-full mr-2"
                    style={{ backgroundColor: status.color }}
                  />
                  {status.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowCompleted(!showCompleted)}>
                {showCompleted ? '✓ ' : ''}Mostrar concluídas
              </DropdownMenuItem>
              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      setFilterPriority(null);
                      setFilterStatusId(null);
                      setShowCompleted(true);
                    }}
                    className="text-destructive"
                  >
                    Limpar filtros
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                <SortAsc className="h-3.5 w-3.5 mr-1.5" />
                Ordenar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="bg-popover">
              <DropdownMenuItem onClick={() => { setSortField('priority'); setSortDirection('desc'); }}>
                Prioridade ↓
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortField('priority'); setSortDirection('asc'); }}>
                Prioridade ↑
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortField('due_date'); setSortDirection('asc'); }}>
                Data ↓
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortField('due_date'); setSortDirection('desc'); }}>
                Data ↑
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortField('title'); setSortDirection('asc'); }}>
                Nome A-Z
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortField('status'); setSortDirection('asc'); }}>
                Status
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1" />

          {/* New task */}
          <Button size="sm" className="h-8" onClick={() => handleCreateTask()}>
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Tarefa
          </Button>
        </div>

        {/* Task view */}
        {viewMode === 'list' ? (
          <TaskTableView
            tasks={filteredTasks}
            statuses={statuses}
            folders={folders}
            selectedFolderId={selectedFolderId}
            onToggleComplete={handleToggleComplete}
            onUpdateTask={updateTask}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
            onCreateTask={() => handleCreateTask()}
          />
        ) : (
          <TaskBoardView
            tasks={filteredTasks}
            statuses={statuses}
            folders={folders}
            selectedFolderId={selectedFolderId}
            onToggleComplete={handleToggleComplete}
            onUpdateTask={updateTask}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
            onCreateTask={handleCreateTask}
          />
        )}
      </div>

      {/* Task dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        folders={folders}
        statuses={statuses}
        onSave={handleSaveTask}
        defaultFolderId={selectedFolderId}
      />
    </div>
  );
}
