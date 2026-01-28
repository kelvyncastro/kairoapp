import { useState } from 'react';
import { 
  Plus, 
  ChevronDown, 
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Edit2,
  ListTodo,
  FolderIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { TaskFolder, COLOR_PALETTE, FOLDER_ICONS } from '@/types/tasks';
import { FolderIconRenderer } from './FolderIconRenderer';

interface TaskSidebarProps {
  folders: TaskFolder[];
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder: (folder: Partial<TaskFolder>) => Promise<TaskFolder | null>;
  onUpdateFolder: (id: string, updates: Partial<TaskFolder>) => Promise<boolean>;
  onDeleteFolder: (id: string) => Promise<boolean>;
  taskCounts: Record<string, number>;
}

export function TaskSidebar({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  taskCounts,
}: TaskSidebarProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<TaskFolder | null>(null);
  const [newFolder, setNewFolder] = useState({
    name: '',
    color: COLOR_PALETTE[0],
    icon: 'folder',
  });

  const handleCreateFolder = async () => {
    if (!newFolder.name.trim()) return;
    
    await onCreateFolder(newFolder);
    setNewFolder({ name: '', color: COLOR_PALETTE[0], icon: 'folder' });
    setDialogOpen(false);
  };

  const handleUpdateFolder = async () => {
    if (!editingFolder) return;
    
    await onUpdateFolder(editingFolder.id, {
      name: editingFolder.name,
      color: editingFolder.color,
      icon: editingFolder.icon,
    });
    setEditingFolder(null);
  };

  const handleDeleteFolder = async (id: string) => {
    await onDeleteFolder(id);
    if (selectedFolderId === id) {
      onSelectFolder(null);
    }
  };

  const totalTasks = Object.values(taskCounts).reduce((a, b) => a + b, 0);
  const unorganizedTasks = taskCounts['null'] || 0;

  return (
    <div className="w-64 border-r border-border bg-sidebar-background h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Tarefas</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {/* All tasks */}
        <button
          onClick={() => onSelectFolder(null)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
            selectedFolderId === null
              ? "bg-accent text-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          )}
        >
          <ListTodo className="h-4 w-4" />
          <span className="flex-1 text-left">Todas as tarefas</span>
          <span className="text-xs text-muted-foreground">{totalTasks}</span>
        </button>

        {/* Folders section */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-4">
          <CollapsibleTrigger className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground">
            {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <span>PASTAS</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 ml-auto"
              onClick={(e) => {
                e.stopPropagation();
                setDialogOpen(true);
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </CollapsibleTrigger>

          <CollapsibleContent className="space-y-1 mt-1">
            {/* Unorganized tasks */}
            {unorganizedTasks > 0 && (
              <button
                onClick={() => onSelectFolder('unorganized')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  selectedFolderId === 'unorganized'
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <FolderIcon className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-left">Sem pasta</span>
                <span className="text-xs text-muted-foreground">{unorganizedTasks}</span>
              </button>
            )}

            {folders.map((folder) => (
              <div
                key={folder.id}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors cursor-pointer",
                  selectedFolderId === folder.id
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
                onClick={() => onSelectFolder(folder.id)}
              >
                <FolderIconRenderer 
                  icon={folder.icon} 
                  color={folder.color}
                  className="h-4 w-4 shrink-0"
                />
                <span className="flex-1 truncate">{folder.name}</span>
                <span className="text-xs text-muted-foreground">
                  {taskCounts[folder.id] || 0}
                </span>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem onClick={() => setEditingFolder(folder)}>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDeleteFolder(folder.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Create folder dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Pasta</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={newFolder.name}
                onChange={(e) => setNewFolder({ ...newFolder, name: e.target.value })}
                placeholder="Nome da pasta"
              />
            </div>
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded-full transition-transform",
                      newFolder.color === color && "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewFolder({ ...newFolder, color })}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ícone</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {FOLDER_ICONS.slice(0, 40).map((icon) => (
                  <button
                    key={icon}
                    className={cn(
                      "w-8 h-8 rounded flex items-center justify-center transition-colors",
                      newFolder.icon === icon 
                        ? "bg-accent text-foreground" 
                        : "hover:bg-accent/50 text-muted-foreground"
                    )}
                    onClick={() => setNewFolder({ ...newFolder, icon })}
                  >
                    <FolderIconRenderer icon={icon} className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolder.name.trim()}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit folder dialog */}
      <Dialog open={!!editingFolder} onOpenChange={() => setEditingFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pasta</DialogTitle>
          </DialogHeader>
          {editingFolder && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={editingFolder.name}
                  onChange={(e) => setEditingFolder({ ...editingFolder, name: e.target.value })}
                  placeholder="Nome da pasta"
                />
              </div>
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      className={cn(
                        "w-6 h-6 rounded-full transition-transform",
                        editingFolder.color === color && "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110"
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditingFolder({ ...editingFolder, color })}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ícone</Label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {FOLDER_ICONS.slice(0, 40).map((icon) => (
                    <button
                      key={icon}
                      className={cn(
                        "w-8 h-8 rounded flex items-center justify-center transition-colors",
                        editingFolder.icon === icon 
                          ? "bg-accent text-foreground" 
                          : "hover:bg-accent/50 text-muted-foreground"
                      )}
                      onClick={() => setEditingFolder({ ...editingFolder, icon })}
                    >
                      <FolderIconRenderer icon={icon} className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFolder(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateFolder}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
