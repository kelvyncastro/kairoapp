import { useState, useMemo } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2, MoreHorizontal, LayoutList, LayoutGrid, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NeonCheckbox } from '@/components/ui/animated-check-box';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface DemoTask {
  id: string;
  title: string;
  folder_id: string;
  status: string;
  statusColor: string;
  priority: number;
  completed: boolean;
  due_date?: string;
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
  { id: '1', title: 'Finalizar relatório mensal', folder_id: 'f1', status: 'Em Progresso', statusColor: '#f59e0b', priority: 2, completed: false, due_date: 'Hoje' },
  { id: '2', title: 'Reunião com equipe', folder_id: 'f1', status: 'Não Iniciada', statusColor: '#6b7280', priority: 3, completed: false, due_date: 'Amanhã' },
  { id: '3', title: 'Revisar proposta comercial', folder_id: 'f1', status: 'Não Iniciada', statusColor: '#6b7280', priority: 1, completed: false },
  { id: '4', title: 'Enviar e-mails pendentes', folder_id: 'f1', status: 'Concluída', statusColor: '#22c55e', priority: 1, completed: true },
  { id: '5', title: 'Treinar às 7h', folder_id: 'f2', status: 'Concluída', statusColor: '#22c55e', priority: 2, completed: true },
  { id: '6', title: 'Comprar mantimentos', folder_id: 'f2', status: 'Não Iniciada', statusColor: '#6b7280', priority: 1, completed: false, due_date: 'Hoje' },
  { id: '7', title: 'Marcar consulta médica', folder_id: 'f2', status: 'Em Progresso', statusColor: '#f59e0b', priority: 2, completed: false },
  { id: '8', title: 'Estudar React avançado', folder_id: 'f3', status: 'Em Progresso', statusColor: '#f59e0b', priority: 2, completed: false },
  { id: '9', title: 'Ler capítulo 5 do livro', folder_id: 'f3', status: 'Não Iniciada', statusColor: '#6b7280', priority: 1, completed: false },
  { id: '10', title: 'Fazer exercícios do curso', folder_id: 'f3', status: 'Concluída', statusColor: '#22c55e', priority: 1, completed: true },
];

const priorityLabels: Record<number, { label: string; color: string }> = {
  3: { label: 'Urgente', color: '#ef4444' },
  2: { label: 'Alta', color: '#f59e0b' },
  1: { label: 'Normal', color: '#3b82f6' },
  0: { label: 'Baixa', color: '#6b7280' },
};

export function DemoTarefas() {
  const [tasks, setTasks] = useState<DemoTask[]>(initialTasks);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ f1: true, f2: true, f3: true });
  const [showCompleted, setShowCompleted] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [addingInFolder, setAddingInFolder] = useState<string | null>(null);

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

  const visibleTasks = showCompleted ? tasks : tasks.filter(t => !t.completed);
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30 flex-shrink-0">
        <div className="flex items-center gap-1 bg-muted/30 rounded-md p-0.5">
          <Button variant="secondary" size="sm" className="h-7 px-2">
            <LayoutList className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Lista</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2">
            <LayoutGrid className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Quadro</span>
          </Button>
        </div>
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-7 text-xs border border-border rounded-lg", showCompleted && "bg-muted")}
          onClick={() => setShowCompleted(!showCompleted)}
        >
          Fechados {completedCount > 0 && <span className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded-full">{completedCount}</span>}
        </Button>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {DEMO_FOLDERS.map(folder => {
          const folderTasks = visibleTasks.filter(t => t.folder_id === folder.id);
          const isExpanded = expandedFolders[folder.id] !== false;

          return (
            <div key={folder.id} className="border-b border-border/20">
              {/* Folder header */}
              <button
                onClick={() => setExpandedFolders(prev => ({ ...prev, [folder.id]: !isExpanded }))}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <div className="h-4 w-4 rounded" style={{ backgroundColor: folder.color + '40' }}>
                  <FolderOpen className="h-4 w-4" style={{ color: folder.color }} />
                </div>
                <span className="font-medium">{folder.name}</span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: folder.color + '30', color: folder.color }}>
                  {folder.name.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">{folderTasks.length} tarefas</span>
              </button>

              {/* Tasks */}
              {isExpanded && (
                <div>
                  {folderTasks.map(task => (
                    <div key={task.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors group border-b border-border/10">
                      <NeonCheckbox
                        size={22}
                        checked={task.completed}
                        onChange={() => toggleComplete(task.id)}
                      />
                      <span className={cn("flex-1 text-sm", task.completed && "line-through text-muted-foreground")}>{task.title}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: task.statusColor + '20', color: task.statusColor }}>
                        {task.status}
                      </span>
                      {task.due_date && (
                        <span className="text-xs text-muted-foreground">{task.due_date}</span>
                      )}
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: priorityLabels[task.priority]?.color + '20', color: priorityLabels[task.priority]?.color }}>
                        {priorityLabels[task.priority]?.label}
                      </span>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => deleteTask(task.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                  {/* Quick add */}
                  {addingInFolder === folder.id ? (
                    <div className="flex items-center gap-2 px-4 py-2">
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
                        className="h-8 text-sm"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingInFolder(folder.id)}
                      className="w-full flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors text-sm"
                    >
                      <Plus className="h-4 w-4" />
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
  );
}
