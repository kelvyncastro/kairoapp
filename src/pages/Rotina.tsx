import { useMemo, useState } from 'react';
import { LayoutList, LayoutGrid, FolderOpen } from 'lucide-react';
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MonthSelector } from '@/components/tasks/MonthSelector';
import { startOfMonth, endOfMonth, parseISO, isWithinInterval, isBefore, isAfter } from 'date-fns';

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
  const [folderSheetOpen, setFolderSheetOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);

  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    counts['null'] = tasks.filter(t => !t.folder_id).length;
    folders.forEach(f => {
      counts[f.id] = tasks.filter(t => t.folder_id === f.id).length;
    });
    return counts;
  }, [tasks, folders]);

  // Helper function to check if a task falls within a month
  const taskInMonth = (task: Task, monthDate: Date): boolean => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);

    const taskStart = task.start_date ? parseISO(task.start_date) : null;
    const taskEnd = task.due_date ? parseISO(task.due_date) : (task.date ? parseISO(task.date) : null);

    // Task has no dates - don't show in month filter
    if (!taskStart && !taskEnd) return false;

    // Task starts in this month
    if (taskStart && isWithinInterval(taskStart, { start: monthStart, end: monthEnd })) {
      return true;
    }

    // Task ends in this month
    if (taskEnd && isWithinInterval(taskEnd, { start: monthStart, end: monthEnd })) {
      return true;
    }

    // Task spans across this month (starts before, ends after)
    if (taskStart && taskEnd) {
      if (isBefore(taskStart, monthStart) && isAfter(taskEnd, monthEnd)) {
        return true;
      }
    }

    return false;
  };

  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Filter by completed status (archive completed tasks by default)
    if (!showCompleted) {
      result = result.filter(t => !t.completed);
    }

    // Filter by selected month
    if (selectedMonth) {
      result = result.filter(t => taskInMonth(t, selectedMonth));
    }

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
  }, [tasks, selectedFolderId, searchQuery, advancedFilters, showCompleted, selectedMonth]);

  const completedTasksCount = useMemo(() => {
    let result = tasks.filter(t => t.completed);
    if (selectedFolderId) {
      result = result.filter(t => t.folder_id === selectedFolderId);
    }
    return result.length;
  }, [tasks, selectedFolderId]);

  const selectedFolder = folders.find(f => f.id === selectedFolderId);

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
    try {
      await toggleTaskComplete(task);
    } catch (error) {
      console.error('Error toggling task complete:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    await deleteTask(id);
  };

  const handleLoadSavedFilter = (saved: SavedFilter) => {
    setAdvancedFilters(saved.filters);
  };

  const handleSelectFolder = (id: string | null) => {
    setSelectedFolderId(id);
    setFolderSheetOpen(false);
  };

  if (loading) {
    return (
      <div className="flex h-full -m-4 md:-m-6 overflow-hidden">
        <div className="w-56 border-r border-border/30 bg-background animate-pulse hidden md:block" />
        <div className="flex-1 flex flex-col">
          <div className="px-4 md:px-6 py-4 border-b border-border/30">
            <div className="h-8 w-48 bg-muted/30 rounded animate-pulse" />
          </div>
          <div className="flex-1 p-4 md:p-6">
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
    <div className="flex h-full -m-4 md:-m-6 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full">
        <TaskSidebar
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          onCreateFolder={createFolder}
          onUpdateFolder={updateFolder}
          onDeleteFolder={deleteFolder}
          taskCounts={taskCounts}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Header - more compact */}
        <div className="flex items-center justify-between px-4 md:px-6 py-2.5 border-b border-border/20">
          <div className="flex items-center gap-3">
            {/* Mobile folder button */}
            <Sheet open={folderSheetOpen} onOpenChange={setFolderSheetOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="outline" size="sm" className="gap-2 h-8">
                  <FolderOpen className="h-4 w-4" />
                  <span className="max-w-24 truncate">
                    {selectedFolder?.name || 'Todas'}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <TaskSidebar
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  onSelectFolder={handleSelectFolder}
                  onCreateFolder={createFolder}
                  onUpdateFolder={updateFolder}
                  onDeleteFolder={deleteFolder}
                  taskCounts={taskCounts}
                />
              </SheetContent>
            </Sheet>
            
            <div>
              <h1 className="text-lg md:text-xl font-bold leading-tight">Tarefas</h1>
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 rounded-lg px-2.5 py-1">
              <span className="font-semibold text-foreground">{filteredTasks.filter(t => !t.completed).length}</span>
              <span>pendentes</span>
            </div>
          </div>
        </div>

        {/* Toolbar - tighter */}
        <div className="flex items-center gap-2 px-4 md:px-6 py-1.5 border-b border-border/15 overflow-x-auto bg-muted/5">
          {/* View mode */}
          <div className="flex items-center bg-muted/40 rounded-lg p-0.5 shrink-0">
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="sm"
              className="h-7 px-2.5 text-xs rounded-md"
              onClick={() => setViewMode('list')}
            >
              <LayoutList className="h-3.5 w-3.5 md:mr-1.5" />
              <span className="hidden md:inline">Lista</span>
            </Button>
            <Button 
              variant={viewMode === 'board' ? 'secondary' : 'ghost'} 
              size="sm"
              className="h-7 px-2.5 text-xs rounded-md"
              onClick={() => setViewMode('board')}
            >
              <LayoutGrid className="h-3.5 w-3.5 md:mr-1.5" />
              <span className="hidden md:inline">Quadro</span>
            </Button>
          </div>

          <div className="h-3.5 w-px bg-border/30 shrink-0 hidden sm:block" />

          {/* Month Selector */}
          <MonthSelector
            selectedDate={selectedMonth}
            onDateChange={setSelectedMonth}
          />

          <div className="h-3.5 w-px bg-border/30 shrink-0 hidden sm:block" />

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
            showCompleted={showCompleted}
            completedTasksCount={completedTasksCount}
            onToggleShowCompleted={() => setShowCompleted(!showCompleted)}
            onToggleComplete={handleToggleComplete}
            onUpdateTask={updateTask}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
            onCreateTask={() => handleCreateTask()}
            onQuickCreateTask={handleQuickCreateTask}
            onCreateStatus={createStatus}
            onUpdateStatus={updateStatus}
            onDeleteStatus={deleteStatus}
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
