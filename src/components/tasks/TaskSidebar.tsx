import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  Plus,
  MoreHorizontal,
  ListTodo,
  Edit2,
  Trash2,
} from 'lucide-react';
import kairoLogo from '@/assets/kairo-logo.png';
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
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function TaskSidebar({
  folders,
  selectedFolderId,
  onSelectFolder,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  taskCounts,
  collapsed = false,
  onCollapsedChange,
}: TaskSidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<TaskFolder | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderColor, setFolderColor] = useState('#6366f1');
  const [folderIcon, setFolderIcon] = useState('folder');

  const totalTasks = Object.values(taskCounts).reduce((a, b) => a + b, 0);

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setFolderName('');
    setFolderColor('#6366f1');
    setFolderIcon('folder');
    setDialogOpen(true);
  };

  const handleEditFolder = (folder: TaskFolder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderColor(folder.color);
    setFolderIcon(folder.icon);
    setDialogOpen(true);
  };

  const handleSaveFolder = async () => {
    if (!folderName.trim()) return;

    if (editingFolder) {
      await onUpdateFolder(editingFolder.id, {
        name: folderName,
        color: folderColor,
        icon: folderIcon,
      });
    } else {
      await onCreateFolder({
        name: folderName,
        color: folderColor,
        icon: folderIcon,
      });
    }
    setDialogOpen(false);
  };

  const handleDeleteFolder = async (folder: TaskFolder) => {
    if (confirm(`Excluir pasta "${folder.name}"?`)) {
      await onDeleteFolder(folder.id);
      if (selectedFolderId === folder.id) {
        onSelectFolder(null);
      }
    }
  };

  return (
    <TooltipProvider delayDuration={0}>
      <>
        <div className={cn(
          "border-r border-border/30 bg-background flex flex-col h-full transition-all duration-300",
          collapsed ? "w-14" : "w-56"
        )}>
          {/* Logo Header */}
          <div className={cn(
            "flex h-14 items-center border-b border-border/30",
            collapsed ? "justify-center px-2" : "px-4"
          )}>
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg overflow-hidden shrink-0">
                <img
                  src={kairoLogo}
                  alt="Kairo"
                  className="w-full h-full object-cover"
                />
              </div>
              {!collapsed && (
                <span className="text-xl font-bold tracking-wide text-foreground">Kairo</span>
              )}
            </Link>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto py-1">
            {/* All tasks */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSelectFolder(null)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors",
                    collapsed && "justify-center px-2",
                    selectedFolderId === null 
                      ? "bg-muted/50 text-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                  )}
                >
                  <ListTodo className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">Todas as tarefas</span>
                      <span className="text-xs text-muted-foreground">{totalTasks}</span>
                    </>
                  )}
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  <p>Todas as tarefas ({totalTasks})</p>
                </TooltipContent>
              )}
            </Tooltip>

          {/* Folders section */}
          <div className="mt-2">
            {!collapsed && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground"
              >
                {expanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                <span>Pastas</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateFolder();
                  }}
                  className="ml-auto p-0.5 hover:bg-muted rounded"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </button>
            )}

            {(expanded || collapsed) && (
              <div className={cn("space-y-0.5", !collapsed && "mt-1")}>
                {folders.map((folder) => (
                  <Tooltip key={folder.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "group flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer transition-colors",
                          collapsed && "justify-center px-2",
                          selectedFolderId === folder.id
                            ? "bg-muted/50 text-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                        onClick={() => onSelectFolder(folder.id)}
                      >
                        <FolderIconRenderer 
                          icon={folder.icon} 
                          color={folder.color}
                          className="h-4 w-4 shrink-0"
                        />
                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{folder.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {taskCounts[folder.id] || 0}
                            </span>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-0.5 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-opacity"
                                >
                                  <MoreHorizontal className="h-3.5 w-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-32 bg-popover">
                                <DropdownMenuItem onClick={() => handleEditFolder(folder)}>
                                  <Edit2 className="h-3.5 w-3.5 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteFolder(folder)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right">
                        <p>{folder.name} ({taskCounts[folder.id] || 0})</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                ))}

                {folders.length === 0 && !collapsed && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    Nenhuma pasta criada
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom buttons */}
        <div className="p-2 border-t border-border/30 space-y-1">
          {/* Add folder button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleCreateFolder}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded transition-colors",
                  collapsed && "justify-center px-2"
                )}
              >
                <Plus className="h-4 w-4 shrink-0" />
                {!collapsed && <span>Nova pasta</span>}
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                <p>Nova pasta</p>
              </TooltipContent>
            )}
          </Tooltip>

          {/* Collapse toggle */}
          {onCollapsedChange && (
            <button
              onClick={() => onCollapsedChange(!collapsed)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded transition-colors",
                collapsed && "justify-center px-2"
              )}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4 shrink-0" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                  <span>Recolher</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Folder dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFolder ? 'Editar pasta' : 'Nova pasta'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nome</label>
              <Input
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Nome da pasta"
                autoFocus
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Cor</label>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PALETTE.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFolderColor(color)}
                    className={cn(
                      "w-6 h-6 rounded-full transition-transform hover:scale-110",
                      folderColor === color && "ring-2 ring-offset-2 ring-offset-background ring-white"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Ícone</label>
              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                {FOLDER_ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setFolderIcon(icon)}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded hover:bg-muted transition-colors",
                      folderIcon === icon && "bg-muted ring-1 ring-primary"
                    )}
                  >
                    <FolderIconRenderer 
                      icon={icon} 
                      color={folderColor}
                      className="h-4 w-4"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveFolder} disabled={!folderName.trim()}>
                {editingFolder ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </>
    </TooltipProvider>
  );
}
