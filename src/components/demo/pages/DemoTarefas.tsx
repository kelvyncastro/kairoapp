import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, ChevronDown, ChevronRight, Trash2, MoreHorizontal, LayoutList, LayoutGrid,
  FolderOpen, ListTodo, Settings2, Archive, EyeOff, PanelLeftClose, PanelLeft,
  ArrowUp, ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NeonCheckbox } from '@/components/ui/animated-check-box';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { FolderIconRenderer } from '@/components/tasks/FolderIconRenderer';

interface DemoTask {
  id: string;
  title: string;
  description?: string;
  folder_id: string;
  status: string;
  statusColor: string;
  priority: number;
  completed: boolean;
  due_date?: string;
  start_date?: string;
  time_estimate?: string;
}

interface DemoFolder {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const DEMO_FOLDERS: DemoFolder[] = [
  { id: 'f1', name: 'Trabalho', color: '#3b82f6', icon: 'briefcase' },
  { id: 'f2', name: 'Pessoal', color: '#8b5cf6', icon: 'user' },
  { id: 'f3', name: 'Estudos', color: '#22c55e', icon: 'graduation-cap' },
];

const DEMO_STATUSES = [
  { id: 's1', name: 'Não Iniciada', color: '#6b7280' },
  { id: 's2', name: 'Em Progresso', color: '#f59e0b' },
  { id: 's3', name: 'Concluída', color: '#22c55e' },
];

const initialTasks: DemoTask[] = [
  { id: '1', title: 'Finalizar relatório mensal', description: 'Relatório Q1 2026', folder_id: 'f1', status: 'Em Progresso', statusColor: '#f59e0b', priority: 2, completed: false, due_date: 'Hoje', start_date: '3 Fev', time_estimate: '2h' },
  { id: '2', title: 'Reunião com equipe', description: 'Alinhamento semanal', folder_id: 'f1', status: 'Não Iniciada', statusColor: '#6b7280', priority: 3, completed: false, due_date: 'Amanhã', start_date: '10 Fev', time_estimate: '1h' },
  { id: '3', title: 'Revisar proposta comercial', folder_id: 'f1', status: 'Não Iniciada', statusColor: '#6b7280', priority: 1, completed: false, start_date: '5 Fev' },
  { id: '4', title: 'Enviar e-mails pendentes', folder_id: 'f1', status: 'Concluída', statusColor: '#22c55e', priority: 1, completed: true },
  { id: '5', title: 'Treinar às 7h', description: 'Treino de pernas', folder_id: 'f2', status: 'Concluída', statusColor: '#22c55e', priority: 2, completed: true },
  { id: '6', title: 'Comprar mantimentos', folder_id: 'f2', status: 'Não Iniciada', statusColor: '#6b7280', priority: 1, completed: false, due_date: 'Hoje' },
  { id: '7', title: 'Marcar consulta médica', folder_id: 'f2', status: 'Em Progresso', statusColor: '#f59e0b', priority: 2, completed: false },
  { id: '8', title: 'Estudar React avançado', description: 'Hooks e performance', folder_id: 'f3', status: 'Em Progresso', statusColor: '#f59e0b', priority: 2, completed: false, time_estimate: '3h' },
  { id: '9', title: 'Ler capítulo 5 do livro', folder_id: 'f3', status: 'Não Iniciada', statusColor: '#6b7280', priority: 1, completed: false },
  { id: '10', title: 'Fazer exercícios do curso', folder_id: 'f3', status: 'Concluída', statusColor: '#22c55e', priority: 1, completed: true },
];

const priorityLabels: Record<number, { label: string; color: string }> = {
  3: { label: 'Urgente', color: '#ef4444' },
  2: { label: 'Alta', color: '#f59e0b' },
  1: { label: 'Normal', color: '#3b82f6' },
  0: { label: 'Baixa', color: '#6b7280' },
};

const COLUMNS = [
  { id: 'title', label: 'Nome', visible: true },
  { id: 'description', label: 'Descrição', visible: true },
  { id: 'status', label: 'Status', visible: true },
  { id: 'start_date', label: 'Data início', visible: true },
  { id: 'due_date', label: 'Vencimento', visible: true },
  { id: 'priority', label: 'Prioridade', visible: true },
  { id: 'time_estimate', label: 'Tempo', visible: true },
];

export function DemoTarefas() {
  const [tasks, setTasks] = useState<DemoTask[]>(initialTasks);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ f1: true, f2: true, f3: true });
  const [showCompleted, setShowCompleted] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingInFolder, setAddingInFolder] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [columns, setColumns] = useState(COLUMNS);

  const toggleComplete = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? {
      ...t,
      completed: !t.completed,
      status: !t.completed ? 'Concluída' : 'Não Iniciada',
      statusColor: !t.completed ? '#22c55e' : '#6b7280',
    } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addTask = (folderId: string) => {
    if (!newTaskTitle.trim()) return;
    const newTask: DemoTask = {
      id: `new-${Date.now()}`,
      title: newTaskTitle.trim(),
      folder_id: folderId,
      status: 'Não Iniciada',
      statusColor: '#6b7280',
      priority: 1,
      completed: false,
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setAddingInFolder(null);
  };

  const visibleTasks = useMemo(() => {
    let result = showCompleted ? tasks : tasks.filter(t => !t.completed);
    if (selectedFolderId) result = result.filter(t => t.folder_id === selectedFolderId);
    return result;
  }, [tasks, showCompleted, selectedFolderId]);

  const completedCount = tasks.filter(t => t.completed).length;
  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    counts['null'] = tasks.filter(t => !t.folder_id).length;
    DEMO_FOLDERS.forEach(f => { counts[f.id] = tasks.filter(t => t.folder_id === f.id).length; });
    return counts;
  }, [tasks]);

  const totalTasks = Object.values(taskCounts).reduce((a, b) => a + b, 0);

  const foldersToShow = selectedFolderId ? DEMO_FOLDERS.filter(f => f.id === selectedFolderId) : DEMO_FOLDERS;
  const visibleColumns = columns.filter(c => c.visible);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <motion.div
        className="hidden md:flex flex-col border-r border-border/40 bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95 h-full relative overflow-hidden"
        animate={{ width: sidebarCollapsed ? 56 : 224 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        <div className="flex-1 overflow-y-auto py-4 px-2">
          {!sidebarCollapsed && (
            <p className="px-3 mb-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
              Navegação
            </p>
          )}

          {/* All tasks */}
          <motion.button
            onClick={() => setSelectedFolderId(null)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-200 relative overflow-hidden",
              sidebarCollapsed && "justify-center px-2",
              selectedFolderId === null
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            <ListTodo className="h-4 w-4 shrink-0 relative z-10" />
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 flex-1 relative z-10 overflow-hidden">
                <span className="flex-1 text-left font-semibold whitespace-nowrap">Todas as tarefas</span>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center",
                  selectedFolderId === null ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {totalTasks}
                </span>
              </div>
            )}
          </motion.button>

          {/* Folders */}
          <div className="mt-6">
            {!sidebarCollapsed && (
              <div className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
                <ChevronDown className="h-3 w-3" />
                <span>Pastas</span>
                <div className="flex-1" />
                <Plus className="h-3.5 w-3.5 hover:text-primary cursor-pointer" />
              </div>
            )}

            <div className="space-y-1 mt-2">
              {DEMO_FOLDERS.map((folder, index) => (
                <motion.div
                  key={folder.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: sidebarCollapsed ? 0 : 4 }}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2 text-sm cursor-pointer rounded-xl transition-all duration-200",
                    sidebarCollapsed && "justify-center px-2",
                    selectedFolderId === folder.id
                      ? "bg-muted text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  onClick={() => setSelectedFolderId(folder.id)}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: `${folder.color}15`,
                      boxShadow: selectedFolderId === folder.id ? `0 0 0 2px ${folder.color}40` : 'none'
                    }}
                  >
                    <FolderIconRenderer icon={folder.icon} color={folder.color} className="h-4 w-4 shrink-0" />
                  </div>
                  {!sidebarCollapsed && (
                    <div className="flex items-center gap-2 flex-1 overflow-hidden">
                      <span className="flex-1 truncate font-medium">{folder.name}</span>
                      <span className={cn(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded-md transition-all min-w-[18px] text-center",
                        selectedFolderId === folder.id ? "bg-foreground/10" : "bg-transparent opacity-0 group-hover:opacity-100 group-hover:bg-muted"
                      )}>
                        {taskCounts[folder.id] || 0}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="p-3 border-t border-border/40 space-y-1.5 bg-gradient-to-t from-muted/30 to-transparent">
          <motion.button
            whileHover={{ scale: 1.02 }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl transition-all",
              sidebarCollapsed && "justify-center px-2"
            )}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span className="font-medium whitespace-nowrap">Nova pasta</span>}
          </motion.button>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-xl transition-all",
              sidebarCollapsed && "justify-center px-2"
            )}
          >
            {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!sidebarCollapsed && <span className="text-xs">Recolher</span>}
          </button>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-border/30">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Tarefas</h1>
              <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Suas tarefas e projetos</p>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 border-b border-border/30 overflow-x-auto">
          <div className="flex items-center gap-1 bg-muted/30 rounded-md p-0.5 shrink-0">
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2" onClick={() => setViewMode('list')}>
              <LayoutList className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">Lista</span>
            </Button>
            <Button variant={viewMode === 'board' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2" onClick={() => setViewMode('board')}>
              <LayoutGrid className="h-4 w-4 md:mr-1.5" />
              <span className="hidden md:inline">Quadro</span>
            </Button>
          </div>
          <div className="flex-1" />
        </div>

        {/* Column settings */}
        <div className="flex justify-end gap-2 px-4 py-1.5 border-b border-border/20 flex-shrink-0">
          <Button
            variant="ghost" size="sm"
            className={cn("h-7 text-xs border-2 border-border rounded-lg gap-1.5", showCompleted && "bg-muted border-primary/50")}
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted ? <EyeOff className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
            Fechados
            {completedCount > 0 && <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full">{completedCount}</span>}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-xs border-2 border-border rounded-lg">
                <Settings2 className="h-3.5 w-3.5 mr-1.5" />
                Colunas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover">
              {columns.map(col => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.visible}
                  onCheckedChange={() => setColumns(prev => prev.map(c => c.id === col.id ? { ...c, visible: !c.visible } : c))}
                >
                  {col.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-auto">
          {foldersToShow.map(folder => {
            const folderTasks = visibleTasks.filter(t => t.folder_id === folder.id);
            const isExpanded = expandedFolders[folder.id] !== false;

            return (
              <div key={folder.id} className="border-b border-border/20">
                {/* Folder header */}
                <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                  <button
                    onClick={() => setExpandedFolders(prev => ({ ...prev, [folder.id]: !isExpanded }))}
                    className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <FolderIconRenderer icon={folder.icon} color={folder.color} className="h-4 w-4" />
                    <span className="font-medium">{folder.name}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ backgroundColor: `${folder.color}30`, color: folder.color }}>
                      {folder.name.toUpperCase()}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">{folderTasks.length} tarefas</span>
                  </button>
                </div>

                {isExpanded && (
                  <div>
                    {/* Column headers */}
                    <div className="flex items-center gap-0 px-4 py-1.5 text-[11px] font-medium text-muted-foreground border-b border-border/10" style={{ minWidth: 'fit-content' }}>
                      <div className="w-10 shrink-0" />
                      {visibleColumns.map(col => (
                        <div key={col.id} className={cn(
                          "shrink-0 px-2 cursor-pointer hover:text-foreground transition-colors flex items-center gap-1",
                          col.id === 'title' ? 'flex-1 min-w-[150px]' :
                          col.id === 'description' ? 'w-[160px]' :
                          col.id === 'status' ? 'w-[120px]' :
                          col.id === 'start_date' ? 'w-[100px]' :
                          col.id === 'due_date' ? 'w-[100px]' :
                          col.id === 'priority' ? 'w-[90px]' :
                          'w-[80px]'
                        )}>
                          {col.label}
                        </div>
                      ))}
                      <div className="w-10 shrink-0" />
                    </div>

                    {/* Tasks */}
                    {folderTasks.map(task => (
                      <div key={task.id} className="flex items-center gap-0 px-4 py-2.5 hover:bg-muted/20 transition-colors group border-b border-border/10" style={{ minWidth: 'fit-content' }}>
                        <div className="w-10 shrink-0 flex items-center justify-center">
                          <NeonCheckbox size={22} checked={task.completed} onChange={() => toggleComplete(task.id)} />
                        </div>
                        {visibleColumns.map(col => {
                          if (col.id === 'title') return (
                            <div key={col.id} className="flex-1 min-w-[150px] px-2">
                              <span className={cn("text-sm", task.completed && "line-through text-muted-foreground")}>{task.title}</span>
                            </div>
                          );
                          if (col.id === 'description') return (
                            <div key={col.id} className="w-[160px] px-2">
                              <span className="text-xs text-muted-foreground truncate block">{task.description || '—'}</span>
                            </div>
                          );
                          if (col.id === 'status') return (
                            <div key={col.id} className="w-[120px] px-2">
                              <span className="text-xs px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: task.statusColor + '20', color: task.statusColor }}>
                                {task.status}
                              </span>
                            </div>
                          );
                          if (col.id === 'start_date') return (
                            <div key={col.id} className="w-[100px] px-2">
                              <span className="text-xs text-muted-foreground">{task.start_date || '—'}</span>
                            </div>
                          );
                          if (col.id === 'due_date') return (
                            <div key={col.id} className="w-[100px] px-2">
                              <span className={cn("text-xs", task.due_date === 'Hoje' ? 'text-destructive font-medium' : 'text-muted-foreground')}>{task.due_date || '—'}</span>
                            </div>
                          );
                          if (col.id === 'priority') return (
                            <div key={col.id} className="w-[90px] px-2">
                              <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: priorityLabels[task.priority]?.color + '20', color: priorityLabels[task.priority]?.color }}>
                                {priorityLabels[task.priority]?.label}
                              </span>
                            </div>
                          );
                          if (col.id === 'time_estimate') return (
                            <div key={col.id} className="w-[80px] px-2">
                              <span className="text-xs text-muted-foreground">{task.time_estimate || '—'}</span>
                            </div>
                          );
                          return null;
                        })}
                        <div className="w-10 shrink-0 flex items-center justify-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36 bg-popover">
                              <DropdownMenuItem className="text-destructive focus:text-destructive gap-2" onClick={() => deleteTask(task.id)}>
                                <Trash2 className="h-3.5 w-3.5" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}

                    {/* Quick add */}
                    {addingInFolder === folder.id ? (
                      <div className="flex items-center gap-2 px-4 py-2">
                        <div className="w-10" />
                        <Input
                          autoFocus
                          placeholder="Nome da tarefa..."
                          value={newTaskTitle}
                          onChange={e => setNewTaskTitle(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') addTask(folder.id);
                            if (e.key === 'Escape') { setAddingInFolder(null); setNewTaskTitle(''); }
                          }}
                          onBlur={() => { if (!newTaskTitle.trim()) setAddingInFolder(null); }}
                          className="h-8 text-sm flex-1"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingInFolder(folder.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors text-sm"
                      >
                        <div className="w-10 flex items-center justify-center">
                          <Plus className="h-4 w-4" />
                        </div>
                        Nova tarefa
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
