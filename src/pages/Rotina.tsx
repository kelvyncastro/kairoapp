import { useMemo, useState } from 'react';
import { LayoutList, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskData } from '@/hooks/useTaskData';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import { TaskSidebar } from '@/components/tasks/TaskSidebar';
import { TaskTableView } from '@/components/tasks/TaskTableView';
import { TaskBoardView } from '@/components/tasks/TaskBoardView';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { TaskFiltersAdvanced, FilterCondition, SavedFilter } from '@/components/tasks/TaskFiltersAdvanced';
import { applyFilters } from '@/utils/filterTasks';
import { Task, ViewMode } from '@/types/tasks';

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
    createStatus,
    updateStatus,
    deleteStatus,
  } = useTaskData();

  const { savedFilters, saveFilter, deleteFilter } = useSavedFilters();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatusId, setDefaultStatusId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [advancedFilters, setAdvancedFilters] = useState<FilterCondition[]>([]);

  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    counts['null'] = tasks.filter(t => !t.folder_id).length;
    folders.forEach(f => {
      counts[f.id] = tasks.filter(t => t.folder_id === f.id).length;
    });
    return counts;
  }, [tasks, folders]);

  const filteredTasks = useMemo(() => {
    let result = tasks;

    if (selectedFolderId) {
      result = result.filter(t => t.folder_id === selectedFolderId);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }

    result = applyFilters(result, advancedFilters);

    return result;
  }, [tasks, selectedFolderId, searchQuery, advancedFilters]);

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

  const naoIniciadaStatus = statuses.find(s => 
    s.name.toLowerCase().trim() === 'não iniciada'
  );

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
    } else {
      await createTask({
        ...taskData,
        status_id: taskData.status_id || defaultStatusId || naoIniciadaStatus?.id || (statuses[0]?.id ?? null),
      });
    }
  };

  const handleQuickCreateTask = async (title: string, folderId?: string | null, statusId?: string) => {
    await createTask({
      title,
      folder_id: folderId ?? selectedFolderId,
      status_id: statusId || naoIniciadaStatus?.id || statuses[0]?.id || null,
    });
  };

  const handleToggleComplete = async (task: Task) => {
    await toggleTaskComplete(task);
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
  };

  const handleLoadSavedFilter = (saved: SavedFilter) => {
    setAdvancedFilters(saved.filters);
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] -m-6">
        <div className="w-56 border-r border-border/30 bg-background animate-pulse" />
        <div className="flex-1 flex flex-col">
          <div className="px-6 py-4 border-b border-border/30">
            <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
          </div>
          <div className="flex-1 p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted/30 rounded animate-pulse" />
              ))}
            </div>
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
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
          <div>
            <h1 className="text-2xl font-bold">Rotina</h1>
            <p className="text-sm text-muted-foreground">Suas tarefas e projetos</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-border/30">
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

          {/* Advanced Filters */}
          <TaskFiltersAdvanced
            statuses={statuses}
            filters={advancedFilters}
            onFiltersChange={setAdvancedFilters}
            savedFilters={savedFilters}
            onSaveFilter={saveFilter}
            onDeleteSavedFilter={deleteFilter}
            onLoadSavedFilter={handleLoadSavedFilter}
          />

          <div className="flex-1" />
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
            onQuickCreateTask={handleQuickCreateTask}
            onCreateStatus={createStatus}
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
            onCreateStatus={createStatus}
            onUpdateStatus={updateStatus}
            onDeleteStatus={deleteStatus}
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
